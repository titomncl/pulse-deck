import { useState, useEffect, useRef } from 'react'
import '../styles/SlantedPanel.css'

function SlantedPanel({ 
  emote, 
  title, 
  content, 
  subtitle,
  customStyles = {},
  colors = {},
  compact = false,
  animation = 'fadeIn',
  isTransitioning = false,
  emoteSize = 100, // Default to 100%
  displayDuration = 5000 // milliseconds how long this element is shown
}) {
  const [imageError, setImageError] = useState(false)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const [titleMarquee, setTitleMarquee] = useState(null)
  const [subtitleMarquee, setSubtitleMarquee] = useState(null)
  
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
  
  // Use transform scale to multiply the base CSS size (70%)
  // emoteSize 100 = scale(1.0) = 100% of base = 70% of container
  // emoteSize 150 = scale(1.5) = 150% of base = 105% of container (capped by max)
  const scaleValue = emoteSize / 100
  const emoteContainerStyle = {
    transform: `scale(${scaleValue})`,
    fontSize: `${emoteSize}%`  // For emoji text sizing
  }
  
  // For emoji text only (not images)
  const emoteTextStyle = {
    transform: `scale(${scaleValue})`,
    fontSize: '120px'  // Base font size from CSS
  }

  // Detect overflow and enable marquee scrolling when text is wider than its container
  useEffect(() => {
    const checkOverflow = (ref, setter) => {
      const el = ref?.current
      if (!el) {
        setter(null)
        return
      }

      // Parent container is the clipping box we compare against
      const container = el.parentElement
      if (!container) {
        setter(null)
        return
      }

      const textWidth = el.scrollWidth
      const containerWidth = container.clientWidth

      if (textWidth > containerWidth + 4) {
        const distance = textWidth - containerWidth
        // Use the displayDuration so the animation roughly lasts as long as
        // the element is visible. Subtract a small lead/lag so the text
        // is readable at the start and end.
        const totalSeconds = Math.max(1, (displayDuration - 800) / 1000)
        setter({ distance, duration: totalSeconds })
      } else {
        setter(null)
      }
    }

    // Recalculate when title/subtitle/content change or when display time updates
    checkOverflow(titleRef, setTitleMarquee)
    checkOverflow(subtitleRef, setSubtitleMarquee)
  }, [title, subtitle, content, displayDuration])

  return (
    <div className="slanted-panel-container" style={customStyles.container}>
      <div className="slanted-panel" style={panelStyle}>
        {/* Left emote area */}
        <div className={`panel-left-well ${isTransitioning ? 'transitioning' : ''} animation-${animation}`} style={customStyles.leftWell}>
          {emote && (
            // Check if it's a file path (contains . for extension) or URL
            (emote.includes('.') || emote.startsWith('http')) && !imageError ? (
              <div className="panel-emote" style={emoteContainerStyle}>
                <img 
                  src={emote.startsWith('http') ? emote : `/emotes/${emote}`} 
                  alt="emote" 
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="panel-emote" style={emoteTextStyle}>{emote}</div>
            )
          )}
        </div>

        {/* Divider */}
        <div className="panel-divider" style={dividerStyle}></div>

        {/* Right content area */}
        <div className={`panel-right-content ${isTransitioning ? 'transitioning' : ''} animation-${animation}`} style={customStyles.rightContent}>
          {title && (
            <h2 className="panel-title" style={titleStyle}>
              <span
                ref={titleRef}
                className={titleMarquee ? 'scrolling-text' : ''}
                style={titleMarquee ? { '--marquee-to': `-${titleMarquee.distance}px`, animationDuration: `${titleMarquee.duration}s` } : {}}
              >
                {title}
              </span>
            </h2>
          )}
          {content && <div className="panel-content-body">{content}</div>}
          {subtitle && (
            <p className="panel-subtitle" style={subtitleStyle}>
              <span
                ref={subtitleRef}
                className={subtitleMarquee ? 'scrolling-text' : ''}
                style={subtitleMarquee ? { '--marquee-to': `-${subtitleMarquee.distance}px`, animationDuration: `${subtitleMarquee.duration}s` } : {}}
              >
                {subtitle}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SlantedPanel
