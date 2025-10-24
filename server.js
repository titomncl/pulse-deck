import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const WS_PORT = 3001

// Middleware
app.use(express.json())
app.use(express.static(join(__dirname, 'dist')))

// Config storage
let overlayConfig = null
const CONFIG_FILE = join(__dirname, 'overlay-config.json')
const DEFAULT_CONFIG_FILE = join(__dirname, 'default-config.json')
const USER_DEFAULT_CONFIG_FILE = join(__dirname, 'user-default-config.json')

// Auth tokens storage (UUID -> credentials)
let authTokens = {}
const AUTH_FILE = join(__dirname, 'auth-tokens.json')

// Load config from file on startup
try {
  if (fs.existsSync(CONFIG_FILE)) {
    overlayConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    console.log('✅ Loaded existing config from file')
  }
} catch (err) {
  console.warn('⚠️  Could not load config file:', err.message)
}

// Load auth tokens from file on startup
try {
  if (fs.existsSync(AUTH_FILE)) {
    authTokens = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
    console.log('✅ Loaded existing auth tokens from file')
  }
} catch (err) {
  console.warn('⚠️  Could not load auth tokens file:', err.message)
}

// API endpoint to generate UUID token for OBS
app.post('/api/auth/generate', (req, res) => {
  const { clientId, apiKey } = req.body
  
  if (!clientId || !apiKey) {
    return res.status(400).json({ error: 'Missing clientId or apiKey' })
  }
  
  // Generate UUID
  const uuid = crypto.randomUUID()
  
  // Store credentials
  authTokens[uuid] = { clientId, apiKey, createdAt: new Date().toISOString() }
  
  // Save to file
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authTokens, null, 2))
  } catch (err) {
    console.error('❌ Error saving auth tokens:', err)
  }
  
  const obsUrl = `http://localhost:${PORT}/?token=${uuid}`
  console.log(`🔑 Generated auth token: ${uuid}`)
  
  res.json({ 
    success: true, 
    uuid, 
    obsUrl,
    message: 'Use this URL in OBS Browser Source' 
  })
})

// API endpoint to get credentials from UUID
app.get('/api/auth/:uuid', (req, res) => {
  const { uuid } = req.params
  const credentials = authTokens[uuid]
  
  if (!credentials) {
    return res.status(404).json({ error: 'Invalid or expired token' })
  }
  
  res.json(credentials)
})

// API endpoint to list all tokens (for management)
app.get('/api/auth', (req, res) => {
  const tokens = Object.keys(authTokens).map(uuid => ({
    uuid,
    createdAt: authTokens[uuid].createdAt
  }))
  res.json(tokens)
})

// API endpoint to delete a token
app.delete('/api/auth/:uuid', (req, res) => {
  const { uuid } = req.params
  
  if (authTokens[uuid]) {
    delete authTokens[uuid]
    
    // Save to file
    try {
      fs.writeFileSync(AUTH_FILE, JSON.stringify(authTokens, null, 2))
    } catch (err) {
      console.error('❌ Error saving auth tokens:', err)
    }
    
    res.json({ success: true, message: 'Token deleted' })
  } else {
    res.status(404).json({ error: 'Token not found' })
  }
})

// API endpoint to get config
app.get('/api/config', (req, res) => {
  res.json(overlayConfig || {})
})

// API endpoint to update config
app.post('/api/config', (req, res) => {
  overlayConfig = req.body
  
  // Save to file
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(overlayConfig, null, 2))
  } catch (err) {
    console.error('❌ Error saving config:', err)
  }
  
  // Broadcast to all WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({ type: 'CONFIG_UPDATE', config: overlayConfig }))
    }
  })
  
  res.json({ success: true })
})

// API endpoint to get default config (factory default)
app.get('/api/config/default', (req, res) => {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
      const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf-8'))
      res.json(defaultConfig)
    } else {
      res.status(404).json({ error: 'Default config not found' })
    }
  } catch (err) {
    console.error('❌ Error reading default config:', err)
    res.status(500).json({ error: 'Error reading default config' })
  }
})

// API endpoint to get user's custom default config
app.get('/api/config/user-default', (req, res) => {
  try {
    if (fs.existsSync(USER_DEFAULT_CONFIG_FILE)) {
      const userDefault = JSON.parse(fs.readFileSync(USER_DEFAULT_CONFIG_FILE, 'utf-8'))
      res.json(userDefault)
    } else {
      // If no user default exists, return factory default
      if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
        const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf-8'))
        res.json(defaultConfig)
      } else {
        res.status(404).json({ error: 'No default config found' })
      }
    }
  } catch (err) {
    console.error('❌ Error reading user default config:', err)
    res.status(500).json({ error: 'Error reading user default config' })
  }
})

