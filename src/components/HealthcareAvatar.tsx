'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { HealthcareAvatarEngine, AvatarConfig, AvatarControls } from '@/lib/avatar-engine'
import { ttsClient, VoiceInfo } from '@/lib/text-to-speech'

interface HealthcareAvatarProps {
  text: string
  audience?: 'patient' | 'provider' | 'payer'
  className?: string
  autoStart?: boolean
}

export default function HealthcareAvatar({
  text,
  audience = 'patient',
  className = '',
  autoStart = false
}: HealthcareAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const avatarEngineRef = useRef<HealthcareAvatarEngine | null>(null)

  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [controls, setControls] = useState<AvatarControls | null>(null)

  // Avatar customization states
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('female')
  const [avatarMood, setAvatarMood] = useState<'neutral' | 'calm' | 'professional' | 'caring'>('professional')
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([])

  // Animation state tracking
  const updateState = useCallback(() => {
    if (controls) {
      setIsPlaying(controls.isPlaying)
      setProgress(controls.progress)
    }
  }, [controls])

  // Initialize avatar engine
  useEffect(() => {
    const initAvatar = async () => {
      if (!canvasRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        // Load available voices
        const voicesWithInfo = await ttsClient.getVoicesWithInfo()
        setAvailableVoices(voicesWithInfo)

        // Get best voice for healthcare context
        const healthcarePresets = await ttsClient.getBestVoice(avatarGender)
        if (healthcarePresets) {
          setSelectedVoice(healthcarePresets)
        }

        // Initialize avatar engine
        const engine = new HealthcareAvatarEngine(canvasRef.current)
        avatarEngineRef.current = engine

        const config: AvatarConfig = {
          gender: avatarGender,
          mood: avatarMood,
          voice: selectedVoice || voicesWithInfo[0]?.voice,
          language: 'en-US'
        }

        await engine.initializeAvatar(config)
        setIsInitialized(true)

        // Auto-start if requested
        if (autoStart && text.trim()) {
          handleSpeak()
        }
      } catch (err) {
        console.error('Avatar initialization error:', err)
        setError('Failed to initialize healthcare avatar')
      } finally {
        setIsLoading(false)
      }
    }

    initAvatar()

    // Cleanup
    return () => {
      if (avatarEngineRef.current) {
        avatarEngineRef.current.dispose()
      }
    }
  }, [avatarGender, avatarMood])

  // Handle speaking
  const handleSpeak = async () => {
    if (!avatarEngineRef.current || !selectedVoice || !text.trim()) {
      setError('Avatar not ready or no text to speak')
      return
    }

    try {
      setError(null)

      // Set appropriate mood for speaking
      avatarEngineRef.current.setMood('caring')

      const speechControls = await avatarEngineRef.current.speak(text, selectedVoice)
      setControls(speechControls)

      // Update state periodically
      const interval = setInterval(updateState, 100)

      // Clean up interval when speech ends
      setTimeout(() => {
        clearInterval(interval)
        updateState()
      }, (text.length / 10) * 1000) // Estimated duration

    } catch (err) {
      console.error('Speech error:', err)
      setError('Failed to speak text')
    }
  }

  const handleStop = () => {
    if (avatarEngineRef.current) {
      avatarEngineRef.current.stop()
      setControls(null)
      setIsPlaying(false)
      setProgress(0)
    }
  }

  const handleMoodChange = (mood: 'neutral' | 'calm' | 'professional' | 'caring') => {
    setAvatarMood(mood)
    if (avatarEngineRef.current) {
      avatarEngineRef.current.setMood(mood)
    }
  }

  const handleExpressionChange = (expression: string) => {
    if (avatarEngineRef.current) {
      avatarEngineRef.current.setExpression(expression)
    }
  }

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (avatarEngineRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        avatarEngineRef.current.resize(rect.width, rect.height)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!text.trim()) {
    return (
      <div className={`${className} flex items-center justify-center p-8 bg-gray-50 rounded-lg`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">👩‍⚕️</div>
          <div>No healthcare summary available for avatar presentation</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-lg overflow-hidden`}>
      {/* Avatar Display */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className="w-full h-64 sm:h-80 md:h-96 object-cover"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-blue-800 font-medium">Loading Healthcare AI Assistant...</div>
              <div className="text-sm text-blue-600">Preparing personalized avatar</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
            <div className="w-full bg-white/30 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-white text-sm">
              <span>🎙️ Speaking...</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="p-4 space-y-4">
        {/* Avatar Customization */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Avatar</label>
            <select
              value={avatarGender}
              onChange={(e) => setAvatarGender(e.target.value as 'male' | 'female')}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              disabled={isPlaying}
            >
              <option value="female">👩‍⚕️ Female Doctor</option>
              <option value="male">👨‍⚕️ Male Doctor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mood</label>
            <select
              value={avatarMood}
              onChange={(e) => handleMoodChange(e.target.value as any)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              disabled={isPlaying}
            >
              <option value="professional">🏥 Professional</option>
              <option value="caring">💝 Caring</option>
              <option value="calm">😌 Calm</option>
              <option value="neutral">😐 Neutral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Voice</label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = availableVoices.find(v => v.voice.name === e.target.value)?.voice
                setSelectedVoice(voice || null)
              }}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              disabled={isPlaying}
            >
              {availableVoices
                .filter(v => avatarGender === 'female' ? v.gender === 'female' : v.gender === 'male')
                .map((voiceInfo) => (
                  <option key={voiceInfo.voice.name} value={voiceInfo.voice.name}>
                    {voiceInfo.displayName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Expression Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExpressionChange('reassuring')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            disabled={isPlaying}
          >
            😊 Reassuring
          </button>
          <button
            onClick={() => handleExpressionChange('attentive')}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={isPlaying}
          >
            👀 Attentive
          </button>
          <button
            onClick={() => handleExpressionChange('concerned')}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            disabled={isPlaying}
          >
            🤔 Concerned
          </button>
          <button
            onClick={() => handleExpressionChange('neutral')}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            disabled={isPlaying}
          >
            😐 Reset
          </button>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isPlaying ? (
              <button
                onClick={handleSpeak}
                disabled={isLoading || !isInitialized}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Start Presentation</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>Stop</span>
              </button>
            )}

            {isPlaying && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm">AI Assistant Speaking...</span>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              {audience} mode
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-600 space-y-1 border-t pt-3">
          <p>🤖 AI Healthcare Assistant powered by advanced 3D avatar technology</p>
          <p>💬 Optimized for {audience} communication with medical terminology</p>
          {selectedVoice && (
            <p>🎙️ Voice: {availableVoices.find(v => v.voice.name === selectedVoice.name)?.displayName}</p>
          )}
        </div>
      </div>
    </div>
  )
}