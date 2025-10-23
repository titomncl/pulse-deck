import { useState, useEffect } from 'react'
import '../styles/SlantedPanel.css'

function SlantedPanel({ 
  emote, 
  title, 
  content, 
  subtitle,
  customStyles = {},
  colors = {},
  compact = false 
}) {
  const [imageError, setImageError] = useState(false)
  
  // Reset image error state when emote changes
  useEffect(() => {
    setImageError(false)
  }, [emote])
  
  const panelStyle = {
    background: colors.panelBackground || '#F3F3F3',
    borderColor: colors.panelBorder || '#002740',
    ...customStyles.panel
  }

  const dividerStyle = {
    background: colors.panelBorder || '#002740',
    ...customStyles.divider
  }

  const titleStyle = {
    color: colors.primaryText || '#002740',
    ...customStyles.title
  }

  const subtitleStyle = {
    color: colors.secondaryText || '#666666',
    ...customStyles.subtitle
  }

  return (
    <div className="slanted-panel-container" style={customStyles.container}>
      <div className="slanted-panel" style={panelStyle}>
        {/* Left emote area */}
        <div className="panel-left-well" style={customStyles.leftWell}>
          {emote && (
            // Check if it's a file path (contains . for extension) or URL
            (emote.includes('.') || emote.startsWith('http')) && !imageError ? (
              <img 
                src={emote.startsWith('http') ? emote : `/emotes/${emote}`} 
                alt="emote" 
                className="panel-emote" 
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="panel-emote">{emote}</div>
            )
          )}
        </div>

        {/* Divider */}
        <div className="panel-divider" style={dividerStyle}></div>

        {/* Right content area */}
        <div className="panel-right-content" style={customStyles.rightContent}>
          {title && <h2 className="panel-title" style={titleStyle}>{title}</h2>}
          {content && <div className="panel-content-body">{content}</div>}
          {subtitle && <p className="panel-subtitle" style={subtitleStyle}>{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export default SlantedPanel
