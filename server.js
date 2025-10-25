import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

// Runtime configuration (can be set in .env)
const ALLOW_REMOTE_CONFIG_WRITES = process.env.ALLOW_REMOTE_CONFIG_WRITES === "true";
const CONFIG_API_KEY = process.env.CONFIG_API_KEY || null;
const PULSE_DECK_SECRET = process.env.PULSE_DECK_SECRET || os.hostname() || "pulse-deck-local";
const OVERLAY_TOKEN_TTL_HOURS = Number(process.env.OVERLAY_TOKEN_TTL_HOURS || 168);

// Middleware - allow larger payloads for emote uploads (client sends base64 JSON)
app.use(express.json({ limit: "10mb" }));
app.use(express.static(join(__dirname, "dist")));

// Config storage
let overlayConfig = null;
const CONFIG_FILE = join(__dirname, "overlay-config.json");
const DEFAULT_CONFIG_FILE = join(__dirname, "default-config.json");
const USER_DEFAULT_CONFIG_FILE = join(__dirname, "user-default-config.json");

// Auth tokens storage (UUID -> { createdAt, expiresAt, secret: { iv, authTag, payload } })
let authTokens = {};
const AUTH_FILE = join(__dirname, "auth-tokens.json");

const fsp = fs.promises;

// Encryption helpers (AES-256-GCM)
const ENCRYPTION_KEY = crypto.createHash("sha256").update(PULSE_DECK_SECRET).digest();

const encryptObject = (obj) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const json = JSON.stringify(obj);
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    payload: encrypted.toString("base64"),
  };
};

const decryptObject = (record) => {
  if (!record) return null;
  try {
    const iv = Buffer.from(record.iv, "base64");
    const authTag = Buffer.from(record.authTag, "base64");
    const encrypted = Buffer.from(record.payload, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch (err) {
    console.error("decryptObject error:", err);
    return null;
  }
};

const isLocalRequest = (req) => {
  const ip = (req.ip || req.connection?.remoteAddress || "").replace("::ffff:", "");
  return ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0";
};

const verifyConfigWriteAccess = (req, res, next) => {
  if (ALLOW_REMOTE_CONFIG_WRITES) return next();
  if (isLocalRequest(req)) return next();
  if (CONFIG_API_KEY && req.header("x-overlay-api-key") === CONFIG_API_KEY) return next();
  return res.status(403).json({ error: "Config writes only allowed from localhost or with valid API key" });
};

// Load config and auth tokens from file on startup (async-safe)
(async () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = await fsp.readFile(CONFIG_FILE, "utf-8");
      overlayConfig = JSON.parse(raw);
      console.log("✅ Loaded existing config from file");
    }
  } catch (err) {
    console.warn("⚠️  Could not load config file:", err.message);
  }

  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw = await fsp.readFile(AUTH_FILE, "utf-8");
      authTokens = JSON.parse(raw);
      console.log("✅ Loaded existing auth tokens from file");
    }
  } catch (err) {
    console.warn("⚠️  Could not load auth tokens file:", err.message);
  }
})();