// API endpoint to save current config as user default
app.post('/api/config/user-default', (req, res) => {
  const config = req.body
  
  try {
    fs.writeFileSync(USER_DEFAULT_CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log('✅ Saved user default config')
    res.json({ success: true, message: 'User default configuration saved' })
  } catch (err) {
    console.error('❌ Error saving user default config:', err)
    res.status(500).json({ error: 'Error saving user default config' })
  }
})

// API endpoint to reset to factory default
app.post('/api/config/reset-factory', (req, res) => {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
      const defaultConfig = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf-8'))
      overlayConfig = defaultConfig
      
      // Save to current config
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(overlayConfig, null, 2))
      
      // Broadcast to all WebSocket clients
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'CONFIG_UPDATE', config: overlayConfig }))
        }
      })
      
      res.json({ success: true, config: overlayConfig })
    } else {
      res.status(404).json({ error: 'Default config not found' })
    }
  } catch (err) {
    console.error('❌ Error resetting to factory default:', err)
    res.status(500).json({ error: 'Error resetting configuration' })
  }
})

// API endpoint to reset to user default
app.post('/api/config/reset-user', (req, res) => {
  try {
    let configToUse = null
    
    if (fs.existsSync(USER_DEFAULT_CONFIG_FILE)) {
      configToUse = JSON.parse(fs.readFileSync(USER_DEFAULT_CONFIG_FILE, 'utf-8'))
    } else if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
      configToUse = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf-8'))
    }
    
    if (configToUse) {
      overlayConfig = configToUse
      
      // Save to current config
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(overlayConfig, null, 2))
      
      // Broadcast to all WebSocket clients
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'CONFIG_UPDATE', config: overlayConfig }))
        }
      })
      
      res.json({ success: true, config: overlayConfig })
    } else {
      res.status(404).json({ error: 'No default config found' })
    }
  } catch (err) {
    console.error('❌ Error resetting to user default:', err)
    res.status(500).json({ error: 'Error resetting configuration' })
  }
})

// API endpoint to upload emote
app.post('/api/emotes/upload', (req, res) => {
  const { filename, data } = req.body
  
  if (!filename || !data) {
    return res.status(400).json({ error: 'Missing filename or data' })
  }
  
  // Validate file extension
  const ext = filename.toLowerCase().split('.').pop()
  const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp']
  
  if (!validExtensions.includes(ext)) {
    return res.status(400).json({ 
      error: `Invalid file type. Supported formats: ${validExtensions.join(', ')}` 
    })
  }
  
  try {
    // Create emotes directory if it doesn't exist
    const emotesDir = join(__dirname, 'public', 'emotes')
    if (!fs.existsSync(emotesDir)) {
      fs.mkdirSync(emotesDir, { recursive: true })
    }
    
    // Remove data URL prefix if present (data:image/png;base64,...)
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Save file
    const filepath = join(emotesDir, filename)
    fs.writeFileSync(filepath, buffer)
    
    // Update emotes.json
    const emotesJsonPath = join(emotesDir, 'emotes.json')
    let emotesData = []
    
    if (fs.existsSync(emotesJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(emotesJsonPath, 'utf-8'))
        // Ensure it's an array
        emotesData = Array.isArray(parsed) ? parsed : []
      } catch (err) {
        console.warn('⚠️  Could not parse emotes.json, creating new one')
        emotesData = []
      }
    }
    
    // Check if emote already exists
    const existingIndex = emotesData.findIndex(e => e.filename === filename)
    
    if (existingIndex === -1) {
      // Add new emote
      emotesData.push({
        filename: filename,
        name: filename.replace(/\.[^/.]+$/, ''), // Remove extension
        addedAt: new Date().toISOString()
      })
      
      fs.writeFileSync(emotesJsonPath, JSON.stringify(emotesData, null, 2))
      console.log(`✅ Uploaded emote: ${filename}`)
      res.json({ success: true, message: 'Emote uploaded successfully', filename })
    } else {
      // File already exists
      res.json({ 
        success: true, 
        message: 'Emote replaced successfully', 
        filename,
        replaced: true 
      })
    }
    
  } catch (err) {
    console.error('❌ Error uploading emote:', err)
    res.status(500).json({ error: 'Error uploading emote: ' + err.message })
  }
})

