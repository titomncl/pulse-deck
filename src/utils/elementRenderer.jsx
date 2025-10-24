// Dynamic element renderer that handles different element types
// This replaces hard-coded switch statements with a data-driven approach

/**
 * Render element content based on element type and data
 * @param {Object} element - The element configuration from config
 * @param {Object} data - The data to display (from Twitch API, etc.)
 * @param {Object} colors - Global color theme
 * @returns {Object} - Rendered content object with title, content, subtitle, emote
 */
export const renderElement = (element, data, colors) => {
  if (!element || !element.enabled) return null

  const elementType = element.type || 'info'
  
  switch (elementType) {
    case 'progress':
      return renderProgressElement(element, data, colors)
    
    case 'counter':
      return renderCounterElement(element, data, colors)
    
    case 'list':
      return renderListElement(element, data, colors)
    
    case 'info':
      return renderInfoElement(element, data, colors)
    
    case 'custom':
      return renderCustomElement(element, data, colors)
    
    default:
      console.warn(`Unknown element type: ${elementType}`)
      return null
  }
}

/**
 * Progress bar element (for goals with current/goal values)
 */
const renderProgressElement = (element, data, colors) => {
  const fields = element.fields || {}
  const current = fields.current > 0 ? fields.current : (data?.current || 0)
  const goal = fields.goal || 100
  const percentage = Math.min((current / goal) * 100, 100)
  const textContent = `${current} / ${goal}`
  
  const progressBarStyle = { 
    background: colors.progressBarBackground || '#E0E0E0' 
  }
  
  const progressFillStyle = {
    width: `${percentage}%`,
    background: `linear-gradient(90deg, ${colors.progressBarFill || '#002740'} 0%, ${colors.progressBarFillEnd || '#004d73'} 100%)`
  }
  
  // Use custom subtext if provided, otherwise show percentage if enabled
  let subtitle = fields.subtext || ''
  if (!subtitle && fields.showPercentage) {
    subtitle = `${Math.round(percentage)}% complete`
  }
  
  return {
    emote: element.emote || '📊',
    title: element.title || 'Progress',
    content: (
      <div>
        <div className="panel-progress-bar" style={progressBarStyle}>
          <div 
            className="panel-progress-text" 
            data-text={textContent} 
            style={{ '--progress-width': `${percentage}%` }}
          >
            {textContent}
          </div>
          <div className="panel-progress-fill" style={progressFillStyle} />
        </div>
      </div>
    ),
    subtitle: subtitle,
    emoteSize: element.emoteSize || 100
  }
}

/**
 * Counter element (for simple numeric displays like donations)
 */
const renderCounterElement = (element, data, colors) => {
  const fields = element.fields || {}
  const value = data?.value || fields.value || 0
  const prefix = fields.prefix || ''
  const suffix = fields.suffix || ''
  
  return {
    emote: element.emote || '🔢',
    title: element.title || 'Counter',
    content: (
      <div className="donation-amount-display">
        {prefix && <span className="donation-currency">{prefix}</span>}
        <span className="donation-number">{value}</span>
        {suffix && <span className="donation-suffix">{suffix}</span>}
      </div>
    ),
    subtitle: fields.subtext || '',
    emoteSize: element.emoteSize || 100
  }
}

/**
 * List element (for displaying multiple items like chat commands)
 */
const renderListElement = (element, data, colors) => {
  const fields = element.fields || {}
  const items = data?.items || []
  const maxItems = fields.maxItemsToShow || items.length
  const visibleItems = items.slice(0, maxItems)
  
  // If showing as carousel (one item at a time), return individual items
  if (fields.showAsCarousel && visibleItems.length > 0) {
    // This will be handled by the carousel logic in Display.jsx
    return {
      type: 'carousel',
      items: visibleItems,
      emote: element.emote || '📋',
      emoteSize: element.emoteSize || 100
    }
  }
  
  // Show all items in a list
  return {
    emote: element.emote || '📋',
    title: element.title || 'List',
    content: (
      <div className="panel-command-list">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, index) => (
            <div key={index} className="panel-command-item">
              <span className="panel-command-name">{item.name}</span>
              <span className="panel-command-desc">{item.description}</span>
            </div>
          ))
        ) : (
          <div className="no-commands">No items available</div>
        )}
      </div>
    ),
    subtitle: fields.subtext || '',
    emoteSize: element.emoteSize || 100
  }
}