// API endpoint to generate UUID token for OBS
app.post("/api/auth/generate", verifyConfigWriteAccess, async (req, res) => {
  const { clientId, apiKey } = req.body;

  if (!clientId || !apiKey) {
    return res.status(400).json({ error: "Missing clientId or apiKey" });
  }

  // Generate UUID and encrypt the credentials before persisting
  const uuid = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + OVERLAY_TOKEN_TTL_HOURS * 3600 * 1000).toISOString();

  const requesterIp = (req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "").replace(
    "::ffff:",
    ""
  );

  // Bind token to requesting IP by default to reduce token theft risk. Caller may pass bindToRequester: false to opt out.
  const bindToRequester = req.body?.bindToRequester !== false;
  const encrypted = encryptObject({ clientId, apiKey });
  authTokens[uuid] = { createdAt, expiresAt, secret: encrypted, ...(bindToRequester ? { boundIp: requesterIp } : {}) };

  try {
    await fsp.writeFile(AUTH_FILE, JSON.stringify(authTokens, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Error saving auth tokens:", err);
    return res.status(500).json({ error: "Failed to persist auth token" });
  }

  const obsUrl = `http://localhost:${PORT}/?token=${uuid}`;
  console.log(`🔑 Generated auth token: ${uuid}`);

  // Only return metadata, never raw credentials
  res.json({
    success: true,
    uuid,
    obsUrl,
    createdAt,
    expiresAt,
    message: "Use this URL in OBS Browser Source",
  });
});

// API endpoint to get credentials from UUID
app.get("/api/auth/:uuid", (req, res) => {
  const { uuid } = req.params;
  const record = authTokens[uuid];

  if (!record) {
    return res.status(404).json({ error: "Invalid or expired token" });
  }

  // Do NOT return raw secrets. Return only metadata.
  return res.json({ uuid, createdAt: record.createdAt, expiresAt: record.expiresAt });
});

// Helper to validate an auth token (exists, not expired, and bound IP matches if present)
const isAuthTokenValid = (uuid, req) => {
  const record = authTokens[uuid];
  if (!record) return false;
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) return false;
  if (record.boundIp) {
    const requesterIp = (req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "").replace(
      "::ffff:",
      ""
    );
    if (requesterIp !== record.boundIp) return false;
  }
  return true;
};

// API endpoint to list all tokens (for management)
app.get("/api/auth", (req, res) => {
  const tokens = Object.keys(authTokens).map((uuid) => ({
    uuid,
    createdAt: authTokens[uuid].createdAt,
    expiresAt: authTokens[uuid].expiresAt,
  }));
  res.json(tokens);
});

// API endpoint to delete a token
app.delete("/api/auth/:uuid", verifyConfigWriteAccess, async (req, res) => {
  const { uuid } = req.params;

  if (!authTokens[uuid]) {
    return res.status(404).json({ error: "Token not found" });
  }

  delete authTokens[uuid];
  try {
    await fsp.writeFile(AUTH_FILE, JSON.stringify(authTokens, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Error saving auth tokens:", err);
    return res.status(500).json({ error: "Failed to persist auth tokens" });
  }

  res.json({ success: true, message: "Token deleted" });
});

// API endpoint to get config
app.get("/api/config", (req, res) => {
  res.json(overlayConfig || {});
});

// Public environment values (safe to expose): VITE_ prefixed values needed by client/OBS
app.get("/api/public-env", (req, res) => {
  try {
    const clientId = process.env.VITE_TWITCH_CLIENT_ID || null;
    const redirectUri = process.env.VITE_TWITCH_REDIRECT_URI || null;

    // Only expose clientId when request is trusted:
    // - request from localhost OR
    // - ALLOW_REMOTE_CONFIG_WRITES is enabled OR
    // - request includes the valid CONFIG_API_KEY in x-overlay-api-key header
    const hasApiKeyHeader = CONFIG_API_KEY && req.header("x-overlay-api-key") === CONFIG_API_KEY;
    const trusted = ALLOW_REMOTE_CONFIG_WRITES || isLocalRequest(req) || hasApiKeyHeader;

    if (trusted) {
      return res.json({ clientId, redirectUri });
    }

    // Not trusted: do not return sensitive clientId
    return res.json({ clientId: null, redirectUri });
  } catch (err) {
    console.error("❌ Error reading public env:", err);
    res.status(500).json({ clientId: null, redirectUri: null });
  }
});

// API endpoint to update config
app.post("/api/config", verifyConfigWriteAccess, async (req, res) => {
  overlayConfig = req.body;

  // Save to file (async)
  try {
    await fsp.writeFile(CONFIG_FILE, JSON.stringify(overlayConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Error saving config:", err);
    return res.status(500).json({ error: "Error saving configuration" });
  }

  // Broadcast to all WebSocket clients (if available)
  try {
    if (typeof wss !== "undefined" && wss && wss.clients) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "CONFIG_UPDATE", config: overlayConfig }));
        }
      });
    }
  } catch (err) {
    console.warn("Warn broadcasting config update:", err);
  }

  res.json({ success: true });
});

// API endpoint to get default config (factory default)
app.get("/api/config/default", (req, res) => {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
      const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, "utf-8"));
      res.json(defaultConfig);
    } else {
      res.status(404).json({ error: "Default config not found" });
    }
  } catch (err) {
    console.error("❌ Error reading default config:", err);
    res.status(500).json({ error: "Error reading default config" });
  }
});

