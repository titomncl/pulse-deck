import React from 'react'
import '../styles/LoadingScreen.css'

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"></div>
        <h2>{message}</h2>
      </div>
    </div>
  )
}

export default LoadingScreen