// API endpoint to list emotes
app.get('/api/emotes', (req, res) => {
  const emotesDir = join(__dirname, 'public', 'emotes')
  const emotesJsonPath = join(emotesDir, 'emotes.json')
  
  try {
    if (fs.existsSync(emotesJsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(emotesJsonPath, 'utf-8'))
      // Ensure it's an array
      const emotesData = Array.isArray(parsed) ? parsed : []
      res.json(emotesData)
    } else {
      res.json([])
    }
  } catch (err) {
    console.error('❌ Error reading emotes:', err)
    res.json([])
  }
})

// API endpoint to delete an emote
app.delete('/api/emotes/:filename', (req, res) => {
  const { filename } = req.params
  const emotesDir = join(__dirname, 'public', 'emotes')
  const emotesJsonPath = join(emotesDir, 'emotes.json')
  
  try {
    // Delete the file
    const filepath = join(emotesDir, filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
    
    // Update emotes.json
    let emotesData = []
    if (fs.existsSync(emotesJsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(emotesJsonPath, 'utf-8'))
      emotesData = Array.isArray(parsed) ? parsed : []
    }
    
    // Remove from list
    emotesData = emotesData.filter(e => e.filename !== filename)
    fs.writeFileSync(emotesJsonPath, JSON.stringify(emotesData, null, 2))
    
    console.log(`✅ Deleted emote: ${filename}`)
    res.json({ success: true, message: 'Emote deleted successfully' })
  } catch (err) {
    console.error('❌ Error deleting emote:', err)
    res.status(500).json({ error: 'Error deleting emote: ' + err.message })
  }
})

// Helper function to fetch YouTube videos via RSS (no API key required)
async function handleYouTubeRSS(channelId, videoIndex, res) {
  // Extract channel ID if URL was provided
  if (channelId.includes('youtube.com') || channelId.includes('youtu.be')) {
    const channelIdMatch = channelId.match(/channel\/(UC[\w-]+)/)
    if (channelIdMatch) {
      channelId = channelIdMatch[1]
    } else {
      // RSS doesn't work with @handles, need channel ID
      return res.status(400).json({ 
        error: 'RSS feed requires channel ID (UCxxx...). For @handles, please provide a YouTube API key.' 
      })
    }
  }
  
  if (!channelId.startsWith('UC')) {
    return res.status(400).json({ 
      error: 'Invalid channel ID format. Expected UCxxx... format or provide YouTube API key for @handle support.' 
    })
  }
  
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const response = await fetch(rssUrl)
    const xmlText = await response.text()
    
    // Parse all entries to support videoIndex
    const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g)
    if (!entryMatches || entryMatches.length === 0) {
      return res.json({ text: 'No videos found', subtext: '', thumbnail: null })
    }
    
    // Get the requested video by index
    if (videoIndex >= entryMatches.length) {
      return res.json({ text: `Only ${entryMatches.length} videos available`, subtext: '', thumbnail: null })
    }
    
    const entry = entryMatches[videoIndex].replace(/<\/?entry>/g, '')
    
    // Extract video ID
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null
    
    // Extract title
    const titleMatch = entry.match(/<title>(.*?)<\/title>/)
    const title = titleMatch ? titleMatch[1] : 'Unknown Title'
    
    // Extract published date
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/)
    const publishedAt = publishedMatch ? new Date(publishedMatch[1]).toLocaleDateString() : ''
    
    // Extract thumbnail
    const thumbnailMatch = entry.match(/<media:thumbnail url="(.*?)"/)
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null
    
    if (!videoId) {
      return res.json({ text: 'No videos found', subtext: '', thumbnail: null })
    }
    
    const url = `https://www.youtube.com/watch?v=${videoId}`
    
    res.json({
      text: title,
      subtext: `Published ${publishedAt} (Note: May include Shorts - add API key to filter)`,
      thumbnail: thumbnail,
      url: url,
      videoId: videoId
    })
  } catch (err) {
    console.error('❌ Error fetching YouTube RSS:', err)
    res.status(500).json({ error: 'Error fetching YouTube RSS feed: ' + err.message })
  }
}

