// LocalStorage utility functions for managing overlay configuration

const STORAGE_KEYS = {
  TWITCH_API_KEY: 'twitch_api_key',
  TWITCH_CLIENT_ID: 'twitch_client_id',
  TWITCH_USER_ID: 'twitch_user_id',
  TWITCH_USERNAME: 'twitch_username',
  OVERLAY_CONFIG: 'overlay_config',
  PREVIEW_CONFIG: 'preview_config'
}

// Default configuration
const DEFAULT_CONFIG = {
  rotationDuration: 5000, // Time each step is shown (milliseconds)
  transitionAnimation: 'fadeSlide', // fadeSlide, fade, slideUp, slideDown, zoom
  colors: {
    panelBackground: '#F3F3F3', // Light grey background
    panelBorder: '#002740', // Dark navy blue border
    primaryText: '#002740', // Dark navy blue text
    secondaryText: '#666666', // Grey secondary text
    progressBarBackground: '#E0E0E0', // Light grey
    progressBarFill: '#002740', // Dark navy blue
    progressBarFillEnd: '#004d73', // Lighter navy blue (gradient end)
    accentColor: '#9146ff' // Purple accent (for highlights)
  },
  youtubeChannel: {
    url: '', // YouTube channel URL
    latestVideoTitle: 'Latest Stream Highlights',
    latestVideoDate: new Date().toLocaleDateString()
  },
  chatCommands: [
    { name: '!discord', description: 'Join our Discord server', emote: '💬' },
    { name: '!socials', description: 'Follow on all platforms', emote: '🔗' },
    { name: '!vod', description: 'Watch latest stream', emote: '🎬' }
  ],
  elements: {
    followerGoal: {
      enabled: true,
      goal: 1000,
      current: 0,
      zIndex: 1,
      title: 'Follower Goal',
      emote: '👥'
    },
    subscriberGoal: {
      enabled: true,
      goal: 500,
      current: 0,
      zIndex: 2,
      title: 'Subscriber Goal',
      emote: '⭐'
    },
    donations: {
      enabled: true,
      zIndex: 3,
      title: 'Total Donations',
      emote: '💰'
    },
    chatCommands: {
      enabled: true,
      maxCommandsToShow: 3, // How many commands to show in rotation
      zIndex: 4
    },
    latestVOD: {
      enabled: true,
      zIndex: 5,
      title: 'Latest VOD',
      emote: '🎬'
    }
  },
  goalAnimations: {
    enabled: true,
    type: 'confetti',
    duration: 3000
  }
}

// Get item from localStorage
export const getItem = (key) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error)
    return null
  }
}

// Set item in localStorage
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    
    // Dispatch custom event for same-window updates (storage event doesn't fire in same window)
    if (key === 'overlayConfig') {
      window.dispatchEvent(new CustomEvent('configUpdated'))
    }
    
    return true
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error)
    return false
  }
}

// Remove item from localStorage
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error)
    return false
  }
}

// Twitch API credentials
export const getTwitchApiKey = () => getItem(STORAGE_KEYS.TWITCH_API_KEY)
export const setTwitchApiKey = (key) => setItem(STORAGE_KEYS.TWITCH_API_KEY, key)

export const getTwitchClientId = () => getItem(STORAGE_KEYS.TWITCH_CLIENT_ID)
export const setTwitchClientId = (clientId) => setItem(STORAGE_KEYS.TWITCH_CLIENT_ID, clientId)

export const getTwitchUserId = () => getItem(STORAGE_KEYS.TWITCH_USER_ID)
export const setTwitchUserId = (id) => setItem(STORAGE_KEYS.TWITCH_USER_ID, id)

export const getTwitchUsername = () => getItem(STORAGE_KEYS.TWITCH_USERNAME)
export const setTwitchUsername = (name) => setItem(STORAGE_KEYS.TWITCH_USERNAME, name)

// Overlay configuration
export const getOverlayConfig = () => {
  const config = getItem(STORAGE_KEYS.OVERLAY_CONFIG)
  return config || DEFAULT_CONFIG
}

export const setOverlayConfig = (config) => setItem(STORAGE_KEYS.OVERLAY_CONFIG, config)

// Preview configuration (pending changes)
export const getPreviewConfig = () => getItem(STORAGE_KEYS.PREVIEW_CONFIG)
export const setPreviewConfig = (config) => setItem(STORAGE_KEYS.PREVIEW_CONFIG, config)
export const clearPreviewConfig = () => removeItem(STORAGE_KEYS.PREVIEW_CONFIG)

// Apply preview config to main config
export const applyPreviewConfig = () => {
  const preview = getPreviewConfig()
  if (preview) {
    setOverlayConfig(preview)
    clearPreviewConfig()
    return true
  }
  return false
}

// Reset to default configuration
export const resetToDefault = () => {
  setOverlayConfig(DEFAULT_CONFIG)
  clearPreviewConfig()
}

// Save current config as user default
export const saveAsUserDefault = async (config) => {
  try {
    const response = await fetch('/api/config/user-default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    return response.ok
  } catch (error) {
    console.error('Error saving user default:', error)
    return false
  }
}

// Load factory default config
export const loadFactoryDefault = async () => {
  try {
    const response = await fetch('/api/config/default')
    if (response.ok) {
      return await response.json()
    }
    return DEFAULT_CONFIG
  } catch (error) {
    console.error('Error loading factory default:', error)
    return DEFAULT_CONFIG
  }
}

// Load user default config
export const loadUserDefault = async () => {
  try {
    const response = await fetch('/api/config/user-default')
    if (response.ok) {
      return await response.json()
    }
    return DEFAULT_CONFIG
  } catch (error) {
    console.error('Error loading user default:', error)
    return DEFAULT_CONFIG
  }
}

// Reset to factory default
export const resetToFactoryDefault = async () => {
  try {
    const response = await fetch('/api/config/reset-factory', {
      method: 'POST'
    })
    if (response.ok) {
      const data = await response.json()
      setOverlayConfig(data.config)
      clearPreviewConfig()
      return true
    }
    return false
  } catch (error) {
    console.error('Error resetting to factory default:', error)
    return false
  }
}

// Reset to user default
export const resetToUserDefault = async () => {
  try {
    const response = await fetch('/api/config/reset-user', {
      method: 'POST'
    })
    if (response.ok) {
      const data = await response.json()
      setOverlayConfig(data.config)
      clearPreviewConfig()
      return true
    }
    return false
  } catch (error) {
    console.error('Error resetting to user default:', error)
    return false
  }
}

export { STORAGE_KEYS, DEFAULT_CONFIG }