// API endpoint to get user's custom default config
app.get("/api/config/user-default", (req, res) => {
  try {
    if (fs.existsSync(USER_DEFAULT_CONFIG_FILE)) {
      const userDefault = JSON.parse(fs.readFileSync(USER_DEFAULT_CONFIG_FILE, "utf-8"));
      res.json(userDefault);
    } else {
      // If no user default exists, return factory default
      if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
        const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, "utf-8"));
        res.json(defaultConfig);
      } else {
        res.status(404).json({ error: "No default config found" });
      }
    }
  } catch (err) {
    console.error("❌ Error reading user default config:", err);
    res.status(500).json({ error: "Error reading user default config" });
  }
});

// API endpoint to save current config as user default
app.post("/api/config/user-default", verifyConfigWriteAccess, async (req, res) => {
  const config = req.body;
  try {
    await fsp.writeFile(USER_DEFAULT_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    console.log("✅ Saved user default config");
    res.json({ success: true, message: "User default configuration saved" });
  } catch (err) {
    console.error("❌ Error saving user default config:", err);
    res.status(500).json({ error: "Error saving user default config" });
  }
});

// API endpoint to reset to factory default
app.post("/api/config/reset-factory", verifyConfigWriteAccess, async (req, res) => {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
      const raw = await fsp.readFile(DEFAULT_CONFIG_FILE, "utf-8");
      const defaultConfig = JSON.parse(raw);
      overlayConfig = defaultConfig;

      // Save to current config
      await fsp.writeFile(CONFIG_FILE, JSON.stringify(overlayConfig, null, 2), "utf-8");

      // Broadcast to all WebSocket clients
      if (typeof wss !== "undefined" && wss && wss.clients) {
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: "CONFIG_UPDATE", config: overlayConfig }));
          }
        });
      }

      res.json({ success: true, config: overlayConfig });
    } else {
      res.status(404).json({ error: "Default config not found" });
    }
  } catch (err) {
    console.error("❌ Error resetting to factory default:", err);
    res.status(500).json({ error: "Error resetting configuration" });
  }
});

// API endpoint to reset to user default
app.post("/api/config/reset-user", verifyConfigWriteAccess, async (req, res) => {
  try {
    let configToUse = null;

    if (fs.existsSync(USER_DEFAULT_CONFIG_FILE)) {
      const raw = await fsp.readFile(USER_DEFAULT_CONFIG_FILE, "utf-8");
      configToUse = JSON.parse(raw);
    } else if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
      const raw = await fsp.readFile(DEFAULT_CONFIG_FILE, "utf-8");
      configToUse = JSON.parse(raw);
    }

    if (configToUse) {
      overlayConfig = configToUse;

      // Save to current config
      await fsp.writeFile(CONFIG_FILE, JSON.stringify(overlayConfig, null, 2), "utf-8");

      // Broadcast to all WebSocket clients
      if (typeof wss !== "undefined" && wss && wss.clients) {
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: "CONFIG_UPDATE", config: overlayConfig }));
          }
        });
      }

      res.json({ success: true, config: overlayConfig });
    } else {
      res.status(404).json({ error: "No default config found" });
    }
  } catch (err) {
    console.error("❌ Error resetting to user default:", err);
    res.status(500).json({ error: "Error resetting configuration" });
  }
});