// API endpoint to fetch YouTube channel's latest video (excluding Shorts)
app.get('/api/youtube/latest-video', async (req, res) => {
  let { apiKey, channelId, videoIndex } = req.query
  
  if (!channelId) {
    return res.status(400).json({ error: 'Missing channelId parameter' })
  }
  
  // videoIndex: which non-short video to return (0 = latest, 1 = second latest, etc.)
  const index = parseInt(videoIndex) || 0
  
  // If no API key, use RSS feed fallback (can't filter Shorts, but works without auth)
  if (!apiKey) {
    console.log('⚠️ No YouTube API key provided, using RSS feed fallback (cannot filter Shorts)')
    return handleYouTubeRSS(channelId, index, res)
  }
  
  // Extract channel ID from URL if a URL was provided
  // Supports: youtube.com/channel/UCxxx, youtube.com/@username, youtube.com/c/channelname
  let forHandle = null
  if (channelId.includes('youtube.com') || channelId.includes('youtu.be')) {
    // Try to extract channel ID (UCxxx format)
    const channelIdMatch = channelId.match(/channel\/(UC[\w-]+)/)
    if (channelIdMatch) {
      channelId = channelIdMatch[1]
    } else {
      // Try to extract @handle
      const handleMatch = channelId.match(/@([\w-]+)/)
      if (handleMatch) {
        forHandle = handleMatch[1]
        channelId = null // We'll search by handle instead
      } else {
        // Try /c/ or /user/ format
        const customMatch = channelId.match(/\/(?:c|user)\/([\w-]+)/)
        if (customMatch) {
          forHandle = customMatch[1]
          channelId = null
        } else {
          return res.status(400).json({ error: 'Invalid YouTube channel URL format' })
        }
      }
    }
  }
  
  try {
    let searchUrl
    
    // If we have a handle, search by handle using forHandle parameter
    if (forHandle) {
      searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&forHandle=${forHandle}&part=snippet,id&order=date&maxResults=10&type=video`
    } else if (channelId) {
      // Use channelId parameter
      searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&type=video`
    } else {
      return res.status(400).json({ error: 'No valid channel ID or handle provided' })
    }
    
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    if (data.error) {
      console.error('❌ YouTube API error:', data.error)
      return res.status(400).json({ error: data.error.message || 'YouTube API error' })
    }
    
    if (!data.items || data.items.length === 0) {
      return res.json({ text: 'No videos found', subtext: '', thumbnail: null })
    }
    
    // Filter out Shorts by checking video duration
    // Need to get video details to check duration
    const videoIds = data.items.map(item => item.id.videoId).join(',')
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails,snippet`
    
    const videosResponse = await fetch(videosUrl)
    const videosData = await videosResponse.json()
    
    if (videosData.error) {
      console.error('❌ YouTube API error:', videosData.error)
      return res.status(400).json({ error: videosData.error.message || 'YouTube API error' })
    }
    
    // Filter all non-Short videos (duration >= 60 seconds)
    const nonShortVideos = videosData.items?.filter(video => {
      const duration = video.contentDetails.duration
      // Parse ISO 8601 duration (e.g., "PT1M30S" = 1min 30sec, "PT30S" = 30sec)
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return true // If can't parse, include it
      
      const hours = parseInt(match[1] || 0)
      const minutes = parseInt(match[2] || 0)
      const seconds = parseInt(match[3] || 0)
      const totalSeconds = hours * 3600 + minutes * 60 + seconds
      
      // Videos under 60 seconds are considered Shorts
      return totalSeconds >= 60
    }) || []
    
    if (nonShortVideos.length === 0) {
      return res.json({ text: 'No non-Short videos found', subtext: '', thumbnail: null })
    }
    
    // Get the video at the requested index
    if (index >= nonShortVideos.length) {
      return res.json({ text: `Only ${nonShortVideos.length} non-Short videos available`, subtext: '', thumbnail: null })
    }
    
    const nonShortVideo = nonShortVideos[index]
    
    const videoId = nonShortVideo.id
    const title = nonShortVideo.snippet.title
    const publishedAt = new Date(nonShortVideo.snippet.publishedAt).toLocaleDateString()
    const thumbnail = nonShortVideo.snippet.thumbnails?.medium?.url || nonShortVideo.snippet.thumbnails?.default?.url
    const url = `https://www.youtube.com/watch?v=${videoId}`
    
    res.json({
      text: title,
      subtext: `Published ${publishedAt}`,
      thumbnail: thumbnail,
      url: url,
      videoId: videoId
    })
  } catch (err) {
    console.error('❌ Error fetching YouTube video:', err)
    res.status(500).json({ error: 'Error fetching YouTube video: ' + err.message })
  }
})

// Serve React app for all other routes (SPA fallback)
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// Start HTTP server
const server = createServer(app)
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

// WebSocket server
const wss = new WebSocketServer({ port: WS_PORT })

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected')
  
  // Send current config on connection
  if (overlayConfig) {
    ws.send(JSON.stringify({ type: 'CONFIG_UPDATE', config: overlayConfig }))
  }
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected')
  })
})

console.log(`🔌 WebSocket server running on ws://localhost:${WS_PORT}`)
