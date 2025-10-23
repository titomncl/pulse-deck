import { useState, useEffect } from 'react'
import SlantedPanel from '../components/SlantedPanel'
import ApiKeyPrompt from '../components/ApiKeyPrompt'
import TokenValidationPrompt from '../components/TokenValidationPrompt'
import LoadingScreen from '../components/LoadingScreen'
import { getTwitchApiKey, getTwitchClientId, getOverlayConfig, setTwitchClientId, setTwitchApiKey } from '../config'
import { getFollowerCount, getSubscriberCount, validateToken, configWebSocket, fetchConfig } from '../api'
import { renderElement, getElementData, migrateOldConfig } from '../utils/elementRenderer.jsx'
import axios from 'axios'
import '../styles/Display.css'

function Display() {
  // Simple state management
  const [authState, setAuthState] = useState('loading') // 'loading' | 'authenticated' | 'needs-auth' | 'error'
  const [tokenValidation, setTokenValidation] = useState(null)
  const [config, setConfig] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState({
    followers: { current: 0 },
    subscribers: { current: 0 },
    donations: { total: 0 },
    commands: { commands: [] },
    vod: { title: '', date: '', url: '' }
  })
  const [isTransitioning, setIsTransitioning] = useState(false)

  // 1. Authentication - ONE useEffect to handle everything
  useEffect(() => {
    const authenticateUser = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const uuidToken = urlParams.get('token')
      
      try {
        // If UUID token exists, fetch credentials from server
        if (uuidToken) {
          console.log('🔐 Loading credentials from server...')
          const response = await axios.get(`/api/auth/${uuidToken}`)
          setTwitchClientId(response.data.clientId)
          setTwitchApiKey(response.data.apiKey)
          console.log('✅ Credentials loaded')
        }
        
        // Check if we have credentials (either just loaded or from localStorage)
        const apiKey = getTwitchApiKey()
        const clientId = getTwitchClientId()
        
        if (!apiKey || !clientId) {
          setAuthState('needs-auth')
          return
        }
        
        // Validate the credentials
        console.log('🔍 Validating token...')
        const validation = await validateToken()
        
        if (validation.valid) {
          setAuthState('authenticated')
        } else {
          setTokenValidation(validation)
          setAuthState('error')
        }
      } catch (error) {
        console.error('❌ Auth error:', error)
        setAuthState('error')
        setTokenValidation({
          valid: false,
          error: 'AUTH_ERROR',
          message: error.message || 'Authentication failed'
        })
      }
    }
    
    authenticateUser()
  }, [])

  // 2. Load config
  useEffect(() => {
    const loadConfig = async () => {
      const serverConfig = await fetchConfig()
      let configToUse = serverConfig && Object.keys(serverConfig).length > 0 ? serverConfig : getOverlayConfig()
      
      // Migrate old config format to new format if needed
      configToUse = migrateOldConfig(configToUse)
      
      setConfig(configToUse)
    }
    loadConfig()
  }, [])

  // 3. WebSocket config updates
  useEffect(() => {
    const unsubscribe = configWebSocket.onConfigUpdate(setConfig)
    return unsubscribe
  }, [])

  // 4. localStorage config updates  
  useEffect(() => {
    const handleStorageChange = () => setConfig(getOverlayConfig())
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('configUpdated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('configUpdated', handleStorageChange)
    }
  }, [])

  // 5. Fetch Twitch data
  useEffect(() => {
    if (authState !== 'authenticated') return

    const fetchData = async () => {
      try {
        const [followers, subscribers] = await Promise.all([
          getFollowerCount(),
          getSubscriberCount()
        ])
        setData(prev => ({
          ...prev,
          followers: { current: followers },
          subscribers: { current: subscribers }
        }))
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [authState])

  // 6. Auto-rotate steps
  useEffect(() => {
    if (!config) return

    const enabledSteps = getEnabledSteps()
    if (enabledSteps.length === 0) return

    const rotationInterval = config.rotationDuration || 5000
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => (prev + 1) % enabledSteps.length)
        setIsTransitioning(false)
      }, 500)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [config])

  const getEnabledSteps = () => {
    if (!config) return []
    
    const steps = []
    const elements = Array.isArray(config.elements) ? config.elements : []
    
    elements.forEach((element) => {
      if (!element.enabled) return
      
      // Special handling for list elements with carousel
      if (element.type === 'list' && element.fields?.showAsCarousel) {
        const elementData = getElementData(element, { config }, config)
        const items = elementData.items || []
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

  const renderCurrentStep = () => {
    const enabledSteps = getEnabledSteps()
    if (enabledSteps.length === 0) return null
    
    const step = enabledSteps[currentStep]
    const colors = config.colors || {}
    
    // Handle carousel items (individual list items)
    if (step.type === 'carouselItem') {
      const item = step.item
      return (
        <SlantedPanel
          emote={item.emote || step.element.emote || "�"}
          title={item.name || item.title || "Item"}
          colors={colors}
          content={
            <div className="panel-single-command">
              <div className="panel-command-description">{item.description || item.text || ''}</div>
              {item.subtext && <div className="panel-command-subtext">{item.subtext}</div>}
            </div>
          }
          subtitle={step.element.subtitle || ''}
        />
      )
    }
    
    // Handle regular elements
    const element = step.element
    
    // Prepare data for this element
    const allData = {
      twitch: {
        followers: { current: data.followers.current },
        subscribers: { current: data.subscribers.current },
        vods: { text: data.vod.title, subtext: data.vod.date }
      },
      custom: {
        donations: { value: data.donations.total }
      },
      config: config
    }
    
    const elementData = getElementData(element, allData, config)
    const rendered = renderElement(element, elementData, colors)
    
    if (!rendered) return null
    
    // If it's a carousel type, it should have been handled above
    if (rendered.type === 'carousel') return null
    
    return (
      <SlantedPanel
        emote={rendered.emote}
        title={rendered.title}
        colors={colors}
        content={rendered.content}
        subtitle={rendered.subtitle}
      />
    )
  }

  // Render logic - simple and clear
  if (authState === 'loading') {
    return <LoadingScreen message="🔐 Authenticating..." />
  }

  if (authState === 'error') {
    return <TokenValidationPrompt validationResult={tokenValidation} onRetry={() => window.location.reload()} />
  }

  if (authState === 'needs-auth') {
    return <ApiKeyPrompt onComplete={() => window.location.reload()} />
  }

  if (!config) {
    return <LoadingScreen message="Loading configuration..." />
  }

  return (
    <div className="display-container">
      <div className={`display-panel-wrapper ${isTransitioning ? 'transitioning' : ''} transition-${config.transitionAnimation || 'fadeSlide'}`}>
        {renderCurrentStep()}
      </div>
    </div>
  )
}

export default Display
