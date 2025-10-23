import { useState, useEffect } from 'react'
import { setTwitchApiKey, setTwitchClientId, getTwitchClientId } from '../config'
import { validateCredentials } from '../api'
import '../styles/ApiKeyPrompt.css'

// Your Twitch App Client ID - Users need to create their own app
// or you can provide a default one for your application
const DEFAULT_CLIENT_ID = '6bajjbnteigawashvki5svvsfetrxl' // Replace with your actual Client ID

function ApiKeyPrompt({ onComplete }) {
  const [clientId, setClientIdState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)

  useEffect(() => {
    // Load saved client ID if available
    const savedClientId = getTwitchClientId()
    if (savedClientId) {
      setClientIdState(savedClientId)
    }

    // Check if we have a token in the URL hash (OAuth redirect)
    const hash = window.location.hash.substring(1)
    console.log('URL Hash:', hash) // Debug log
    
    if (hash) {
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      console.log('Access Token found:', accessToken ? 'Yes' : 'No') // Debug log
      
      if (accessToken) {
        // Also save client ID from hash if present
        const tokenClientId = savedClientId || DEFAULT_CLIENT_ID
        if (tokenClientId) {
          setTwitchClientId(tokenClientId)
        }
        
        handleOAuthCallback(accessToken)
      }
    }
  }, [])

  const handleOAuthCallback = async (accessToken) => {
    console.log('Starting OAuth callback handling...') // Debug log
    setLoading(true)
    setError('')

    try {
      // Save the access token
      setTwitchApiKey(accessToken)
      console.log('Access token saved to localStorage') // Debug log
      
      // Validate the token
      console.log('Validating credentials...') // Debug log
      const isValid = await validateCredentials()
      console.log('Validation result:', isValid) // Debug log

      if (isValid) {
        console.log('Credentials valid! Completing setup...') // Debug log
        // Clear the hash from URL
        window.history.replaceState(null, null, window.location.pathname)
        onComplete()
      } else {
        setError('Invalid access token received from Twitch')
      }
    } catch (err) {
      setError(`Failed to validate Twitch credentials: ${err.message}`)
      console.error('OAuth callback error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTwitchConnect = () => {
    const clientIdToUse = clientId || DEFAULT_CLIENT_ID
    
    if (!clientIdToUse || clientIdToUse === 'YOUR_CLIENT_ID_HERE') {
      setError('Please enter your Twitch Client ID first')
      setShowManualInput(true)
      return
    }

    // Save client ID before redirect
    setTwitchClientId(clientIdToUse)
    console.log('Client ID saved:', clientIdToUse) // Debug log

    // OAuth parameters - ensure exact match with registered URI
    const redirectUri = 'http://localhost:3000'
    const responseType = 'token'
    const scope = 'channel:read:subscriptions moderator:read:followers'
    
    // Construct auth URL
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientIdToUse}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`
    
    console.log('Redirecting to:', authUrl) // Debug log
    console.log('Redirect URI:', redirectUri) // Debug log
    
    window.location.href = authUrl
  }

  const handleClientIdSubmit = (e) => {
    e.preventDefault()
    if (clientId.trim()) {
      setTwitchClientId(clientId)
      setShowManualInput(false)
    }
  }

  if (loading) {
    return (
      <div className="api-key-prompt-overlay">
        <div className="api-key-prompt">
          <div className="loading-spinner">
            <h2>Connecting to Twitch...</h2>
            <p>Please wait while we validate your credentials.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="api-key-prompt-overlay">
      <div className="api-key-prompt">
        <h2>Connect with Twitch</h2>
        <p className="description">
          Authorize this overlay to access your Twitch channel data.
          We'll need permission to read your follower and subscriber counts.
        </p>

        {!showManualInput ? (
          <>
            {error && <div className="error-message">{error}</div>}
            
            <button 
              className="twitch-connect-btn" 
              onClick={handleTwitchConnect}
              disabled={loading}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
              Connect with Twitch
            </button>

            <button 
              className="manual-setup-link"
              onClick={() => setShowManualInput(true)}
            >
              Use custom Client ID
            </button>
          </>
        ) : (
          <form onSubmit={handleClientIdSubmit}>
            <div className="form-group">
              <label htmlFor="clientId">Twitch Client ID</label>
              <input
                type="text"
                id="clientId"
                value={clientId}
                onChange={(e) => setClientIdState(e.target.value)}
                placeholder="Your Twitch Application Client ID"
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn">
              Save Client ID
            </button>
            
            <button 
              type="button"
              className="back-btn"
              onClick={() => setShowManualInput(false)}
            >
              Back
            </button>
          </form>
        )}

        <div className="help-section">
          <h3>First time setup:</h3>
          <ol>
            <li>Go to the <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener noreferrer">Twitch Developer Console</a></li>
            <li>Click "Register Your Application"</li>
            <li>Fill in the details:
              <ul>
                <li><strong>Name:</strong> Stream Overlay (or any name)</li>
                <li><strong>OAuth Redirect URLs:</strong> <code>{window.location.origin}{window.location.pathname}</code></li>
                <li><strong>Category:</strong> Broadcasting Suite</li>
              </ul>
            </li>
            <li>Click "Create" and copy your Client ID</li>
            <li>Click "Use custom Client ID" above and paste it</li>
            <li>Click "Connect with Twitch" to authorize</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default ApiKeyPrompt
