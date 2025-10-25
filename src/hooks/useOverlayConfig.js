import { useState, useEffect, useCallback } from 'react'
import { fetchConfig, updateConfig } from '../api'
import { getDefaultConfig } from '../config'
import { migrateOldConfig } from '../utils/elementRenderer.jsx'

const clone = (value) => JSON.parse(JSON.stringify(value))

export const useOverlayConfig = () => {
  const [config, setConfig] = useState(null)
  const [previewConfig, setPreviewConfigState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const hydrateConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const serverConfig = await fetchConfig()
      const resolved = serverConfig && Object.keys(serverConfig).length > 0
        ? migrateOldConfig(serverConfig)
        : migrateOldConfig(getDefaultConfig())
      setConfig(resolved)
      setPreviewConfigState(clone(resolved))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    hydrateConfig()
  }, [hydrateConfig])

  const setPreviewConfig = (nextConfig) => {
    setPreviewConfigState(prev => {
      const resolved = typeof nextConfig === 'function' ? nextConfig(clone(prev)) : nextConfig
      return clone(resolved)
    })
  }

  const applyChanges = async () => {
    if (!previewConfig) return
    await updateConfig(previewConfig)
    setConfig(clone(previewConfig))
  }

  return {
    config,
    previewConfig,
    setPreviewConfig,
    reloadConfig: hydrateConfig,
    applyChanges,
    loading,
    error
  }
}
