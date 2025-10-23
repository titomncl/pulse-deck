import { useEffect, useState } from 'react'
import SlantedPanel from './SlantedPanel'
import '../styles/InfoPanel.css'

function InfoPanel({ type, config, data, onGoalReached }) {
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
      case 'followerGoal': {
        const current = data?.current || 0
        const goal = config.goal || 1000
        const percentage = Math.min((current / goal) * 100, 100)
        
        return (
          <SlantedPanel
            emote="👥"
            title="Follower Goal"
            content={
              <div>
                <div className="panel-progress-bar">
                  <div className="panel-progress-text">{current} / {goal}</div>
                  <div 
                    className="panel-progress-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            }
            subtitle={`${Math.round(percentage)}% complete`}
            customStyles={{
              panel: showAnimation ? { animation: 'goalCelebration 0.6s ease-in-out' } : {}
            }}
          />
        )
      }

      case 'subscriberGoal': {
        const current = data?.current || 0
        const goal = config.goal || 500
        const percentage = Math.min((current / goal) * 100, 100)
        
        return (
          <SlantedPanel
            emote="⭐"
            title="Subscriber Goal"
            content={
              <div>
                <div className="panel-progress-bar">
                  <div className="panel-progress-text">{current} / {goal}</div>
                  <div 
                    className="panel-progress-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            }
            subtitle={`${Math.round(percentage)}% complete`}
            customStyles={{
              panel: showAnimation ? { animation: 'goalCelebration 0.6s ease-in-out' } : {}
            }}
          />
        )
      }

      case 'donations':
        return (
          <SlantedPanel
            emote="💰"
            title="Total Donations"
            content={
              <div className="donation-amount-display">
                <span className="donation-currency">$</span>
                <span className="donation-number">{data?.total || 0}</span>
              </div>
            }
            subtitle="Thank you for your support!"
          />
        )

      case 'chatCommands':
        return (
          <SlantedPanel
            emote="💬"
            title="Chat Commands"
            content={
              <div className="panel-command-list">
                {data?.commands?.length > 0 ? (
                  data.commands.map((cmd, index) => (
                    <div key={index} className="panel-command-item">
                      <span className="panel-command-name">{cmd.name}</span>
                      <span className="panel-command-desc">{cmd.description}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-commands">No commands configured</div>
                )}
              </div>
            }
          />
        )

      case 'latestVOD':
        return (
          <SlantedPanel
            emote="🎬"
            title="Latest VOD"
            content={
              data?.vod ? (
                <div className="panel-vod-info">
                  <div className="panel-vod-thumbnail">
                    <img 
                      src={data.vod.thumbnail_url.replace('%{width}', '320').replace('%{height}', '180')} 
                      alt={data.vod.title}
                    />
                  </div>
                  <div className="panel-vod-title">{data.vod.title}</div>
                  <div className="panel-vod-date">
                    {new Date(data.vod.created_at).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="no-vod">No recent VODs available</div>
              )
            }
            subtitle="Type !vod or !youtube in chat"
          />
        )

      default:
        return null
    }
  }

  if (!config.enabled) return null

  return (
    <div 
      className={`info-panel ${config.animation || ''}`}
      style={{
        position: config.position ? 'absolute' : 'relative',
        left: config.position ? `${config.position.x}px` : 'auto',
        top: config.position ? `${config.position.y}px` : 'auto',
        width: config.size ? `${config.size.width}px` : 'auto',
        zIndex: config.zIndex || 1,
      }}
    >
      {renderContent()}
    </div>
  )
}

export default InfoPanel
