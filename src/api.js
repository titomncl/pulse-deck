import axios from 'axios'
import { 
  getTwitchApiKey, 
  getTwitchClientId, 
  getTwitchUserId,
  setTwitchUserId,
  setTwitchUsername 
} from './config'

// ============================================================================
// CONFIGURATION API (Server)
// ============================================================================

const API_URL = '/api/config'

// Fetch config from server
export const fetchConfig = async () => {
  try {
    const response = await axios.get(API_URL)
    return response.data
  } catch (error) {
    console.error('Error fetching config:', error)
    return null
  }
}

// Update config on server (triggers WebSocket broadcast)
export const updateConfig = async (config) => {
  try {
    const response = await axios.post(API_URL, config)
    return response.data
  } catch (error) {
    console.error('Error updating config:', error)
    throw error
  }
}

// ============================================================================
// WEBSOCKET (Real-time Config Updates)
// ============================================================================

const WS_URL = 'ws://localhost:3001'

class ConfigWebSocket {
  constructor() {
    this.ws = null
    this.listeners = []
    this.reconnectTimeout = null
    this.connect()
  }

  connect() {
    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'CONFIG_UPDATE') {
            console.log('📥 Received config update via WebSocket')
            this.listeners.forEach(callback => callback(data.config))
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, reconnecting in 3s...')
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000)
      }
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000)
    }
  }

  // Subscribe to config updates
  onConfigUpdate(callback) {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
  }
}

// Singleton WebSocket instance
export const configWebSocket = new ConfigWebSocket()

// ============================================================================
// TWITCH API
// ============================================================================

const TWITCH_API_BASE = 'https://api.twitch.tv/helix'
const TWITCH_OAUTH_BASE = 'https://id.twitch.tv/oauth2'

// Required OAuth scopes for the app
const REQUIRED_SCOPES = [
  'moderator:read:followers',
  'channel:read:subscriptions'
]

// Validate OAuth token and check scopes
export const validateToken = async () => {
  try {
    const apiKey = getTwitchApiKey()
    const clientId = getTwitchClientId()

    if (!apiKey || !clientId) {
      return {
        valid: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Twitch API credentials not found. Please enter your credentials.'
      }
    }

    // Call Twitch OAuth validate endpoint
    const response = await axios.get(`${TWITCH_OAUTH_BASE}/validate`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    const { client_id, scopes, expires_in } = response.data

    // Check if client ID matches
    if (client_id !== clientId) {
      return {
        valid: false,
        error: 'CLIENT_ID_MISMATCH',
        message: 'Token does not match Client ID. Please regenerate your token.'
      }
    }

    // Check if token has required scopes
    const missingScopes = REQUIRED_SCOPES.filter(scope => !scopes.includes(scope))
    if (missingScopes.length > 0) {
      return {
        valid: false,
        error: 'INSUFFICIENT_SCOPES',
        message: `Token is missing required scopes: ${missingScopes.join(', ')}`,
        missingScopes
      }
    }

    // Check if token is about to expire (less than 1 hour)
    if (expires_in < 3600) {
      console.warn('⚠️ OAuth token expires in less than 1 hour. Consider refreshing.')
    }

    console.log('✅ OAuth token validated successfully:', {
      expires_in: `${Math.floor(expires_in / 3600)} hours`,
      scopes: scopes.join(', ')
    })

    return {
      valid: true,
      scopes,
      expiresIn: expires_in
    }
  } catch (error) {
    console.error('❌ Token validation failed:', error.response?.data || error.message)

    if (error.response?.status === 401) {
      return {
        valid: false,
        error: 'INVALID_TOKEN',
        message: 'OAuth token is invalid or expired. Please reconnect your Twitch account.'
      }
    }

    return {
      valid: false,
      error: 'VALIDATION_ERROR',
      message: 'Failed to validate token. Check your internet connection.'
    }
  }
}

// Create axios instance with Twitch API configuration
const createTwitchClient = () => {
  const apiKey = getTwitchApiKey()
  const clientId = getTwitchClientId()

  if (!apiKey || !clientId) {
    throw new Error('Twitch API credentials not found')
  }

  return axios.create({
    baseURL: TWITCH_API_BASE,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Client-Id': clientId
    }
  })
}

// Get current authenticated user
export const getCurrentUser = async () => {
  try {
    const client = createTwitchClient()
    const response = await client.get('/users')
    const user = response.data.data[0]
    
    // Save user info for future use
    if (user) {
      setTwitchUserId(user.id)
      setTwitchUsername(user.login)
    }
    
    return user
  } catch (error) {
    console.error('Error fetching current user:', error)
    throw error
  }
}

// Get user data by channel name
export const getUserByName = async (channelName) => {
  try {
    const client = createTwitchClient()
    const response = await client.get('/users', {
      params: { login: channelName }
    })
    return response.data.data[0]
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}

// Get follower count
export const getFollowerCount = async () => {
  try {
    let userId = getTwitchUserId()
    
    // If we don't have userId, fetch current user
    if (!userId) {
      const user = await getCurrentUser()
      userId = user.id
    }

    const client = createTwitchClient()
    
    // The moderator_id must be the same as broadcaster_id for your own channel
    const response = await client.get('/channels/followers', {
      params: { 
        broadcaster_id: userId,
        moderator_id: userId  // Required: must be same as broadcaster for own channel
      }
    })
    
    console.log('✅ Follower count from Twitch API:', response.data.total)
    return response.data.total
  } catch (error) {
    console.error('❌ Error fetching follower count:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      console.error('⚠️ Authorization failed - check your OAuth token and scopes')
    }
    return 0
  }
}

// Get subscriber count
export const getSubscriberCount = async () => {
  try {
    let userId = getTwitchUserId()
    
    // If we don't have userId, fetch current user
    if (!userId) {
      const user = await getCurrentUser()
      userId = user.id
    }

    const client = createTwitchClient()
    
    // Note: This requires channel:read:subscriptions scope
    const response = await client.get('/subscriptions', {
      params: { 
        broadcaster_id: userId,
        first: 1  // We only need the total count, not the full list
      }
    })
    
    console.log('✅ Subscriber count from Twitch API:', response.data.total)
    
    // Twitch's API returns total subscribers (including gifted subs)
    return response.data.total
  } catch (error) {
    console.error('❌ Error fetching subscriber count:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      console.error('⚠️ Authorization failed - check your OAuth token and scopes')
    }
    return 0
  }
}

// Get channel videos (VODs)
export const getChannelVideos = async (limit = 5) => {
  try {
    let userId = getTwitchUserId()
    
    // If we don't have userId, fetch current user
    if (!userId) {
      const user = await getCurrentUser()
      userId = user.id
    }

    const client = createTwitchClient()
    const response = await client.get('/videos', {
      params: { 
        user_id: userId,
        first: limit,
        type: 'archive'  // Get VODs (not highlights or uploads)
      }
    })
    
    return response.data.data
  } catch (error) {
    console.error('Error fetching channel videos:', error)
    return []
  }
}

// Validate credentials by attempting to fetch current user
export const validateCredentials = async () => {
  try {
    await getCurrentUser()
    return true
  } catch (error) {
    console.error('Invalid Twitch credentials:', error)
    return false
  }
}
