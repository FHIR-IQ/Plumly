'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ttsClient, VoiceInfo, TTSControls, TextToSpeechClient } from '@/lib/text-to-speech'

interface RealisticDoctorAvatarProps {
  text: string
  audience?: 'patient' | 'provider' | 'payer'
  className?: string
}

export default function RealisticDoctorAvatar({
  text,
  audience = 'patient',
  className = ''
}: RealisticDoctorAvatarProps) {
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('female')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [controls, setControls] = useState<TTSControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Animation states for realistic features
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [mouthOpenness, setMouthOpenness] = useState(0) // 0-1
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 }) // -1 to 1
  const [isBlinking, setIsBlinking] = useState(false)

  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animationFrameRef = useRef<number>()
  const speechTimeoutRef = useRef<NodeJS.Timeout>()

  // Load voices
  useEffect(() => {
    const loadVoices = async () => {
      const voicesWithInfo = await ttsClient.getVoicesWithInfo()
      setAvailableVoices(voicesWithInfo)

      const presets = TextToSpeechClient.getHealthcarePresets()
      const preferredGender = presets[audience]?.gender || avatarGender
      setAvatarGender(preferredGender as 'male' | 'female')

      const bestVoice = await ttsClient.getBestVoice(preferredGender as 'male' | 'female')
      if (bestVoice) {
        setSelectedVoice(bestVoice)
      }
    }

    loadVoices()
  }, [audience])

  // Natural idle animations
  useEffect(() => {
    const animate = () => {
      if (!isSpeaking) {
        // Natural eye movement
        setEyePosition({
          x: Math.sin(Date.now() * 0.001) * 0.3,
          y: Math.cos(Date.now() * 0.0007) * 0.2
        })

        // Random blinking
        if (Math.random() < 0.02) {
          setIsBlinking(true)
          setTimeout(() => setIsBlinking(false), 150)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpeaking])

  // Start speaking
  const handleSpeak = async () => {
    if (!text.trim() || !selectedVoice) {
      setError('No text available or voice not selected')
      return
    }

    try {
      setError(null)
      setIsLoading(true)
      setIsSpeaking(true)

      // Stop any existing speech
      window.speechSynthesis.cancel()

      const presets = TextToSpeechClient.getHealthcarePresets()
      const utterance = new SpeechSynthesisUtterance(text)

      // Apply healthcare-optimized settings
      utterance.voice = selectedVoice
      utterance.rate = presets[audience]?.rate || 0.9
      utterance.pitch = presets[audience]?.pitch || 1.0
      utterance.volume = presets[audience]?.volume || 0.85

      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true)
        setIsLoading(false)
        setProgress(0)
        startSpeechAnimation()
      }

      utterance.onend = () => {
        setIsPlaying(false)
        setIsSpeaking(false)
        setMouthOpenness(0)
        setProgress(1)
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current)
        }
      }

      utterance.onerror = (event) => {
        console.error('Speech error:', event)
        setError('Speech playback failed')
        setIsPlaying(false)
        setIsSpeaking(false)
        setMouthOpenness(0)
      }

      // Progress simulation
      const estimatedDuration = (text.length / 10) * 1000 // rough estimate
      const progressInterval = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          setProgress(prev => Math.min(prev + 0.01, 0.95))
        } else {
          clearInterval(progressInterval)
        }
      }, estimatedDuration / 100)

      speechUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)

    } catch (err) {
      console.error('TTS Error:', err)
      setError('Failed to start speech')
      setIsLoading(false)
      setIsSpeaking(false)
    }
  }

  const startSpeechAnimation = () => {
    // Simple mouth animation during speech
    const animatemouth = () => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        setMouthOpenness(0.3 + Math.random() * 0.4) // Random mouth movement
        setEyePosition({
          x: Math.sin(Date.now() * 0.003) * 0.1,
          y: Math.cos(Date.now() * 0.002) * 0.1
        })

        speechTimeoutRef.current = setTimeout(animatemouth, 150)
      } else {
        setMouthOpenness(0)
      }
    }
    animatemouth()
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsSpeaking(false)
    setMouthOpenness(0)
    setProgress(0)
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
    }
  }

  const handlePause = () => {
    window.speechSynthesis.pause()
    setIsPaused(true)
    setMouthOpenness(0)
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
    }
  }

  const handleResume = () => {
    window.speechSynthesis.resume()
    setIsPaused(false)
    startSpeechAnimation()
  }

  if (!text.trim()) {
    return (
      <div className={`${className} flex items-center justify-center p-8 bg-gray-50 rounded-lg`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">👩‍⚕️</div>
          <div>No healthcare summary available</div>
          <div className="text-sm mt-1">Upload a FHIR bundle to begin</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl shadow-xl overflow-hidden`}>
      {/* Doctor Avatar */}
      <div className="relative p-8 bg-gradient-to-b from-blue-100 to-blue-50">
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Head/Face Container */}
            <div className="relative w-48 h-56 mx-auto">

              {/* Face Shape */}
              <div className="absolute inset-x-6 top-8 bottom-4 bg-gradient-to-b from-orange-200 to-orange-300 rounded-full shadow-lg border-2 border-orange-300">

                {/* Hair */}
                <div className={`absolute -top-8 left-4 right-4 h-12 ${
                  avatarGender === 'female'
                    ? 'bg-gradient-to-b from-amber-800 to-amber-700 rounded-t-full'
                    : 'bg-gradient-to-b from-gray-700 to-gray-600 rounded-t-full'
                } shadow-md`}>
                  {avatarGender === 'female' && (
                    <div className="absolute -left-2 -right-2 top-2 h-8 bg-gradient-to-b from-amber-800 to-amber-700 rounded-full opacity-80"></div>
                  )}
                </div>

                {/* Eyes */}
                <div className="absolute top-6 left-6 right-6 flex justify-between">
                  <div className="relative w-8 h-6 bg-white rounded-full shadow-inner overflow-hidden">
                    <div
                      className={`absolute w-4 h-4 bg-blue-600 rounded-full top-1 transition-all duration-100 ${isBlinking ? 'scale-y-0' : 'scale-y-100'}`}
                      style={{
                        left: `${12 + eyePosition.x * 4}px`,
                        top: `${4 + eyePosition.y * 2}px`
                      }}
                    >
                      <div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-1"></div>
                      <div className="absolute w-1 h-1 bg-white rounded-full top-0.5 left-0.5 opacity-80"></div>
                    </div>
                  </div>
                  <div className="relative w-8 h-6 bg-white rounded-full shadow-inner overflow-hidden">
                    <div
                      className={`absolute w-4 h-4 bg-blue-600 rounded-full top-1 transition-all duration-100 ${isBlinking ? 'scale-y-0' : 'scale-y-100'}`}
                      style={{
                        left: `${4 - eyePosition.x * 4}px`,
                        top: `${4 + eyePosition.y * 2}px`
                      }}
                    >
                      <div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-1"></div>
                      <div className="absolute w-1 h-1 bg-white rounded-full top-0.5 left-0.5 opacity-80"></div>
                    </div>
                  </div>
                </div>

                {/* Eyebrows */}
                <div className="absolute top-4 left-5 right-5 flex justify-between">
                  <div className="w-8 h-1.5 bg-amber-800 rounded-full"></div>
                  <div className="w-8 h-1.5 bg-amber-800 rounded-full"></div>
                </div>

                {/* Nose */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-3 h-6 bg-orange-400 rounded-full shadow-sm"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-orange-500 rounded-full"></div>
                </div>

                {/* Mouth */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`bg-red-400 rounded-full transition-all duration-150 ${
                      isSpeaking ? 'shadow-lg' : 'shadow-md'
                    }`}
                    style={{
                      width: `${16 + mouthOpenness * 12}px`,
                      height: `${4 + mouthOpenness * 8}px`,
                    }}
                  >
                    {isSpeaking && (
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>

                {/* Cheeks - show when speaking */}
                {isSpeaking && (
                  <>
                    <div className="absolute top-16 left-2 w-4 h-4 bg-pink-300 rounded-full opacity-60 animate-pulse"></div>
                    <div className="absolute top-16 right-2 w-4 h-4 bg-pink-300 rounded-full opacity-60 animate-pulse"></div>
                  </>
                )}
              </div>

              {/* Medical Stethoscope */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-4">
                <div className="w-full h-2 bg-gray-600 rounded-full"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-silver-400 rounded-full border-2 border-gray-600"></div>
              </div>
            </div>

            {/* Medical Coat */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-20 bg-white rounded-t-3xl shadow-lg border border-gray-200">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded-full"></div>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Name Badge */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-lg shadow-md text-sm font-semibold">
              Dr. {avatarGender === 'female' ? 'Sarah' : 'Michael'} Wilson
            </div>
          </div>
        </div>

        {/* Speech Bubble */}
        {isPlaying && (
          <div className="relative bg-white rounded-xl p-4 shadow-lg max-w-md mx-auto mb-4">
            <div className="text-sm text-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Reading your healthcare summary...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Progress: {Math.round(progress * 100)}% • Mouth: {Math.round(mouthOpenness * 100)}% open
              </div>
            </div>
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-200"></div>
          </div>
        )}

        {/* Medical Vitals Display */}
        <div className="flex justify-center space-x-6 mb-4">
          <div className="text-center">
            <div className={`w-4 h-4 mx-auto rounded-full mb-1 ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <div className="text-xs text-gray-600">Heart</div>
          </div>
          <div className="text-center">
            <div className={`w-4 h-4 mx-auto rounded-full mb-1 ${isPlaying ? 'bg-blue-500 animate-bounce' : 'bg-gray-300'}`}></div>
            <div className="text-xs text-gray-600">Speech</div>
          </div>
          <div className="text-center">
            <div className={`w-4 h-4 mx-auto rounded-full mb-1 ${isPlaying ? 'bg-green-500 animate-ping' : 'bg-gray-300'}`}></div>
            <div className="text-xs text-gray-600">Brain</div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-6 bg-white space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">AI Healthcare Assistant</h3>
          <p className="text-sm text-gray-600">Optimized for {audience} communication</p>
        </div>

        {/* Avatar Selection */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
            <select
              value={avatarGender}
              onChange={(e) => setAvatarGender(e.target.value as 'male' | 'female')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              disabled={isPlaying}
            >
              <option value="female">👩‍⚕️ Dr. Sarah Wilson</option>
              <option value="male">👨‍⚕️ Dr. Michael Wilson</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = availableVoices.find(v => v.voice.name === e.target.value)?.voice
                setSelectedVoice(voice || null)
              }}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              disabled={isPlaying}
            >
              {availableVoices
                .filter(v => v.gender === avatarGender || v.gender === 'neutral')
                .map((voiceInfo) => (
                  <option key={voiceInfo.voice.name} value={voiceInfo.voice.name}>
                    {voiceInfo.displayName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-3">
          {!isPlaying ? (
            <button
              onClick={handleSpeak}
              disabled={isLoading || !selectedVoice}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Start Consultation</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex space-x-2">
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zM11 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
                  </svg>
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleStop}
                className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>Stop</span>
              </button>
            </div>
          )}
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

        {/* Summary Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">📋 Healthcare Summary Ready</div>
            <div className="text-blue-600 text-xs">
              • {text.length} characters • Estimated reading time: {Math.ceil(text.length / 150)} minutes
            </div>
            <div className="text-blue-600 text-xs">
              • Medical terminology optimized • {audience} audience focused
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}