// API endpoint to upload emote (async, sanitized, guarded)
app.post("/api/emotes/upload", verifyConfigWriteAccess, async (req, res) => {
  const { filename, data } = req.body;

  if (!filename || !data) {
    return res.status(400).json({ error: "Missing filename or data" });
  }

  // Sanitize filename to avoid path traversal and unsafe chars
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = safeFilename.toLowerCase().split(".").pop();
  const validExtensions = ["png", "jpg", "jpeg", "gif", "webp"];

  if (!validExtensions.includes(ext)) {
    return res.status(400).json({
      error: `Invalid file type. Supported formats: ${validExtensions.join(", ")}`,
    });
  }

  try {
    const emotesDir = join(__dirname, "public", "emotes");
    await fsp.mkdir(emotesDir, { recursive: true });

    // Remove data URL prefix if present (data:image/png;base64,...)
    const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const filepath = join(emotesDir, safeFilename);
    await fsp.writeFile(filepath, buffer);

    // Update emotes.json
    const emotesJsonPath = join(emotesDir, "emotes.json");
    let emotesData = [];

    try {
      const raw = await fsp.readFile(emotesJsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      emotesData = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // If file doesn't exist or is invalid, start fresh
      emotesData = [];
    }

    const existingIndex = emotesData.findIndex((e) => e.filename === safeFilename);

    if (existingIndex === -1) {
      emotesData.push({
        filename: safeFilename,
        name: safeFilename.replace(/\.[^/.]+$/, ""),
        addedAt: new Date().toISOString(),
      });

      await fsp.writeFile(emotesJsonPath, JSON.stringify(emotesData, null, 2), "utf-8");
      console.log(`✅ Uploaded emote: ${safeFilename}`);
      res.json({ success: true, message: "Emote uploaded successfully", filename: safeFilename });
    } else {
      // Replaced existing entry (file already overwritten above)
      res.json({ success: true, message: "Emote replaced successfully", filename: safeFilename, replaced: true });
    }
  } catch (err) {
    console.error("❌ Error uploading emote:", err);
    res.status(500).json({ error: "Error uploading emote: " + err.message });
  }
});

// API endpoint to list emotes
app.get("/api/emotes", (req, res) => {
  const emotesDir = join(__dirname, "public", "emotes");
  const emotesJsonPath = join(emotesDir, "emotes.json");

  try {
    if (fs.existsSync(emotesJsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(emotesJsonPath, "utf-8"));
      // Ensure it's an array
      const emotesData = Array.isArray(parsed) ? parsed : [];
      res.json(emotesData);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error("❌ Error reading emotes:", err);
    res.json([]);
  }
});

// API endpoint to delete an emote (async, sanitized, guarded)
app.delete("/api/emotes/:filename", verifyConfigWriteAccess, async (req, res) => {
  const { filename } = req.params;
  const emotesDir = join(__dirname, "public", "emotes");
  const emotesJsonPath = join(emotesDir, "emotes.json");

  try {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filepath = join(emotesDir, safeFilename);

    try {
      await fsp.unlink(filepath);
    } catch (err) {
      // If file doesn't exist, continue to update JSON (idempotent)
    }

    let emotesData = [];
    try {
      const raw = await fsp.readFile(emotesJsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      emotesData = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      emotesData = [];
    }

    emotesData = emotesData.filter((e) => e.filename !== safeFilename);
    await fsp.writeFile(emotesJsonPath, JSON.stringify(emotesData, null, 2), "utf-8");

    console.log(`✅ Deleted emote: ${safeFilename}`);
    res.json({ success: true, message: "Emote deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting emote:", err);
    res.status(500).json({ error: "Error deleting emote: " + err.message });
  }
});

// Helper function to fetch YouTube videos via RSS (no API key required)
async function handleYouTubeRSS(channelId, videoIndex, res) {
  // Extract channel ID if URL was provided
  if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
    const channelIdMatch = channelId.match(/channel\/(UC[\w-]+)/);
    if (channelIdMatch) {
      channelId = channelIdMatch[1];
    } else {
      // RSS doesn't work with @handles, need channel ID
      return res.status(400).json({
        error: "RSS feed requires channel ID (UCxxx...). For @handles, please provide a YouTube API key.",
      });
    }
  }

  if (!channelId.startsWith("UC")) {
    return res.status(400).json({
      error: "Invalid channel ID format. Expected UCxxx... format or provide YouTube API key for @handle support.",
    });
  }

  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    // Parse all entries to support videoIndex
    const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
    if (!entryMatches || entryMatches.length === 0) {
      return res.json({ text: "No videos found", subtext: "", thumbnail: null });
    }

    // Get the requested video by index
    if (videoIndex >= entryMatches.length) {
      return res.json({ text: `Only ${entryMatches.length} videos available`, subtext: "", thumbnail: null });
    }

    const entry = entryMatches[videoIndex].replace(/<\/?entry>/g, "");

    // Extract video ID
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    // Extract title
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : "Unknown Title";

    // Extract published date
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const publishedAt = publishedMatch ? new Date(publishedMatch[1]).toLocaleDateString() : "";

    // Extract thumbnail
    const thumbnailMatch = entry.match(/<media:thumbnail url="(.*?)"/);
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

    if (!videoId) {
      return res.json({ text: "No videos found", subtext: "", thumbnail: null });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    res.json({
      text: title,
      subtext: `Published ${publishedAt} (Note: May include Shorts - add API key to filter)`,
      thumbnail: thumbnail,
      url: url,
      videoId: videoId,
    });
  } catch (err) {
    console.error("❌ Error fetching YouTube RSS:", err);
    res.status(500).json({ error: "Error fetching YouTube RSS feed: " + err.message });
  }
}

// API endpoint to fetch YouTube channel's latest video (excluding Shorts)
app.get("/api/youtube/latest-video", async (req, res) => {
  let { apiKey, channelId, videoIndex } = req.query;

  if (!channelId) {
    return res.status(400).json({ error: "Missing channelId parameter" });
  }

  // videoIndex: which non-short video to return (0 = latest, 1 = second latest, etc.)
  const index = parseInt(videoIndex) || 0;

  // If no API key, use RSS feed fallback (can't filter Shorts, but works without auth)
  if (!apiKey) {
    console.log("⚠️ No YouTube API key provided, using RSS feed fallback (cannot filter Shorts)");
    return handleYouTubeRSS(channelId, index, res);
  }

  // Extract channel ID from URL if a URL was provided
  // Supports: youtube.com/channel/UCxxx, youtube.com/@username, youtube.com/c/channelname
  let forHandle = null;
  if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
    // Try to extract channel ID (UCxxx format)
    const channelIdMatch = channelId.match(/channel\/(UC[\w-]+)/);
    if (channelIdMatch) {
      channelId = channelIdMatch[1];
    } else {
      // Try to extract @handle
      const handleMatch = channelId.match(/@([\w-]+)/);
      if (handleMatch) {
        forHandle = handleMatch[1];
        channelId = null; // We'll search by handle instead
      } else {
        // Try /c/ or /user/ format
        const customMatch = channelId.match(/\/(?:c|user)\/([\w-]+)/);
        if (customMatch) {
          forHandle = customMatch[1];
          channelId = null;
        } else {
          return res.status(400).json({ error: "Invalid YouTube channel URL format" });
        }
      }
    }
  }

  try {
    let searchUrl;

    // If we have a handle, search by handle using forHandle parameter
    if (forHandle) {
      searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&forHandle=${forHandle}&part=snippet,id&order=date&maxResults=10&type=video`;
    } else if (channelId) {
      // Use channelId parameter
      searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&type=video`;
    } else {
      return res.status(400).json({ error: "No valid channel ID or handle provided" });
    }

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.error) {
      console.error("❌ YouTube API error:", data.error);
      return res.status(400).json({ error: data.error.message || "YouTube API error" });
    }

    if (!data.items || data.items.length === 0) {
      return res.json({ text: "No videos found", subtext: "", thumbnail: null });
    }

    // Filter out Shorts by checking video duration
    // Need to get video details to check duration
    const videoIds = data.items.map((item) => item.id.videoId).join(",");
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails,snippet`;

    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    if (videosData.error) {
      console.error("❌ YouTube API error:", videosData.error);
      return res.status(400).json({ error: videosData.error.message || "YouTube API error" });
    }

    // Filter all non-Short videos (duration >= 60 seconds)
    const nonShortVideos =
      videosData.items?.filter((video) => {
        const duration = video.contentDetails.duration;
        // Parse ISO 8601 duration (e.g., "PT1M30S" = 1min 30sec, "PT30S" = 30sec)
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return true; // If can't parse, include it

        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        // Videos under 60 seconds are considered Shorts
        return totalSeconds >= 60;
      }) || [];

    if (nonShortVideos.length === 0) {
      return res.json({ text: "No non-Short videos found", subtext: "", thumbnail: null });
    }

    // Get the video at the requested index
    if (index >= nonShortVideos.length) {
      return res.json({
        text: `Only ${nonShortVideos.length} non-Short videos available`,
        subtext: "",
        thumbnail: null,
      });
    }

    const nonShortVideo = nonShortVideos[index];

    const videoId = nonShortVideo.id;
    const title = nonShortVideo.snippet.title;
    const publishedAt = new Date(nonShortVideo.snippet.publishedAt).toLocaleDateString();
    const thumbnail = nonShortVideo.snippet.thumbnails?.medium?.url || nonShortVideo.snippet.thumbnails?.default?.url;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    res.json({
      text: title,
      subtext: `Published ${publishedAt}`,
      thumbnail: thumbnail,
      url: url,
      videoId: videoId,
    });
  } catch (err) {
    console.error("❌ Error fetching YouTube video:", err);
    res.status(500).json({ error: "Error fetching YouTube video: " + err.message });
  }
});

// Serve React app for all other routes (SPA fallback)
app.use((req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// Start HTTP server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws, req) => {
  const remoteAddr = (req.socket?.remoteAddress || "").replace("::ffff:", "");
  const hasApiKeyHeader = CONFIG_API_KEY && req.headers && req.headers["x-overlay-api-key"] === CONFIG_API_KEY;
  const trustedConn =
    ALLOW_REMOTE_CONFIG_WRITES || remoteAddr === "127.0.0.1" || remoteAddr === "::1" || hasApiKeyHeader;

  console.log("🔌 WebSocket client connected", remoteAddr, trustedConn ? "(trusted)" : "(untrusted)");

  // Send current config on connection (non-sensitive)
  if (overlayConfig) {
    ws.send(JSON.stringify({ type: "CONFIG_UPDATE", config: overlayConfig }));
  }

  // If connection is trusted, proactively send ENV (clientId may be null if not configured)
  const envPayload = {
    type: "ENV",
    clientId: process.env.VITE_TWITCH_CLIENT_ID || null,
    redirectUri: process.env.VITE_TWITCH_REDIRECT_URI || null,
  };
  if (trustedConn) {
    ws.send(JSON.stringify(envPayload));
  } else {
    // Otherwise require an auth step (token or API key) to reveal sensitive data
    ws.send(JSON.stringify({ type: "AUTH_REQUIRED" }));
  }

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (!msg || !msg.type) return;

      switch (msg.type) {
        case "HELLO": {
          // { type: 'HELLO', role: 'obs' }
          if (msg.role === "obs") {
            if (trustedConn) {
              ws.send(JSON.stringify(envPayload));
            } else {
              ws.send(JSON.stringify({ type: "AUTH_REQUIRED" }));
            }
          }
          break;
        }
        case "AUTH": {
          // { type: 'AUTH', apiKey?: '...', token?: '...' }
          if (msg.apiKey && CONFIG_API_KEY && msg.apiKey === CONFIG_API_KEY) {
            ws.send(JSON.stringify(envPayload));
            break;
          }

          if (msg.token && isAuthTokenValid(msg.token, req)) {
            ws.send(JSON.stringify(envPayload));
            break;
          }

          ws.send(JSON.stringify({ type: "ERROR", message: "unauthorized" }));
          break;
        }
        case "REQUEST_ENV": {
          // { type: 'REQUEST_ENV', token?: '...' }
          if (trustedConn) {
            ws.send(JSON.stringify(envPayload));
            break;
          }

          if (msg.token && isAuthTokenValid(msg.token, req)) {
            ws.send(JSON.stringify(envPayload));
            break;
          }

          ws.send(JSON.stringify({ type: "ERROR", message: "invalid or unauthorized token" }));
          break;
        }
        default:
          // unknown message types can be ignored or logged
          ws.send(JSON.stringify({ type: "ERROR", message: "unknown message type" }));
      }
    } catch (err) {
      console.warn("⚠️  Error handling ws message:", err);
      try {
        ws.send(JSON.stringify({ type: "ERROR", message: "invalid message format" }));
      } catch (e) {}
    }
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket client disconnected", remoteAddr);
  });
});

console.log(`🔌 WebSocket server running on ws://localhost:${WS_PORT}`);
