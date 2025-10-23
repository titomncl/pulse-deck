import { useEffect, useState } from 'react'
import '../styles/OverlayElement.css'

function OverlayElement({ type, config, data, onGoalReached }) {
  const [showAnimation, setShowAnimation] = useState(false)
  const [previousValue, setPreviousValue] = useState(null)

  useEffect(() => {
    // Check if goal was reached
    if (type === 'followerGoal' || type === 'subscriberGoal') {
      const current = data?.current || 0
      const goal = config.goal || 0
      
      if (previousValue !== null && previousValue < goal && current >= goal) {
        setShowAnimation(true)
        onGoalReached?.(type)
        
        setTimeout(() => setShowAnimation(false), 3000)
      }
      
      setPreviousValue(current)
    }
  }, [data, config.goal, type, previousValue, onGoalReached])

  const renderContent = () => {
    switch (type) {
      case 'followerGoal':
        return (
          <div className="goal-content">
            <div className="goal-header">Follower Goal</div>
            <div className="goal-progress">
              <div className="goal-bar">
                <div 
                  className="goal-fill" 
                  style={{ 
                    width: `${Math.min((data?.current / config.goal) * 100, 100)}%`,
                    backgroundColor: config.color 
                  }}
                />
              </div>
              <div className="goal-text">
                {data?.current || 0} / {config.goal}
              </div>
            </div>
          </div>
        )

      case 'subscriberGoal':
        return (
          <div className="goal-content">
            <div className="goal-header">Subscriber Goal</div>
            <div className="goal-progress">
              <div className="goal-bar">
                <div 
                  className="goal-fill" 
                  style={{ 
                    width: `${Math.min((data?.current / config.goal) * 100, 100)}%`,
                    backgroundColor: config.color 
                  }}
                />
              </div>
              <div className="goal-text">
                {data?.current || 0} / {config.goal}
              </div>
            </div>
          </div>
        )

      case 'donations':
        return (
          <div className="donation-content">
            <div className="donation-header">Total Donations</div>
            <div className="donation-amount">${data?.total || 0}</div>
          </div>
        )

      case 'chatCommands':
        return (
          <div className="commands-content">
            <div className="commands-header">Chat Commands</div>
            <div className="commands-list">
              {data?.commands?.length > 0 ? (
                data.commands.map((cmd, index) => (
                  <div key={index} className="command-item">
                    <span className="command-name">{cmd.name}</span>
                    <span className="command-desc">{cmd.description}</span>
                  </div>
                ))
              ) : (
                <div className="no-commands">No commands configured</div>
              )}
            </div>
          </div>
        )

      case 'latestVOD':
        return (
          <div className="vod-content">
            {data?.vod ? (
              <>
                <div className="vod-thumbnail">
                  <img 
                    src={data.vod.thumbnail_url.replace('%{width}', '400').replace('%{height}', '225')} 
                    alt={data.vod.title}
                  />
                </div>
                <div className="vod-info">
                  <div className="vod-title">{data.vod.title}</div>
                  <div className="vod-date">
                    {new Date(data.vod.created_at).toLocaleDateString()}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-vod">No recent VODs</div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (!config.enabled) return null

  const style = {
    position: 'absolute',
    left: `${config.position.x}px`,
    top: `${config.position.y}px`,
    width: `${config.size.width}px`,
    height: `${config.size.height}px`,
    backgroundColor: config.backgroundColor,
    color: config.color,
    fontFamily: config.font,
    fontSize: `${config.fontSize}px`,
    zIndex: config.zIndex,
  }

  return (
    <div 
      className={`overlay-element ${config.animation} ${showAnimation ? 'goal-reached' : ''}`}
      style={style}
    >
      {renderContent()}
    </div>
  )
}

export default OverlayElement
