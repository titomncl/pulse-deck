import { useState, useEffect } from "react";
import { setTwitchApiKey, setTwitchClientId, getTwitchClientId } from "../config";
import { validateCredentials } from "../api";
import "../styles/ApiKeyPrompt.css";

// We'll fetch the runtime client ID from the server so OBS/browser sources
// always get the value from the server-side .env (no rebuild required).
// If the server doesn't provide a value, the UI will prompt for manual entry.
// Keep an optional fallback to import.meta.env in case the app is running in dev mode.
const STATIC_CLIENT_ID = import.meta?.env?.VITE_TWITCH_CLIENT_ID || "";

function ApiKeyPrompt({ onComplete }) {
  const [clientId, setClientIdState] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Try to obtain clientId from the server via WebSocket first, then fall back to HTTP
  useEffect(() => {
    const attemptWs = () => {
      return new Promise((resolve) => {
        try {
          const host = window.location.hostname || "localhost";
          const port = import.meta?.env?.VITE_WS_PORT || 3001;
          const protocol = window.location.protocol === "https:" ? "wss" : "ws";
          const url = `${protocol}://${host}:${port}`;
          const socket = new WebSocket(url);
          const timer = setTimeout(() => {
            try {
              socket.close();
            } catch (e) {}
            resolve(false);
          }, 1500);

          socket.onopen = () => {
            socket.send(JSON.stringify({ type: "HELLO", role: "obs" }));
            // If an obs token is present in the URL (e.g., ?token=UUID), send it to authenticate
            try {
              const params = new URLSearchParams(window.location.search);
              const tokenParam = params.get("token");
              if (tokenParam) {
                socket.send(JSON.stringify({ type: "AUTH", token: tokenParam }));
              }
            } catch (e) {}
          };

          socket.onmessage = (ev) => {
            try {
              const msg = JSON.parse(ev.data);
              if (msg.type === "ENV" && msg.clientId) {
                setClientIdState(msg.clientId);
                setTwitchClientId(msg.clientId);
                clearTimeout(timer);
                try {
                  socket.close();
                } catch (e) {}
                resolve(true);
              }

              if (msg.type === "AUTH_REQUIRED") {
                clearTimeout(timer);
                try {
                  socket.close();
                } catch (e) {}
                resolve(false);
              }
            } catch (e) {
              // ignore
            }
          };

          socket.onerror = () => {
            clearTimeout(timer);
            try {
              socket.close();
            } catch (e) {}
            resolve(false);
          };
        } catch (err) {
          resolve(false);
        }
      });
    };

    const fetchPublicEnv = async () => {
      try {
        const resp = await fetch("/api/public-env");
        if (resp.ok) {
          const json = await resp.json();
          if (json?.clientId) {
            setClientIdState(json.clientId);
            setTwitchClientId(json.clientId);
          }
        }
      } catch (err) {
        console.warn("Could not fetch public env:", err);
      }
    };

    (async () => {
      const wsOk = await attemptWs();
      if (!wsOk) await fetchPublicEnv();

      // Load saved client ID if available
      const savedClientId = getTwitchClientId();
      if (savedClientId) setClientIdState(savedClientId);

      // Check for OAuth implicit flow token in hash
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        if (accessToken) {
          const tokenClientId = getTwitchClientId() || STATIC_CLIENT_ID || "";
          if (tokenClientId) setTwitchClientId(tokenClientId);
          handleOAuthCallback(accessToken);
        }
      }
    })();
  }, []);

  const handleOAuthCallback = async (accessToken) => {
    setLoading(true);
    setError("");

    try {
      setTwitchApiKey(accessToken);
      const isValid = await validateCredentials();
      if (isValid) {
        window.history.replaceState(null, null, window.location.pathname);
        onComplete();
      } else {
        setError("Invalid access token received from Twitch");
      }
    } catch (err) {
      setError(`Failed to validate Twitch credentials: ${err.message}`);
      console.error("OAuth callback error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTwitchConnect = async () => {
    // Prefer server-provided client id (saved to localStorage earlier), then any manual entry,
    // then static build-time client id as last resort.
    const serverClientId = getTwitchClientId();
    const clientIdToUse = serverClientId || clientId || STATIC_CLIENT_ID;

    if (!clientIdToUse) {
      setError("Server did not provide a Client ID. Please set VITE_TWITCH_CLIENT_ID in .env or use manual setup.");
      setShowManualInput(true);
      return;
    }

    setTwitchClientId(clientIdToUse);

    // Determine redirect URI (prefer runtime-provided)
    let redirectUri = window.location.origin;
    try {
      const resp = await fetch("/api/public-env");
      if (resp.ok) {
        const { redirectUri: srvRedirect } = await resp.json();
        if (srvRedirect) redirectUri = srvRedirect;
      }
    } catch (err) {
      // ignore
    }

    const responseType = "token";
    const scope = "channel:read:subscriptions moderator:read:followers";

    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientIdToUse}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  const handleClientIdSubmit = (e) => {
    e.preventDefault();
    if (clientId.trim()) {
      setTwitchClientId(clientId);
      setShowManualInput(false);
    }
  };

  if (loading) {
    return (
      <div className="api-key-prompt-overlay">
        <div className="api-key-prompt">
          <div className="loading-spinner">
            <h2>Connecting to Twitch...</h2>
            <p>Please wait while we validate your credentials.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="api-key-prompt-overlay">
      <div className="api-key-prompt">
        <h2>Connect with Twitch</h2>
        <p className="description">
          Authorize this overlay to access your Twitch channel data. We'll need permission to read your follower and
          subscriber counts.
        </p>

        {!showManualInput ? (
          <>
            {error && <div className="error-message">{error}</div>}

            <button className="twitch-connect-btn" onClick={handleTwitchConnect} disabled={loading}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
              Connect with Twitch
            </button>

            <button className="manual-setup-link" onClick={() => setShowManualInput(true)}>
              Use custom Client ID
            </button>
          </>
        ) : (
          <form onSubmit={handleClientIdSubmit}>
            <div className="form-group">
              <label htmlFor="clientId">Twitch Client ID</label>
              <input
                type="text"
                id="clientId"
                value={clientId}
                onChange={(e) => setClientIdState(e.target.value)}
                placeholder="Your Twitch Application Client ID"
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn">
              Save Client ID
            </button>

            <button type="button" className="back-btn" onClick={() => setShowManualInput(false)}>
              Back
            </button>
          </form>
        )}

        <div className="help-section">
          <h3>First time setup:</h3>
          <ol>
            <li>
              Go to the{" "}
              <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener noreferrer">
                Twitch Developer Console
              </a>
            </li>
            <li>Click "Register Your Application"</li>
            <li>
              Fill in the details:
              <ul>
                <li>
                  <strong>Name:</strong> Stream Overlay (or any name)
                </li>
                <li>
                  <strong>OAuth Redirect URLs:</strong>{" "}
                  <code>
                    {window.location.origin}
                    {window.location.pathname}
                  </code>
                </li>
                <li>
                  <strong>Category:</strong> Broadcasting Suite
                </li>
              </ul>
            </li>
            <li>Click "Create" and copy your Client ID</li>
            <li>Click "Use custom Client ID" above and paste it</li>
            <li>Click "Connect with Twitch" to authorize</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyPrompt;