/**
 * Info element (for custom text/thumbnails like latest VOD)
 */
const renderInfoElement = (element, data, colors) => {
  const fields = element.fields || {}
  const text = data?.text || fields.text || 'Information'
  const subtext = data?.subtext || fields.subtext || ''
  const showThumbnail = fields.showThumbnail && data?.thumbnail
  
  // Use thumbnail as emote if showThumbnail is enabled and thumbnail exists
  const emote = showThumbnail ? data.thumbnail : (element.emote || 'ℹ️')
  
  return {
    emote: emote,
    title: element.title || 'Info',
    content: (
      <div className="panel-vod-info-simple">
        <div className="panel-vod-title">{text}</div>
        {subtext && <div className="panel-vod-date">{subtext}</div>}
      </div>
    ),
    subtitle: element.subtitle || '',
    emoteSize: element.emoteSize || 100
  }
}

/**
 * Custom element (user-defined with custom HTML/text)
 */
const renderCustomElement = (element, data, colors) => {
  const fields = element.fields || {}
  
  return {
    emote: element.emote || '⭐',
    title: element.title || 'Custom',
    content: (
      <div className="panel-custom-content">
        {fields.html ? (
          <div dangerouslySetInnerHTML={{ __html: fields.html }} />
        ) : (
          <div>{fields.text || 'Custom content'}</div>
        )}
      </div>
    ),
    subtitle: fields.subtext || '',
    emoteSize: element.emoteSize || 100
  }
}

/**
 * Get data for an element based on its dataSource
 * @param {Object} element - The element configuration
 * @param {Object} allData - All available data (twitch, custom, etc.)
 * @param {Object} config - Full config (for config-based data sources)
 * @returns {Object} - The data for this element
 */
export const getElementData = (element, allData, config) => {
  const dataSource = element.dataSource || 'none'
  
  // Handle different data sources
  if (dataSource === 'none') {
    return element.fields || {}
  }
  
  if (dataSource.startsWith('twitch.')) {
    const twitchKey = dataSource.replace('twitch.', '')
    return allData?.twitch?.[twitchKey] || {}
  }
  
  if (dataSource.startsWith('youtube.')) {
    const youtubeKey = dataSource.replace('youtube.', '')
    return allData?.youtube?.[youtubeKey] || {}
  }
  
  if (dataSource.startsWith('custom.')) {
    const customKey = dataSource.replace('custom.', '')
    return allData?.custom?.[customKey] || {}
  }
  
  if (dataSource.startsWith('config.')) {
    const configKey = dataSource.replace('config.', '')
    // Special handling for chatCommands - return as items array
    if (configKey === 'chatCommands') {
      return { items: config?.chatCommands || [] }
    }
    return config?.[configKey] || {}
  }
  
  return element.fields || {}
}

/**
 * Convert old config format to new element array format
 * This helps with backward compatibility
 */
