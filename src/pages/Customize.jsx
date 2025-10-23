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
    
    fetch('/emotes/emotes.json')
      .then(res => res.json())
      .then(data => setAvailableEmotes(data.emotes || []))
      .catch(() => setAvailableEmotes([]))
  }, [])

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

  // 4. Update preview step when selectedElement changes
  useEffect(() => {
    if (!selectedElement || !previewConfig) return
    
    const enabledSteps = getEnabledSteps()
    const stepIndex = enabledSteps.findIndex(step => {
      if (selectedElement === 'chatCommands') return step.type === 'chatCommand'
      return step.type === selectedElement
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
        const items = element.dataSource === 'config.chatCommands' 
          ? (previewConfig.chatCommands || [])
          : []
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

  const updateChatCommand = (index, updates) => {
    const newCommands = [...(previewConfig.chatCommands || [])]
    newCommands[index] = { ...newCommands[index], ...updates }
    const newConfig = {
      ...previewConfig,
      chatCommands: newCommands
    }
    setPreviewConfigState(newConfig)
    setPreviewConfig(newConfig)
  }

  const addChatCommand = () => {
    const newCommands = [...(previewConfig.chatCommands || []), { name: '!new', description: 'New command', emote: '💬' }]
    const newConfig = {
      ...previewConfig,
      chatCommands: newCommands
    }
    setPreviewConfigState(newConfig)
    setPreviewConfig(newConfig)
  }

  const deleteChatCommand = (index) => {
    const newCommands = (previewConfig.chatCommands || []).filter((_, i) => i !== index)
    const newConfig = {
      ...previewConfig,
      chatCommands: newCommands
    }
    setPreviewConfigState(newConfig)
    setPreviewConfig(newConfig)
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
                className={`element-item ${selectedElement === element.id ? 'selected' : ''}`}
                onClick={() => setSelectedElement(element.id)}
              >
                <input
                  type="checkbox"
                  checked={element.enabled}
                  onChange={(e) => {
                    e.stopPropagation()
                    updatePreviewElement(element.id, { enabled: e.target.checked })
                  }}
                />
                <span>{element.title || element.id}</span>
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
              
              {/* Subtitle */}
              <div className="control-group">
                <label>Subtitle (optional)</label>
                <input
                  type="text"
                  value={element.subtitle || ''}
                  onChange={(e) => updatePreviewElement(element.id, { subtitle: e.target.value })}
                  placeholder="Subtitle text"
                />
              </div>

              {/* Emote */}
              <div className="control-group">
                <label>Emote / Icon</label>
                
                {availableEmotes.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        updatePreviewElement(element.id, { emote: e.target.value })
                      }
                    }}
                    className="emote-dropdown"
                  >
                    <option value="">-- Select from /emotes/ folder --</option>
                    {availableEmotes.map((emote) => (
                      <option key={emote} value={emote}>
                        {emote}
                      </option>
                    ))}
                  </select>
                )}
                
                <input
                  type="text"
                  value={element.emote || ''}
                  onChange={(e) => updatePreviewElement(element.id, { emote: e.target.value })}
                  placeholder="emoji (👥) or filename (logo.png)"
                />
                <small>Select from dropdown or enter emoji/filename manually</small>
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
                      value={element.fields?.value || 0}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, value: parseInt(e.target.value) || 0 }
                      })}
                    />
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
                    <label>Subtext (optional)</label>
                    <input
                      type="text"
                      value={element.fields?.subtext || ''}
                      onChange={(e) => updatePreviewElement(element.id, { 
                        fields: { ...element.fields, subtext: e.target.value }
                      })}
                      placeholder="Additional text"
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
                  </div>
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
                  <option value="config.chatCommands">Chat Commands List</option>
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
              <label>Transition Animation</label>
              <select
                value={previewConfig.transitionAnimation || 'fadeSlide'}
                onChange={(e) => updatePreviewGlobal({ transitionAnimation: e.target.value })}
              >
                <option value="fadeSlide">Fade & Slide</option>
                <option value="fade">Fade Only</option>
                <option value="slideUp">Slide Up</option>
                <option value="slideDown">Slide Down</option>
                <option value="zoom">Zoom</option>
              </select>
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

            <h3>Chat Commands</h3>
            <div className="chat-commands-editor">
              {(previewConfig.chatCommands || []).map((cmd, index) => (
                <div key={index} className="command-editor-item">
                  <div className="command-editor-row">
                    {/* Dropdown for emote selection */}
                    {availableEmotes.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            updateChatCommand(index, { emote: e.target.value })
                          }
                        }}
                        className="command-emote-dropdown"
                        title="Select emote from folder"
                      >
                        <option value="">📁</option>
                        {availableEmotes.map((emote) => (
                          <option key={emote} value={emote}>
                            {emote}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    <input
                      type="text"
                      value={cmd.emote || '💬'}
                      onChange={(e) => updateChatCommand(index, { emote: e.target.value })}
                      placeholder="💬 or file"
                      className="command-emote-input"
                    />
                    <input
                      type="text"
                      value={cmd.name}
                      onChange={(e) => updateChatCommand(index, { name: e.target.value })}
                      placeholder="!command"
                      className="command-name-input"
                    />
                    <button 
                      onClick={() => deleteChatCommand(index)}
                      className="delete-command-btn"
                      title="Delete command"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cmd.description}
                    onChange={(e) => updateChatCommand(index, { description: e.target.value })}
                    placeholder="Command description"
                    className="command-desc-input"
                  />
                  <input
                    type="text"
                    value={cmd.subtext || ''}
                    onChange={(e) => updateChatCommand(index, { subtext: e.target.value })}
                    placeholder="Optional subtext"
                    className="command-subtext-input"
                  />
                </div>
              ))}
              <button onClick={addChatCommand} className="add-command-btn">
                + Add Command
              </button>
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
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
      />
    </div>
  )
}

export default Customize
