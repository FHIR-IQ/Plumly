'use client'

import React, { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface HealthcareAvatarProps {
  text?: string
  audience?: 'patient' | 'provider' | 'payer'
  className?: string
}

// Dynamically import to avoid SSR issues
const HealthcareAvatarComponent = dynamic(
  () => Promise.resolve(({ text, audience = 'patient', className = '' }: HealthcareAvatarProps) => {
    const avatarRef = useRef<HTMLDivElement>(null)
    const [avatar, setAvatar] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Healthcare-specific Ready Player Me avatars for demo
    const healthcareAvatars = {
      patient: {
        url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb', // Female professional
        body: 'F',
        description: 'Dr. Sarah Chen - Healthcare Assistant'
      },
      provider: {
        url: 'https://models.readyplayer.me/64c2a9b8e4d5f7a9b2c3d4e5.glb', // Male doctor (placeholder)
        body: 'M',
        description: 'Dr. Michael Rodriguez - Medical Specialist'
      },
      payer: {
        url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb', // Default to female
        body: 'F',
        description: 'Healthcare Representative'
      }
    }

    useEffect(() => {
      const initializeAvatar = async () => {
        if (!avatarRef.current) return

        try {
          setIsLoading(true)
          setError(null)

          // Dynamic import of SimpleAvatar for demo
          const { SimpleAvatar } = await import('@/lib/simple-avatar')

          // Initialize SimpleAvatar (this creates the avatar immediately)
          const avatarInstance = new SimpleAvatar(avatarRef.current!)

          // Load appropriate avatar for audience (this should resolve immediately)
          const avatarConfig = healthcareAvatars[audience]
          await avatarInstance.loadAvatar({
            url: avatarConfig.url,
            body: avatarConfig.body
          })

          // Set avatar and loaded state
          setAvatar(avatarInstance)
          setIsLoaded(true)
          setIsLoading(false)

          console.log('Avatar successfully loaded for audience:', audience)

        } catch (err) {
          console.error('Failed to initialize avatar:', err)
          setError(`Failed to load 3D avatar: ${err instanceof Error ? err.message : 'Unknown error'}`)
          setIsLoading(false)
        }
      }

      initializeAvatar()

      // Cleanup on unmount
      return () => {
        if (avatar) {
          avatar.dispose()
        }
      }
    }, [audience])

    const handleSpeak = async () => {
      if (!avatar || !text || isSpeaking) return

      try {
        setIsSpeaking(true)
        setError(null)

        // Set appropriate mood for healthcare context
        avatar.setMood('neutral')

        // Configure speech for medical clarity
        const speechConfig = {
          rate: 0.85, // Slower for medical information
          pitch: 0.1, // Slightly warmer tone
          volume: 0.8
        }

        await avatar.speakText(text, speechConfig)

      } catch (err) {
        console.error('Speech error:', err)
        setError('Failed to play audio. Please check your browser settings.')
      } finally {
        setIsSpeaking(false)
      }
    }

    const handleStop = () => {
      if (avatar && isSpeaking) {
        avatar.stopSpeaking()
        setIsSpeaking(false)
      }
    }

    if (isLoading) {
      return (
        <div className={`${className} p-6 bg-blue-50 border border-blue-200 rounded-lg`}>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <div className="text-lg font-medium text-blue-800 mb-1">Loading AI Healthcare Avatar</div>
              <div className="text-sm text-blue-600">Initializing 3D model and lip-sync system...</div>
              <div className="text-xs text-blue-500 mt-2">This may take 10-15 seconds</div>
            </div>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className={`${className} p-6 bg-red-50 border border-red-200 rounded-lg`}>
          <div className="flex items-center space-x-3 text-red-800">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium">Avatar Loading Error</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={`${className} space-y-4`}>
        {/* Avatar Display */}
        <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 rounded-lg p-4">
          <div className="text-center mb-3">
            <h3 className="text-lg font-medium text-blue-800 mb-1">
              🏥 AI Healthcare Avatar
            </h3>
            <p className="text-sm text-blue-600">
              {healthcareAvatars[audience].description} • {audience.charAt(0).toUpperCase() + audience.slice(1)} Mode
            </p>
          </div>

          <div
            ref={avatarRef}
            className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
            style={{ minHeight: '384px' }}
          />

          {isLoaded && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-1 text-green-600 text-sm mb-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>3D Avatar Ready</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {isLoaded && text && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Avatar Controls</span>
                {isSpeaking && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-xs">Speaking...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!isSpeaking ? (
                <button
                  onClick={handleSpeak}
                  disabled={!text}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Read Summary</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  <span>Stop</span>
                </button>
              )}

              <div className="text-xs text-gray-500">
                🎤 Realistic lip-sync • 🧬 Medical terminology optimized
              </div>
            </div>
          </div>
        )}

        {/* Feature Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">💡 Avatar Features</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <span>🎭</span>
              <span>Ready Player Me 3D Avatar</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💋</span>
              <span>Real-time Lip Sync</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🏥</span>
              <span>Healthcare Optimized Speech</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🆓</span>
              <span>Open Source (MIT License)</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            <strong>Demo Mode:</strong> Using TalkingHead open-source library with Ready Player Me avatars
          </div>
        </div>
      </div>
    )
  }),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-800">Preparing 3D Avatar...</span>
        </div>
      </div>
    )
  }
)

export default function HealthcareAvatar(props: HealthcareAvatarProps) {
  return <HealthcareAvatarComponent {...props} />
}