export const migrateOldConfig = (oldConfig) => {
  // Migration: Add animation to existing elements if missing
  // Migration: Move chat commands from global to element fields
  // Migration: Move subtitle from element root to fields.subtext
  if (oldConfig.elements && Array.isArray(oldConfig.elements)) {
    const migratedElements = oldConfig.elements.map(element => {
      let migrated = { ...element }
      
      // Add animation if missing
      if (!migrated.animation) {
        migrated.animation = 'fadeIn'
      }
      
      // Migrate chat commands from config.chatCommands to element fields
      if (element.type === 'list' && element.dataSource === 'config.chatCommands') {
        migrated.dataSource = 'none'
        migrated.fields = {
          ...migrated.fields,
          items: oldConfig.chatCommands || []
        }
      }
      
      // Migrate subtitle to fields.subtext
      if (element.subtitle !== undefined) {
        migrated.fields = {
          ...migrated.fields,
          subtext: element.subtitle
        }
        delete migrated.subtitle
      }
      
      // Ensure subtext exists in fields
      if (!migrated.fields) {
        migrated.fields = {}
      }
      if (migrated.fields.subtext === undefined) {
        migrated.fields.subtext = ''
      }
      
      return migrated
    })
    
    return { ...oldConfig, elements: migratedElements }
  }
  
  // Convert old format to new format
  const newElements = []
  
  if (oldConfig.elements) {
    const oldElements = oldConfig.elements
    
    if (oldElements.followerGoal) {
      newElements.push({
        id: 'followerGoal',
        type: 'progress',
        enabled: oldElements.followerGoal.enabled,
        title: oldElements.followerGoal.title || 'Follower Goal',
        subtitle: '',
        emote: oldElements.followerGoal.emote || '👥',
        zIndex: oldElements.followerGoal.zIndex || 1,
        animation: 'fadeIn',
        dataSource: 'twitch.followers',
        fields: {
          goal: oldElements.followerGoal.goal || 1000,
          current: oldElements.followerGoal.current || 0,
          showPercentage: true
        }
      })
    }
    
    if (oldElements.subscriberGoal) {
      newElements.push({
        id: 'subscriberGoal',
        type: 'progress',
        enabled: oldElements.subscriberGoal.enabled,
        title: oldElements.subscriberGoal.title || 'Subscriber Goal',
        subtitle: '',
        emote: oldElements.subscriberGoal.emote || '⭐',
        zIndex: oldElements.subscriberGoal.zIndex || 2,
        animation: 'slideLeft',
        dataSource: 'twitch.subscribers',
        fields: {
          goal: oldElements.subscriberGoal.goal || 500,
          current: oldElements.subscriberGoal.current || 0,
          showPercentage: true
        }
      })
    }
    
    if (oldElements.donations) {
      newElements.push({
        id: 'donations',
        type: 'counter',
        enabled: oldElements.donations.enabled,
        title: oldElements.donations.title || 'Total Donations',
        subtitle: 'Thank you for your support!',
        emote: oldElements.donations.emote || '💰',
        zIndex: oldElements.donations.zIndex || 3,
        animation: 'slideUp',
        dataSource: 'custom.donations',
        fields: {
          value: 0,
          prefix: '$',
          suffix: ''
        }
      })
    }
    
    if (oldElements.chatCommands) {
      newElements.push({
        id: 'chatCommands',
        type: 'list',
        enabled: oldElements.chatCommands.enabled,
        title: 'Chat Commands',
        subtitle: '',
        emote: '',
        zIndex: oldElements.chatCommands.zIndex || 4,
        animation: 'fadeIn',
        dataSource: 'none',
        fields: {
          maxItemsToShow: oldElements.chatCommands.maxCommandsToShow || 3,
          showAsCarousel: true,
          items: oldConfig.chatCommands || []
        }
      })
    }
    
    if (oldElements.latestVOD) {
      newElements.push({
        id: 'latestVOD',
        type: 'info',
        enabled: oldElements.latestVOD.enabled,
        title: oldElements.latestVOD.title || 'Latest VOD',
        subtitle: 'Type !vod or !youtube in chat',
        emote: oldElements.latestVOD.emote || '🎬',
        zIndex: oldElements.latestVOD.zIndex || 5,
        animation: 'scale',
        dataSource: 'twitch.vods',
        fields: {
          showThumbnail: false,
          text: 'Latest Stream Highlights',
          subtext: ''
        }
      })
    }
  }
  
  return {
    ...oldConfig,
    elements: newElements
  }
}
