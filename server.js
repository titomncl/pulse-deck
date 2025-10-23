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
