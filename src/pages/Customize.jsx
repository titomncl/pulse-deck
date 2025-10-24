import { useState, useEffect } from 'react'
import ApiKeyPrompt from '../components/ApiKeyPrompt'
import TokenValidationPrompt from '../components/TokenValidationPrompt'
import LoadingScreen from '../components/LoadingScreen'
import SlantedPanel from '../components/SlantedPanel'
import Preview from '../components/Preview'
import { 
  getTwitchApiKey, 
  getTwitchClientId,
  getOverlayConfig, 
  setPreviewConfig, 
  applyPreviewConfig,
  getPreviewConfig,
  resetToDefault,
  saveAsUserDefault,
  resetToFactoryDefault,
  resetToUserDefault
} from '../config'
import { validateToken, getFollowerCount, getSubscriberCount, updateConfig } from '../api'
import { migrateOldConfig } from '../utils/elementRenderer.jsx'
import '../styles/Customize.css'

function Customize() {
  // Simple auth state
  const [authState, setAuthState] = useState('loading') // 'loading' | 'authenticated' | 'needs-auth' | 'error'
  const [tokenValidation, setTokenValidation] = useState(null)
  
  // Config state
  const [config, setConfig] = useState(null)
  const [previewConfig, setPreviewConfigState] = useState(null)
  const [selectedElement, setSelectedElement] = useState(null)
  const [activeTab, setActiveTab] = useState('elements')
  const [previewStep, setPreviewStep] = useState(0)
  const [availableEmotes, setAvailableEmotes] = useState([])
  const [obsUrl, setObsUrl] = useState('')
  const [showObsUrl, setShowObsUrl] = useState(false)
  
  // Real Twitch data for preview
  const [realTwitchData, setRealTwitchData] = useState({
    followers: { current: 0 },
    subscribers: { current: 0 }
  })
  const [loadingTwitchData, setLoadingTwitchData] = useState(false)
  
  // Real YouTube data for preview
  const [youtubeData, setYoutubeData] = useState({
    latest: { text: 'Latest YouTube Video', subtext: 'Preview mode', thumbnail: null }
  })
  const [loadingYoutubeData, setLoadingYoutubeData] = useState(false)

  // 1. Authentication - ONE simple useEffect
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const apiKey = getTwitchApiKey()
        const clientId = getTwitchClientId()
        
        if (!apiKey || !clientId) {
          setAuthState('needs-auth')
          return
        }
        
        const validation = await validateToken()
        
        if (validation.valid) {
          setAuthState('authenticated')
        } else {
          setTokenValidation(validation)
          setAuthState('error')
        }
      } catch (error) {
        console.error('Auth error:', error)
        setAuthState('error')
      }
    }
    
    authenticateUser()
  }, [])

  // 2. Load config and emotes
  useEffect(() => {
    let overlayConfig = getOverlayConfig()
    overlayConfig = migrateOldConfig(overlayConfig)
    setConfig(overlayConfig)
    
    const preview = getPreviewConfig()
    setPreviewConfigState(preview ? migrateOldConfig(preview) : JSON.parse(JSON.stringify(overlayConfig)))
    
    loadAvailableEmotes()
  }, [])

  // Helper function to load emotes from server
  const loadAvailableEmotes = async () => {
    try {
      const response = await fetch('/api/emotes')
      const data = await response.json()
      const filenames = data.map(emote => emote.filename)
      setAvailableEmotes(filenames)
    } catch (error) {
      console.error('Error loading emotes:', error)
      setAvailableEmotes([])
    }
  }

  // 3. Fetch real Twitch data for preview
  useEffect(() => {
    if (authState !== 'authenticated') return

    const fetchRealData = async () => {
      setLoadingTwitchData(true)
      try {
        const [followers, subscribers] = await Promise.all([
          getFollowerCount(),
          getSubscriberCount()
        ])
        setRealTwitchData({
          followers: { current: followers },
          subscribers: { current: subscribers }
        })
      } catch (error) {
        console.error('Failed to fetch Twitch data:', error)
      } finally {
        setLoadingTwitchData(false)
      }
    }

    fetchRealData()
  }, [authState])

  // 3.5. Fetch real YouTube data for preview
  useEffect(() => {
    if (!previewConfig?.youtube?.channelId) return

    const fetchYouTubeData = async () => {
      setLoadingYoutubeData(true)
      try {
        const apiKey = previewConfig.youtube.apiKey || ''
        
        // Find the first element using YouTube data source (prioritize selected element)
        let currentElement = null
        
        if (selectedElement) {
          // First try to get the selected element
          currentElement = previewConfig.elements?.find(el => el.id === selectedElement)
        }
        
        // If no selected element or selected isn't YouTube, find first YouTube element
        if (!currentElement || currentElement?.dataSource !== 'youtube.latest') {
          currentElement = previewConfig.elements?.find(el => el.dataSource === 'youtube.latest')
        }
        
        // Get videoIndex from the current element if it's using YouTube data source
        const videoIndex = currentElement?.dataSource === 'youtube.latest' ? 
          (currentElement?.fields?.youtubeVideoIndex || 0) : 0
        
        console.log('=== YouTube Fetch Debug ===')
        console.log('Selected element ID:', selectedElement)
        console.log('Found YouTube element ID:', currentElement?.id)
        console.log('Element dataSource:', currentElement?.dataSource)
        console.log('Element fields:', currentElement?.fields)
        console.log('youtubeVideoIndex from fields:', currentElement?.fields?.youtubeVideoIndex)
        console.log('Final videoIndex:', videoIndex)
        
        const url = `/api/youtube/latest-video?channelId=${encodeURIComponent(previewConfig.youtube.channelId)}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}&videoIndex=${videoIndex}`
        
        console.log('Fetching YouTube video with index:', videoIndex)
        
        const response = await fetch(url)
        const videoData = await response.json()
        
        if (videoData.error) {
          console.error('YouTube API error:', videoData.error)
          setYoutubeData({
            latest: { text: 'Error loading video', subtext: videoData.error, thumbnail: null }
          })
        } else {
          setYoutubeData({
            latest: videoData
          })
        }
      } catch (error) {
        console.error('Error fetching YouTube data:', error)
        setYoutubeData({
          latest: { text: 'Error loading video', subtext: error.message, thumbnail: null }
        })
      } finally {
        setLoadingYoutubeData(false)
      }
    }

    fetchYouTubeData()
  }, [
    previewConfig?.youtube?.channelId, 
    previewConfig?.youtube?.apiKey,
    // Only re-fetch when the videoIndex of a YouTube element changes
    previewConfig?.elements?.find(el => el.dataSource === 'youtube.latest')?.fields?.youtubeVideoIndex
  ])

  // 4. Update preview step when selectedElement changes
  useEffect(() => {
    if (!selectedElement || !previewConfig) return
    
    const enabledSteps = getEnabledSteps()
    const stepIndex = enabledSteps.findIndex(step => {
      // Match by element ID
      return step.elementId === selectedElement
    })
    
    if (stepIndex !== -1) {
      setPreviewStep(stepIndex)
    }
  }, [selectedElement, previewConfig])

  // Helper function to get enabled steps for preview rotation
  const getEnabledSteps = () => {
    if (!previewConfig) return []
    
    const steps = []
    const elements = Array.isArray(previewConfig.elements) ? previewConfig.elements : []
    
    elements.forEach((element) => {
      if (!element.enabled) return
      
      // Special handling for list elements with carousel
      if (element.type === 'list' && element.fields?.showAsCarousel) {
        const items = element.fields?.items || []
        const maxItems = element.fields.maxItemsToShow || items.length
        
        items.slice(0, maxItems).forEach((item, index) => {
          steps.push({
            type: 'carouselItem',
            elementId: element.id,
            element: element,
            itemIndex: index,
            item: item,
            zIndex: element.zIndex || 0
          })
        })
      } else {
        steps.push({
          type: 'element',
          elementId: element.id,
          element: element,
          zIndex: element.zIndex || 0
        })
      }
    })
    
    steps.sort((a, b) => a.zIndex - b.zIndex)
    return steps
  }

  const updatePreviewElement = (elementKey, updates) => {
    const elements = Array.isArray(previewConfig.elements) ? [...previewConfig.elements] : []
    const elementIndex = elements.findIndex(el => el.id === elementKey)
    
    if (elementIndex !== -1) {
      elements[elementIndex] = {
        ...elements[elementIndex],
        ...updates
      }
    }
    
    const newConfig = {
      ...previewConfig,
      elements: elements
    }
    setPreviewConfigState(newConfig)
    setPreviewConfig(newConfig)
  }
  
  const addNewElement = () => {
    const elements = Array.isArray(previewConfig.elements) ? [...previewConfig.elements] : []
    const newId = `custom_${Date.now()}`
    
    elements.push({
      id: newId,
      type: 'info',
      enabled: true,
      title: 'New Element',
      subtitle: '',
      emote: '⭐',
      zIndex: elements.length + 1,
      animation: 'fadeIn',
      dataSource: 'none',
      fields: {
        text: 'Custom text',
        subtext: ''
      }
    })
    
    const newConfig = {
      ...previewConfig,
      elements: elements
    }
    setPreviewConfigState(newConfig)
    setPreviewConfig(newConfig)
    setSelectedElement(newId)
  }
  
  const deleteElement = (elementId) => {
    if (!confirm('Are you sure you want to delete this element?')) return
    
    const elements = Array.isArray(previewConfig.elements) ? [...previewConfig.elements] : []
    const filtered = elements.filter(el => el.id !== elementId)
    
    const newConfig = {
      ...previewConfig,
      elements: filtered
    }
    setPreviewConfigState(newConfig)
    setPreviewConfig(newConfig)
    
    if (selectedElement === elementId) {
      setSelectedElement(null)
    }
  }

  const updatePreviewGlobal = (updates) => {
    const newConfig = {
      ...previewConfig,
      ...updates
    }
    setPreviewConfigState(newConfig)
    setPreviewConfig(newConfig)
  }

  // Helper functions for managing List element items
  const updateListItem = (elementId, itemIndex, updates) => {
    const element = previewConfig.elements.find(el => el.id === elementId)
    if (!element || element.type !== 'list') return
    
    const newItems = [...(element.fields?.items || [])]
    newItems[itemIndex] = { ...newItems[itemIndex], ...updates }
    updatePreviewElement(elementId, {
      fields: { ...element.fields, items: newItems }
    })
  }

  const addListItem = (elementId) => {
    const element = previewConfig.elements.find(el => el.id === elementId)
    if (!element || element.type !== 'list') return
    
    const newItems = [...(element.fields?.items || []), { 
      name: '!new', 
      description: 'New command', 
      emote: '💬' 
    }]
    updatePreviewElement(elementId, {
      fields: { ...element.fields, items: newItems }
    })
  }

  const deleteListItem = (elementId, itemIndex) => {
    const element = previewConfig.elements.find(el => el.id === elementId)
    if (!element || element.type !== 'list') return
    
    const newItems = (element.fields?.items || []).filter((_, i) => i !== itemIndex)
    updatePreviewElement(elementId, {
      fields: { ...element.fields, items: newItems }
    })
  }

  const handleEmoteChange = (elementKey, value) => {
    // Allow emoji or filename (e.g., "twitch-logo.png")
    updatePreviewElement(elementKey, { emote: value })
  }

  const handleChatCommandEmoteChange = (index, value) => {
    updateChatCommand(index, { emote: value })
  }

  const clearEmote = (elementKey) => {
    updatePreviewElement(elementKey, { emote: '' })
  }

  const handleEmoteUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return
    
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    let uploadedCount = 0
    let failedCount = 0
    let errors = []
    
    for (const file of files) {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`)
        failedCount++
        continue
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 5MB)`)
        failedCount++
        continue
      }
      
      try {
        // Read file as base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.onerror = () => reject(new Error('Error reading file'))
          reader.readAsDataURL(file)
        })
        
        // Send to server
        const response = await fetch('/api/emotes/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            data: base64Data
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          uploadedCount++
        } else {
          errors.push(`${file.name}: ${result.error}`)
          failedCount++
        }
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`)
        failedCount++
      }
    }
    
    // Show summary
    let message = ''
    if (uploadedCount > 0) {
      message += `✅ Successfully uploaded ${uploadedCount} emote${uploadedCount > 1 ? 's' : ''}`
    }
    if (failedCount > 0) {
      message += `\n❌ Failed: ${failedCount} file${failedCount > 1 ? 's' : ''}`
      if (errors.length > 0) {
        message += `\n\nErrors:\n${errors.join('\n')}`
      }
    }
    
    if (message) {
      alert(message)
    }
    
    // Reload emotes list
    if (uploadedCount > 0) {
      loadAvailableEmotes()
    }
    
    // Reset file input
    event.target.value = ''
  }

  const handleDeleteEmote = async (filename) => {
    if (!confirm(`Delete emote "${filename}"? This cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/emotes/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Deleted: ${filename}`)
        loadAvailableEmotes()
      } else {
        alert(`❌ Delete failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting emote:', error)
      alert('❌ Error deleting emote: ' + error.message)
    }
  }

  const handleApplyChanges = async () => {
    applyPreviewConfig()
    setConfig(previewConfig)
    
    // Send config to server (triggers WebSocket broadcast to Display page)
    try {
      await updateConfig(previewConfig)
      alert('✅ Changes applied and sent to Display page!')
    } catch (error) {
      console.error('Error sending config to server:', error)
      alert('⚠️ Changes applied locally, but could not sync to server. Make sure server is running.')
    }
  }

  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to reset to default configuration?')) {
      resetToDefault()
      const defaultConfig = getOverlayConfig()
      setConfig(defaultConfig)
      setPreviewConfigState(JSON.parse(JSON.stringify(defaultConfig)))
    }
  }

  const handleSaveAsDefault = async () => {
    if (confirm('Save current configuration as your default? This will be used when you click "Reset to My Default".')) {
      const success = await saveAsUserDefault(previewConfig)
      if (success) {
        alert('✅ Configuration saved as your default!')
      } else {
        alert('❌ Failed to save default configuration. Make sure server is running.')
      }
    }
  }

  const handleResetToFactoryDefault = async () => {
    if (confirm('Reset to factory default configuration? This will discard all your changes.')) {
      const success = await resetToFactoryDefault()
      if (success) {
        const newConfig = getOverlayConfig()
        setConfig(newConfig)
        setPreviewConfigState(JSON.parse(JSON.stringify(newConfig)))
        alert('✅ Reset to factory default!')
      } else {
        alert('❌ Failed to reset. Make sure server is running.')
      }
    }
  }

  const handleResetToUserDefault = async () => {
    if (confirm('Reset to your saved default configuration?')) {
      const success = await resetToUserDefault()
      if (success) {
        const newConfig = getOverlayConfig()
        setConfig(newConfig)
        setPreviewConfigState(JSON.parse(JSON.stringify(newConfig)))
        alert('✅ Reset to your default!')
      } else {
        alert('❌ Failed to reset. Make sure server is running.')
      }
    }
  }

  const generateObsUrl = async () => {
    const clientId = getTwitchClientId()
    const apiKey = getTwitchApiKey()
    
    if (!clientId || !apiKey) {
      alert('⚠️ Please set up Twitch API credentials first!')
      return
    }
    
    try {
      const response = await fetch('/api/auth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, apiKey })
      })
      
      const data = await response.json()
      setObsUrl(data.obsUrl)
      setShowObsUrl(true)
      console.log('🔑 Generated OBS URL:', data.obsUrl)
    } catch (error) {
      console.error('Error generating OBS URL:', error)
      alert('❌ Error generating OBS URL. Make sure server is running.')
    }
  }

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsUrl)
    alert('✅ URL copied to clipboard!')
  }

  const handleDragStop = (elementKey, e, data) => {
    // Removed drag functionality - panels rotate in carousel
  }

  const handleNextStep = () => {
    const enabledSteps = getEnabledSteps()
    const newStep = (previewStep + 1) % enabledSteps.length
    setPreviewStep(newStep)
    
    // Sync selected element with preview step
    const currentElement = enabledSteps[newStep]
    if (currentElement && currentElement.type !== 'chatCommand') {
      setSelectedElement(currentElement.type)
    } else if (currentElement && currentElement.type === 'chatCommand') {
      setSelectedElement('chatCommands')
    }
  }

  const handlePrevStep = () => {
    const enabledSteps = getEnabledSteps()
    const newStep = (previewStep - 1 + enabledSteps.length) % enabledSteps.length
    setPreviewStep(newStep)
    
    // Sync selected element with preview step
    const currentElement = enabledSteps[newStep]
    if (currentElement && currentElement.type !== 'chatCommand') {
      setSelectedElement(currentElement.type)
    } else if (currentElement && currentElement.type === 'chatCommand') {
      setSelectedElement('chatCommands')
    }
  }

  const getElementLabel = (key) => {
    const labels = {
      followerGoal: 'Follower Goal',
      subscriberGoal: 'Subscriber Goal',
      donations: 'Donations',
      chatCommands: 'Chat Commands',
      latestVOD: 'Latest VOD'
    }
    return labels[key] || key
  }

  // Clean auth state checks
  if (authState === 'loading') {
    return <LoadingScreen message="Authenticating..." />
  }

  if (authState === 'error') {
    return <TokenValidationPrompt 
      validationResult={tokenValidation} 
      onRetry={() => window.location.reload()} 
    />
  }

  if (authState === 'needs-auth') {
    return <ApiKeyPrompt onComplete={() => window.location.reload()} />
  }

  if (!config || !previewConfig) {
    return <LoadingScreen message="Loading configuration..." />
  }

  const enabledSteps = getEnabledSteps()
  const currentStep = enabledSteps[previewStep]
  const currentStepType = currentStep?.type
  const currentStepConfig = currentStepType && currentStepType !== 'chatCommand' 
    ? previewConfig.elements[currentStepType] 
    : null

  // Use real Twitch data if available, otherwise use mock data
  const previewData = {
    followers: { current: realTwitchData.followers.current || 847 },
    subscribers: { current: realTwitchData.subscribers.current || 123 },
    donations: { total: 1250 },
    vod: {
      title: previewConfig.youtubeChannel?.latestVideoTitle || 'Latest Stream Highlights',
      date: previewConfig.youtubeChannel?.latestVideoDate || new Date().toLocaleDateString(),
      url: previewConfig.youtubeChannel?.url || ''
    }
  }

  return (
    <div className="customize-container">
      <div className="customize-sidebar">
        <h1>Customize Overlay</h1>
        
        {loadingTwitchData && (
          <div className="twitch-data-loading">
            ⏳ Loading real Twitch data...
          </div>
        )}
        
        {!loadingTwitchData && realTwitchData.followers.current > 0 && (
          <div className="twitch-data-loaded">
            ✅ Using real data: {realTwitchData.followers.current} followers, {realTwitchData.subscribers.current} subscribers
          </div>
        )}
        
        {loadingYoutubeData && (
          <div className="youtube-data-loading">
            ⏳ Loading YouTube data...
          </div>
        )}
        
        {!loadingYoutubeData && youtubeData.latest?.text && youtubeData.latest.text !== 'Latest YouTube Video' && (
          <div className="youtube-data-loaded">
            ✅ YouTube: {youtubeData.latest.text.substring(0, 40)}...
          </div>
        )}
        
        <div className="tabs">
          <button 
            className={activeTab === 'elements' ? 'active' : ''}
            onClick={() => setActiveTab('elements')}
          >
            Elements
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {activeTab === 'elements' && (
          <div className="elements-list">
            <h2>Select Element to Customize</h2>
            {(Array.isArray(previewConfig.elements) ? previewConfig.elements : []).map((element) => (
              <div
                key={element.id}
                className={`element-item ${selectedElement === element.id ? 'selected' : ''} ${!element.enabled ? 'disabled' : ''}`}
                onClick={() => setSelectedElement(element.id)}
              >
                <input
                  type="checkbox"
                  checked={element.enabled}
                  onChange={(e) => {
                    e.stopPropagation()
                    updatePreviewElement(element.id, { enabled: e.target.checked })
                  }}
                  title={element.enabled ? 'Hide element' : 'Show element'}
                />
                <span className="element-title">{element.title || element.id}</span>
                {!element.enabled && <span className="element-status-badge">Hidden</span>}
                <button
                  className="delete-element-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteElement(element.id)
                  }}
                  title="Delete element"
                >
                  ✕
                </button>
              </div>
            ))}
            <button onClick={addNewElement} className="add-element-btn">
              + Add New Element
            </button>
          </div>
        )}

        {activeTab === 'elements' && selectedElement && (() => {
          const elements = Array.isArray(previewConfig.elements) ? previewConfig.elements : []
          const element = elements.find(el => el.id === selectedElement)
          if (!element) return null
          
          return (
            <div className="element-controls">
              <h3>Editing: {element.title || element.id}</h3>
              
              {/* Element Type */}
              <div className="control-group">
                <label>Element Type</label>
                <select
                  value={element.type || 'info'}
                  onChange={(e) => updatePreviewElement(element.id, { type: e.target.value })}
                >
                  <option value="progress">Progress Bar (Goals)</option>
                  <option value="counter">Counter (Numbers)</option>
                  <option value="list">List (Commands, etc.)</option>
                  <option value="info">Info (Text & Image)</option>
                  <option value="custom">Custom HTML</option>
                </select>
                <small>Changes how this element displays content</small>
              </div>
              
              {/* Title */}
              <div className="control-group">
                <label>Title</label>
                <input
                  type="text"
                  value={element.title || ''}
                  onChange={(e) => updatePreviewElement(element.id, { title: e.target.value })}
                  placeholder="Element title"
                />
              </div>
              
              {/* Subtext (optional) */}
              <div className="control-group">
                <label>Subtext (optional)</label>
                <input
                  type="text"
                  value={element.fields?.subtext || ''}
                  onChange={(e) => updatePreviewElement(element.id, { 
                    fields: { ...element.fields, subtext: e.target.value }
                  })}
                  placeholder="Additional text below content"
                />
                <small>Appears below the main content</small>
              </div>

              {/* Emote - hidden for List type as each item has its own */}
              {element.type !== 'list' && (
                <div className="control-group">
                  <label>Emote / Icon</label>
                  
                  {/* Visual Emote Picker */}
                  {availableEmotes.length > 0 ? (
                    <div className="emote-picker">
                      <div className="emote-picker-grid">
                        {availableEmotes.map((emote) => (
                          <div
                            key={emote}
                            className={`emote-picker-item ${element.emote === emote ? 'selected' : ''}`}
                            onClick={() => updatePreviewElement(element.id, { emote: emote })}
                            title={emote}
                          >
                            <img src={`/emotes/${emote}`} alt={emote} className="emote-picker-preview" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-emotes-message">
                      No emotes imported yet. Go to Settings → Emote Library to import emotes.
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={element.emote || ''}
                    onChange={(e) => updatePreviewElement(element.id, { emote: e.target.value })}
                    placeholder="emoji (👥) or filename (logo.png)"
                  />
                  <small>Click emote above or enter emoji/filename manually</small>
                </div>
              )}
              
              {/* Emote/Icon Size Control */}
              <div className="control-group">
                <label>Emote / Icon Size: {element.emoteSize || 100}%</label>
                <input
                  type="range"
                  min="30"
                  max="150"
                  step="5"
                  value={element.emoteSize || 100}
                  onChange={(e) => updatePreviewElement(element.id, { emoteSize: parseInt(e.target.value) })}
                  className="emote-size-slider"
                />
                <small>Adjust the size of the emote, icon, or thumbnail (30% - 150%)</small>
              </div>
              
              {/* Type-specific fields */}
              {element.type === 'progress' && (
                <>
                  <div className="control-group">
                    <label>Current Value (Manual Override)</label>
                    <input
                      type="number"
                      min="0"
                      value={element.fields?.current || 0}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, current: parseInt(e.target.value) || 0 }
                      })}
                    />
                    <small>Set to 0 to use live data from data source</small>
                  </div>

                  <div className="control-group">
                    <label>Goal Target</label>
                    <input
                      type="number"
                      min="1"
                      value={element.fields?.goal || 100}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, goal: parseInt(e.target.value) || 100 }
                      })}
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={element.fields?.showPercentage !== false}
                        onChange={(e) => updatePreviewElement(element.id, { 
                          fields: { ...element.fields, showPercentage: e.target.checked }
                        })}
                      />
                      {' '}Show Percentage
                    </label>
                  </div>
                </>
              )}
              
              {element.type === 'counter' && (
                <>
                  <div className="control-group">
                    <label>Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={element.fields?.value || 0}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, value: parseFloat(e.target.value) || 0 }
                      })}
                    />
                    <span className="field-hint">
                      {element.dataSource === 'custom.donations' && (
                        <>⚠️ Twitch API does not track donations. Update this manually or integrate with StreamElements/Streamlabs (v0.2+)</>
                      )}
                      {element.dataSource?.startsWith('twitch.') && (
                        <>This value is auto-updated from Twitch API</>
                      )}
                      {!element.dataSource || element.dataSource === 'none' && (
                        <>Manual value - update as needed</>
                      )}
                    </span>
                  </div>
                  
                  <div className="control-group">
                    <label>Prefix (optional)</label>
                    <input
                      type="text"
                      value={element.fields?.prefix || ''}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, prefix: e.target.value }
                      })}
                      placeholder="$ or €"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>Suffix (optional)</label>
                    <input
                      type="text"
                      value={element.fields?.suffix || ''}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, suffix: e.target.value }
                      })}
                      placeholder="pts or followers"
                    />
                  </div>
                </>
              )}
              
              {element.type === 'list' && (
                <>
                  <div className="control-group">
                    <label>Maximum Items to Show</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={element.fields?.maxItemsToShow || 3}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, maxItemsToShow: parseInt(e.target.value) || 3 }
                      })}
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={element.fields?.showAsCarousel !== false}
                        onChange={(e) => updatePreviewElement(element.id, { 
                          fields: { ...element.fields, showAsCarousel: e.target.checked }
                        })}
                      />
                      {' '}Show as Carousel (one item at a time)
                    </label>
                  </div>

                  {/* List Items Editor - shown when dataSource is 'none' */}
                  {(!element.dataSource || element.dataSource === 'none') && (
                    <>
                      <h4>List Items</h4>
                      <div className="list-items-editor">
                        {(element.fields?.items || []).map((item, index) => (
                          <div key={index} className="list-item-card">
                            {/* Header with emote and delete */}
                            <div className="list-item-header">
                              <div className="list-item-emote-display">
                                {item.emote && item.emote.endsWith('.png') || item.emote?.endsWith('.jpg') || item.emote?.endsWith('.gif') || item.emote?.endsWith('.webp') ? (
                                  <img src={`/emotes/${item.emote}`} alt="" className="list-item-emote-img" />
                                ) : (
                                  <span className="list-item-emote-emoji">{item.emote || '💬'}</span>
                                )}
                              </div>
                              <div className="list-item-title-group">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateListItem(element.id, index, { name: e.target.value })}
                                  placeholder="Item name (!command, Title, etc.)"
                                  className="list-item-name-input"
                                />
                              </div>
                              <button 
                                onClick={() => deleteListItem(element.id, index)}
                                className="delete-list-item-btn"
                                title="Delete item"
                              >
                                🗑️
                              </button>
                            </div>

                            {/* Fields */}
                            <div className="list-item-fields">
                              <div className="list-item-field">
                                <label className="list-item-label">Description</label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateListItem(element.id, index, { description: e.target.value })}
                                  placeholder="What does this do?"
                                  className="list-item-input"
                                />
                              </div>

                              <div className="list-item-field">
                                <label className="list-item-label">Subtext <span className="optional-label">(optional)</span></label>
                                <input
                                  type="text"
                                  value={item.subtext || ''}
                                  onChange={(e) => updateListItem(element.id, index, { subtext: e.target.value })}
                                  placeholder="Additional info"
                                  className="list-item-input"
                                />
                              </div>

                              {/* Emote Picker Section */}
                              <div className="list-item-field">
                                <label className="list-item-label">Emote / Icon</label>
                                <input
                                  type="text"
                                  value={item.emote || ''}
                                  onChange={(e) => updateListItem(element.id, index, { emote: e.target.value })}
                                  placeholder="💬 emoji or filename"
                                  className="list-item-input"
                                />
                                
                                {/* Visual Emote Picker */}
                                {availableEmotes.length > 0 && (
                                  <div className="list-item-emote-picker">
                                    <div className="emote-picker-grid">
                                      {availableEmotes.map((emote) => (
                                        <div
                                          key={emote}
                                          className={`emote-picker-item ${item.emote === emote ? 'selected' : ''}`}
                                          onClick={() => updateListItem(element.id, index, { emote: emote })}
                                          title={emote}
                                        >
                                          <img src={`/emotes/${emote}`} alt={emote} className="emote-picker-preview" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addListItem(element.id)} className="add-list-item-btn">
                          ➕ Add List Item
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              
              {element.type === 'info' && (
                <>
                  <div className="control-group">
                    <label>Text</label>
                    <input
                      type="text"
                      value={element.fields?.text || ''}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, text: e.target.value }
                      })}
                      placeholder="Main text content"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={element.fields?.showThumbnail === true}
                        onChange={(e) => updatePreviewElement(element.id, { 
                          fields: { ...element.fields, showThumbnail: e.target.checked }
                        })}
                      />
                      {' '}Show Thumbnail (if available)
                    </label>
                    <small>Replaces emote/icon with thumbnail image</small>
                  </div>
                  
                  {/* YouTube Video Index - only show when data source is youtube */}
                  {element.dataSource === 'youtube.latest' && (
                    <div className="control-group">
                      <label>Video Selection</label>
                      <select
                        value={element.fields?.youtubeVideoIndex || 0}
                        onChange={(e) => {
                          const newIndex = parseInt(e.target.value)
                          console.log('Video selection changed to index:', newIndex)
                          updatePreviewElement(element.id, { 
                            fields: { ...element.fields, youtubeVideoIndex: newIndex }
                          })
                        }}
                      >
                        <option value="0">Latest (most recent)</option>
                        <option value="1">2nd most recent</option>
                        <option value="2">3rd most recent</option>
                        <option value="3">4th most recent</option>
                        <option value="4">5th most recent</option>
                      </select>
                      <small>Select which non-Short video to display (excludes videos under 60 seconds)</small>
                    </div>
                  )}
                </>
              )}
              
              {element.type === 'custom' && (
                <div className="control-group">
                  <label>Custom HTML/Text</label>
                  <textarea
                    rows="4"
                    value={element.fields?.html || element.fields?.text || ''}
                    onChange={(e) => updatePreviewElement(element.id, { 
                      fields: { ...element.fields, html: e.target.value }
                    })}
                    placeholder="Enter custom HTML or text"
                  />
                  <small>⚠️ Be careful with HTML - use at your own risk</small>
                </div>
              )}
              
              {/* Data Source */}
              <div className="control-group">
                <label>Data Source</label>
                <select
                  value={element.dataSource || 'none'}
                  onChange={(e) => updatePreviewElement(element.id, { dataSource: e.target.value })}
                >
                  <option value="none">None (manual)</option>
                  <option value="twitch.followers">Twitch Followers</option>
                  <option value="twitch.subscribers">Twitch Subscribers</option>
                  <option value="twitch.vods">Twitch Latest VOD</option>
                  <option value="youtube.latest">YouTube Latest Video</option>
                  <option value="custom.donations">Donations (custom)</option>
                </select>
                <small>Where to get live data for this element</small>
              </div>

              {/* Display Order / Z-Index */}
              <div className="control-group">
                <label>Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={element.zIndex || 1}
                  onChange={(e) => updatePreviewElement(element.id, { zIndex: parseInt(e.target.value) || 1 })}
                />
                <small>Controls the order in the rotation (lower = shown first)</small>
              </div>

              {/* Animation */}
              <div className="control-group">
                <label>Animation</label>
                <select
                  value={element.animation || 'fadeIn'}
                  onChange={(e) => updatePreviewElement(element.id, { animation: e.target.value })}
                >
                  <option value="fadeIn">Fade In</option>
                  <option value="slideLeft">Slide from Right</option>
                  <option value="slideRight">Slide from Left</option>
                  <option value="slideUp">Slide from Bottom</option>
                  <option value="slideDown">Slide from Top</option>
                  <option value="scale">Scale/Zoom</option>
                  <option value="none">None (Instant)</option>
                </select>
                <small>How this element's content animates when it appears</small>
              </div>
            </div>
          )
        })()}

        {activeTab === 'settings' && (
          <div className="settings-panel">
            <h2>Global Settings</h2>
            
            <div className="control-group">
              <label>Rotation Duration (seconds)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={(previewConfig.rotationDuration || 5000) / 1000}
                onChange={(e) => updatePreviewGlobal({ 
                  rotationDuration: parseInt(e.target.value) * 1000 || 5000 
                })}
              />
              <small>How long each panel is displayed before rotating</small>
            </div>

            <div className="control-group">
              <label>⚠️ Animation Settings Moved</label>
              <div className="field-hint">
                Animations are now customized per-element! Edit each element to choose its own animation style.
              </div>
            </div>

            <h3>YouTube Integration</h3>
            <div className="control-group">
              <label>YouTube API Key <span className="optional-label">(optional but recommended)</span></label>
              <input
                type="password"
                value={previewConfig.youtube?.apiKey || ''}
                onChange={(e) => updatePreviewGlobal({ 
                  youtube: { ...previewConfig.youtube, apiKey: e.target.value }
                })}
                placeholder="Your YouTube Data API v3 key"
              />
              <small>
                <strong>With API key:</strong> Can filter out YouTube Shorts ✅<br />
                <strong>Without API key:</strong> Uses RSS feed (may include Shorts) ⚠️<br />
                Get your free API key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>
              </small>
            </div>

            <div className="control-group">
              <label>YouTube Channel ID or URL</label>
              <input
                type="text"
                value={previewConfig.youtube?.channelId || ''}
                onChange={(e) => updatePreviewGlobal({ 
                  youtube: { ...previewConfig.youtube, channelId: e.target.value }
                })}
                placeholder="UCxxx... or youtube.com/@yourhandle"
              />
              <small>
                <strong>With API key:</strong> Accepts Channel ID, @handle, or URL<br />
                <strong>Without API key:</strong> Requires Channel ID (UCxxx...) only
              </small>
            </div>

            <h3>Emote Library</h3>
            <div className="emote-library">
              <div className="emote-library-header">
                <input
                  type="file"
                  id="settings-emote-file-input"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleEmoteUpload}
                  style={{ display: 'none' }}
                  multiple
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('settings-emote-file-input').click()}
                  className="import-emote-btn"
                  title="Upload PNG, JPG, GIF, or WebP images (max 5MB each)"
                >
                  📤 Import Emotes
                </button>
                <small>Upload PNG, JPG, GIF, or WebP (max 5MB each)</small>
              </div>
              
              {availableEmotes.length > 0 ? (
                <div className="emote-grid">
                  {availableEmotes.map((emote) => (
                    <div key={emote} className="emote-grid-item">
                      <img src={`/emotes/${emote}`} alt={emote} className="emote-preview" />
                      <span className="emote-filename">{emote}</span>
                      <button
                        onClick={() => handleDeleteEmote(emote)}
                        className="delete-emote-btn"
                        title="Delete emote"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-library-message">
                  No emotes imported yet. Click "Import Emotes" above to add images.
                </div>
              )}
            </div>

            <h3>Color Theme</h3>
            
            <div className="color-grid">
              <div className="control-group">
                <label>Panel Background</label>
                <input
                  type="color"
                  value={previewConfig.colors?.panelBackground || '#F3F3F3'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, panelBackground: e.target.value }
                  })}
                />
              </div>

              <div className="control-group">
                <label>Panel Border</label>
                <input
                  type="color"
                  value={previewConfig.colors?.panelBorder || '#002740'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, panelBorder: e.target.value }
                  })}
                />
              </div>

              <div className="control-group">
                <label>Primary Text</label>
                <input
                  type="color"
                  value={previewConfig.colors?.primaryText || '#002740'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, primaryText: e.target.value }
                  })}
                />
              </div>

              <div className="control-group">
                <label>Secondary Text</label>
                <input
                  type="color"
                  value={previewConfig.colors?.secondaryText || '#666666'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, secondaryText: e.target.value }
                  })}
                />
              </div>

              <div className="control-group">
                <label>Progress Bar Background</label>
                <input
                  type="color"
                  value={previewConfig.colors?.progressBarBackground || '#E0E0E0'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, progressBarBackground: e.target.value }
                  })}
                />
              </div>

              <div className="control-group">
                <label>Progress Bar Fill</label>
                <input
                  type="color"
                  value={previewConfig.colors?.progressBarFill || '#002740'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, progressBarFill: e.target.value }
                  })}
                />
              </div>

              <div className="control-group">
                <label>Progress Bar Fill End (Gradient)</label>
                <input
                  type="color"
                  value={previewConfig.colors?.progressBarFillEnd || '#004d73'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, progressBarFillEnd: e.target.value }
                  })}
                />
              </div>

              <div className="control-group">
                <label>Accent Color</label>
                <input
                  type="color"
                  value={previewConfig.colors?.accentColor || '#9146ff'}
                  onChange={(e) => updatePreviewGlobal({ 
                    colors: { ...previewConfig.colors, accentColor: e.target.value }
                  })}
                />
              </div>
            </div>

            <h3>YouTube Channel</h3>
            <div className="control-group">
              <label>Channel URL</label>
              <input
                type="url"
                value={previewConfig.youtubeChannel?.url || ''}
                onChange={(e) => updatePreviewGlobal({ 
                  youtubeChannel: { 
                    ...previewConfig.youtubeChannel,
                    url: e.target.value 
                  }
                })}
                placeholder="https://youtube.com/@yourchannel"
              />
              <small>Latest video will be automatically fetched (feature coming soon)</small>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button className="apply-btn" onClick={handleApplyChanges}>
            Apply Changes
          </button>
          
          <div className="button-group">
            <button className="save-default-btn" onClick={handleSaveAsDefault}>
              💾 Save as My Default
            </button>
            <button className="reset-btn" onClick={handleResetToUserDefault}>
              ↩️ Reset to My Default
            </button>
          </div>
          
          <button className="reset-factory-btn" onClick={handleResetToFactoryDefault}>
            🏭 Reset to Factory Default
          </button>
          
          <div className="obs-url-section">
            <button className="obs-url-btn" onClick={generateObsUrl}>
              🔗 Generate OBS URL
            </button>
            
            {showObsUrl && (
              <div className="obs-url-display">
                <label>OBS Browser Source URL:</label>
                <div className="url-container">
                  <input 
                    type="text" 
                    value={obsUrl} 
                    readOnly 
                    onClick={(e) => e.target.select()}
                  />
                  <button className="copy-btn" onClick={copyObsUrl}>
                    📋 Copy
                  </button>
                </div>
                <small>
                  ✅ Use this URL in OBS Browser Source. It contains authentication and will auto-refresh when you apply changes!
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      <Preview 
        previewStep={previewStep}
        enabledSteps={enabledSteps}
        currentStep={currentStep}
        previewData={previewData}
        previewConfig={previewConfig}
        youtubeData={youtubeData}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
      />
    </div>
  )
}

export default Customize
