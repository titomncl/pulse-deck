import React from 'react'
import '../styles/TokenValidationPrompt.css'

const TokenValidationPrompt = ({ validationResult, onRetry }) => {
  const getErrorDetails = () => {
    switch (validationResult.error) {
      case 'MISSING_CREDENTIALS':
        return {
          title: '🔑 Twitch Credentials Required',
          message: 'Please enter your Twitch API credentials to continue.',
          instructions: [
            'Go to the Customize page',
            'Enter your Twitch Client ID and OAuth Token',
            'Make sure to use a token with the required scopes'
          ]
        }
      
      case 'INVALID_TOKEN':
        return {
          title: '⚠️ Token Expired or Invalid',
          message: 'Your OAuth token is no longer valid. Please reconnect your Twitch account.',
          instructions: [
            'Visit https://twitchtokengenerator.com/',
            'Select scopes: moderator:read:followers, channel:read:subscriptions',
            'Generate a new token',
            'Update your credentials in the Customize page'
          ]
        }
      
      case 'INSUFFICIENT_SCOPES':
        return {
          title: '🔒 Missing Required Permissions',
          message: `Your token is missing required scopes: ${validationResult.missingScopes.join(', ')}`,
          instructions: [
            'Visit https://twitchtokengenerator.com/',
            'Make sure to select ALL of these scopes:',
            '  • moderator:read:followers',
            '  • channel:read:subscriptions',
            'Generate a new token with correct scopes',
            'Update your credentials in the Customize page'
          ]
        }
      
      case 'CLIENT_ID_MISMATCH':
        return {
          title: '⚠️ Token Mismatch',
          message: 'Your OAuth token does not match your Client ID.',
          instructions: [
            'Make sure your Client ID and OAuth Token are from the same Twitch application',
            'Generate both from https://twitchtokengenerator.com/',
            'Update both credentials in the Customize page'
          ]
        }
      
      default:
        return {
          title: '❌ Validation Error',
          message: validationResult.message || 'Failed to validate your Twitch credentials.',
          instructions: [
            'Check your internet connection',
            'Verify your credentials are correct',
            'Try generating a new token from https://twitchtokengenerator.com/'
          ]
        }
    }
  }

  const details = getErrorDetails()

  return (
    <div className="token-validation-overlay">
      <div className="token-validation-prompt">
        <h2>{details.title}</h2>
        <p className="validation-message">{details.message}</p>
        
        <div className="validation-instructions">
          <h3>How to fix this:</h3>
          <ol>
            {details.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>

        {validationResult.error === 'INSUFFICIENT_SCOPES' && (
          <div className="scopes-info">
            <strong>Required scopes:</strong>
            <ul>
              <li>moderator:read:followers</li>
              <li>channel:read:subscriptions</li>
            </ul>
          </div>
        )}

        <div className="validation-actions">
          <button onClick={onRetry} className="retry-btn">
            🔄 Retry Validation
          </button>
          <a 
            href="https://twitchtokengenerator.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="generate-token-btn"
          >
            🔗 Generate New Token
          </a>
        </div>

        <p className="validation-note">
          ℹ️ After updating your credentials, click "Retry Validation" to check again.
        </p>
      </div>
    </div>
  )
}

export default TokenValidationPrompt
