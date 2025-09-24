'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ttsClient, VoiceInfo, TTSControls, TextToSpeechClient } from '@/lib/text-to-speech'

interface RealisticHealthcareAvatarProps {
  text: string
  audience?: 'patient' | 'provider' | 'payer'
  className?: string
  autoStart?: boolean
}

export default function RealisticHealthcareAvatar({
  text,
  audience = 'patient',
  className = '',
  autoStart = false
}: RealisticHealthcareAvatarProps) {
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('female')
  const [avatarMood, setAvatarMood] = useState<'professional' | 'caring' | 'calm' | 'attentive'>('professional')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [controls, setControls] = useState<TTSControls | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Animation states
  const [currentViseme, setCurrentViseme] = useState<'silent' | 'A' | 'E' | 'I' | 'O' | 'U' | 'M' | 'L'>('silent')
  const [eyeBlinkState, setEyeBlinkState] = useState(1) // 0 = closed, 1 = open
  const [eyebrowPosition, setEyebrowPosition] = useState(0) // -1 to 1
  const [headTilt, setHeadTilt] = useState(0) // -10 to 10 degrees

  const speechIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Viseme mapping for more realistic lip sync
  const visemeShapes = {
    silent: { mouth: 'scale(1, 0.3)', width: '8px' },
    A: { mouth: 'scale(1.2, 1)', width: '16px' },
    E: { mouth: 'scale(1.1, 0.7)', width: '14px' },
    I: { mouth: 'scale(0.8, 0.6)', width: '6px' },
    O: { mouth: 'scale(1, 1.2)', width: '12px' },
    U: { mouth: 'scale(0.7, 1)', width: '8px' },
    M: { mouth: 'scale(1, 0.2)', width: '4px' },
    L: { mouth: 'scale(1, 0.8)', width: '10px' }
  }

  // Load voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      const voicesWithInfo = await ttsClient.getVoicesWithInfo()
      setAvailableVoices(voicesWithInfo)

      // Set default voice based on gender and audience
      const presets = await ttsClient.getBestVoice(avatarGender)
      if (presets) {
        setSelectedVoice(presets)
      }
    }

    loadVoices()
  }, [avatarGender])

  // Natural idle animations
  useEffect(() => {
    const startIdleAnimations = () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }

      animationIntervalRef.current = setInterval(() => {
        if (!isPlaying) {
          // Random blinking
          if (Math.random() < 0.1) {
            setEyeBlinkState(0)
            setTimeout(() => setEyeBlinkState(1), 150)
          }

          // Subtle head movements
          setHeadTilt(Math.sin(Date.now() * 0.001) * 2)

          // Slight eyebrow movement for breathing
          setEyebrowPosition(Math.sin(Date.now() * 0.0008) * 0.1)
        }
      }, 100)
    }

    startIdleAnimations()

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [isPlaying])

  // Enhanced TTS with visual feedback
  const handleSpeak = async () => {
    if (!text.trim() || !selectedVoice) {
      setError('No text to speak or voice not selected')
      return
    }

    try {
      setError(null)

      // Get healthcare-specific TTS settings
      const presets = TextToSpeechClient.getHealthcarePresets()
      const options = {
        ...presets[audience],
        voice: selectedVoice,
        gender: avatarGender
      }

      const ttsControls = await ttsClient.speak(text, options, updateState)
      setControls(ttsControls)

      // Start lip sync animation
      startLipSyncAnimation(text)

    } catch (err) {
      console.error('TTS Error:', err)
      setError('Failed to start speech')
    }
  }

  const startLipSyncAnimation = (text: string) => {
    // Clear any existing animation
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current)
    }

    // Simple phoneme-based lip sync simulation
    const words = text.toLowerCase().split(' ')
    let wordIndex = 0

    speechIntervalRef.current = setInterval(() => {
      if (wordIndex >= words.length || !isPlaying) {
        setCurrentViseme('silent')
        if (speechIntervalRef.current) {
          clearInterval(speechIntervalRef.current)
        }
        return
      }

      const word = words[wordIndex]
      const visemes = analyzeWordForVisemes(word)

      // Animate through visemes for this word
      visemes.forEach((viseme, index) => {
        setTimeout(() => {
          setCurrentViseme(viseme)

          // Add expression changes during speech
          if (viseme !== 'silent') {
            setEyebrowPosition(Math.random() * 0.3 - 0.15)

            // Occasional blink during speech
            if (Math.random() < 0.05) {
              setEyeBlinkState(0)
              setTimeout(() => setEyeBlinkState(1), 120)
            }
          }
        }, index * 80)
      })

      wordIndex++
    }, 400) // Approximate word timing
  }

  const analyzeWordForVisemes = (word: string): Array<'silent' | 'A' | 'E' | 'I' | 'O' | 'U' | 'M' | 'L'> => {
    const visemes: Array<'silent' | 'A' | 'E' | 'I' | 'O' | 'U' | 'M' | 'L'> = []

    for (const char of word) {
      switch (char) {
        case 'a': visemes.push('A'); break
        case 'e': visemes.push('E'); break
        case 'i': visemes.push('I'); break
        case 'o': visemes.push('O'); break
        case 'u': visemes.push('U'); break
        case 'm': case 'b': case 'p': visemes.push('M'); break
        case 'l': case 'r': visemes.push('L'); break
        default: visemes.push('silent'); break
      }
    }

    return visemes.length > 0 ? visemes : ['silent']
  }

  const updateState = useCallback(() => {
    if (controls) {
      setIsPlaying(controls.isPlaying)
      setIsPaused(controls.isPaused)
      setProgress(controls.progress)

      if (!controls.isPlaying && speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current)
        setCurrentViseme('silent')
      }
    }
  }, [controls])

  const handleStop = () => {
    if (controls) {
      controls.stop()
    }
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current)
    }
    setCurrentViseme('silent')
    setControls(null)
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
  }

  const handlePause = () => {
    if (controls) {
      controls.pause()
    }
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current)
    }
    setCurrentViseme('silent')
  }

  const handleResume = () => {
    if (controls) {
      controls.resume()
    }
    if (text && isPlaying) {
      startLipSyncAnimation(text)
    }
  }

  const getAvatarTheme = () => {
    const themes = {
      professional: {
        bg: 'from-blue-100 via-indigo-50 to-blue-100',
        accent: 'bg-blue-500',
        text: 'text-blue-800'
      },
      caring: {
        bg: 'from-pink-100 via-rose-50 to-pink-100',
        accent: 'bg-pink-500',
        text: 'text-pink-800'
      },
      calm: {
        bg: 'from-green-100 via-emerald-50 to-green-100',
        accent: 'bg-green-500',
        text: 'text-green-800'
      },
      attentive: {
        bg: 'from-yellow-100 via-amber-50 to-yellow-100',
        accent: 'bg-yellow-500',
        text: 'text-yellow-800'
      }
    }
    return themes[avatarMood]
  }

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

  const theme = getAvatarTheme()
  const currentShape = visemeShapes[currentViseme]

  return (
    <div className={`${className} bg-gradient-to-br ${theme.bg} rounded-lg shadow-lg overflow-hidden`}>
      {/* Avatar Display Section */}
      <div className="relative p-8">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

        {/* Floating Medical Icons */}
        {isPlaying && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 left-4 text-2xl animate-bounce delay-100">💊</div>
            <div className="absolute top-8 right-8 text-2xl animate-pulse delay-300">🩺</div>
            <div className="absolute bottom-12 left-8 text-2xl animate-bounce delay-500">❤️</div>
            <div className="absolute bottom-8 right-4 text-2xl animate-pulse delay-700">🧬</div>
          </div>
        )}

        {/* Realistic Avatar Head */}
        <div className="relative text-center">
          <div
            className="inline-block transition-transform duration-200"
            style={{ transform: `rotate(${headTilt}deg)` }}
          >
            {/* Head Shape */}
            <div className="relative w-32 h-40 mx-auto mb-4">
              <div className={`w-full h-full ${theme.accent} rounded-full opacity-10 absolute`}></div>

              {/* Face */}
              <div className="absolute inset-2 bg-orange-200 rounded-full shadow-inner">

                {/* Eyes */}
                <div className="absolute top-8 left-6 w-4 h-3 bg-white rounded-full shadow-sm">
                  <div
                    className="absolute top-1 left-1 w-2 h-2 bg-blue-600 rounded-full transition-transform duration-150"
                    style={{ transform: `scaleY(${eyeBlinkState})` }}
                  ></div>
                </div>
                <div className="absolute top-8 right-6 w-4 h-3 bg-white rounded-full shadow-sm">
                  <div
                    className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full transition-transform duration-150"
                    style={{ transform: `scaleY(${eyeBlinkState})` }}
                  ></div>
                </div>

                {/* Eyebrows */}
                <div
                  className="absolute top-6 left-5 w-6 h-1 bg-brown-600 rounded-full transition-transform duration-300"
                  style={{ transform: `translateY(${eyebrowPosition * 2}px) rotate(-5deg)` }}
                ></div>
                <div
                  className="absolute top-6 right-5 w-6 h-1 bg-brown-600 rounded-full transition-transform duration-300"
                  style={{ transform: `translateY(${eyebrowPosition * 2}px) rotate(5deg)` }}
                ></div>

                {/* Nose */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-orange-300 rounded-full"></div>

                {/* Mouth - Dynamic based on speech */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`${theme.accent} rounded-full transition-all duration-100 ${isPlaying ? 'shadow-lg' : ''}`}
                    style={{
                      width: currentShape.width,
                      height: '6px',
                      transform: currentShape.mouth,
                      background: isPlaying ? 'linear-gradient(45deg, #ef4444, #dc2626)' : undefined
                    }}
                  ></div>
                </div>

                {/* Cheeks - Animated during speech */}
                {isPlaying && (
                  <>
                    <div className="absolute top-14 left-2 w-3 h-3 bg-pink-300 rounded-full opacity-60 animate-pulse"></div>
                    <div className="absolute top-14 right-2 w-3 h-3 bg-pink-300 rounded-full opacity-60 animate-pulse"></div>
                  </>
                )}
              </div>

              {/* Hair */}
              <div className={`absolute -top-2 left-4 right-4 h-8 ${avatarGender === 'female' ? 'bg-amber-800' : 'bg-gray-700'} rounded-t-full`}></div>

              {/* Medical Cap/Scrub Cap */}
              <div className={`absolute -top-4 left-2 right-2 h-6 ${theme.accent} rounded-t-full opacity-80 shadow-sm`}></div>
            </div>
          </div>

          {/* Name Badge */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 mb-4 inline-block shadow-md">
            <div className="text-sm font-bold text-gray-800">
              Dr. {avatarGender === 'female' ? 'Sarah' : 'Michael'} Chen
            </div>
            <div className="text-xs text-gray-600">AI Healthcare Assistant</div>
          </div>

          {/* Speech Status */}
          {isPlaying && (
            <div className="relative bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg mb-4 max-w-md mx-auto">
              <div className="text-sm text-gray-700">
                🗣️ <span className="font-medium">Speaking healthcare summary...</span>
              </div>
              <div className="flex items-center mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`${theme.accent} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">{Math.round(progress * 100)}%</span>
              </div>

              {/* Current viseme indicator */}
              <div className="text-xs text-gray-500 mt-1">
                Mouth shape: <span className="font-mono">{currentViseme}</span>
              </div>

              {/* Speech bubble arrow */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45"></div>
            </div>
          )}

          {/* Vital Signs Animation */}
          <div className="flex justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-xs text-gray-600">Heart</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-blue-500 animate-bounce' : 'bg-gray-300'}`}></div>
              <span className="text-xs text-gray-600">Breath</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-ping' : 'bg-gray-300'}`}></div>
              <span className="text-xs text-gray-600">Neural</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Control Panel */}
      <div className="bg-white/95 backdrop-blur-sm p-6 space-y-4">
        {/* Avatar Customization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Avatar</label>
            <select
              value={avatarGender}
              onChange={(e) => setAvatarGender(e.target.value as 'male' | 'female')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm"
              disabled={isPlaying}
            >
              <option value="female">👩‍⚕️ Dr. Sarah Chen (Female)</option>
              <option value="male">👨‍⚕️ Dr. Michael Chen (Male)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Mood</label>
            <select
              value={avatarMood}
              onChange={(e) => setAvatarMood(e.target.value as any)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm"
              disabled={isPlaying}
            >
              <option value="professional">🏥 Professional</option>
              <option value="caring">💝 Caring & Compassionate</option>
              <option value="calm">😌 Calm & Reassuring</option>
              <option value="attentive">👀 Attentive & Focused</option>
            </select>
          </div>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">AI Voice Assistant</label>
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = availableVoices.find(v => v.voice.name === e.target.value)?.voice
              setSelectedVoice(voice || null)
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm"
            disabled={isPlaying}
          >
            {availableVoices
              .filter(v => v.gender === avatarGender || v.gender === 'neutral')
              .map((voiceInfo) => (
                <option key={voiceInfo.voice.name} value={voiceInfo.voice.name}>
                  🎙️ {voiceInfo.displayName}
                </option>
              ))}
          </select>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-3">
            {!isPlaying ? (
              <button
                onClick={handleSpeak}
                disabled={!selectedVoice}
                className={`flex items-center space-x-2 ${theme.accent} text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Start AI Consultation</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {isPaused ? (
                  <button
                    onClick={handleResume}
                    className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center space-x-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors shadow-md"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zM11 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
                    </svg>
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={handleStop}
                  className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  <span>Stop</span>
                </button>
              </div>
            )}

            {isPlaying && !isPaused && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">AI Doctor is speaking...</span>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <span className={`${theme.accent} text-white px-3 py-1 rounded-full text-xs`}>
              {audience.charAt(0).toUpperCase() + audience.slice(1)} Mode
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

        {/* Enhanced Info */}
        <div className="text-xs text-gray-600 space-y-1 border-t pt-3">
          <p>🤖 <strong>Realistic AI Healthcare Avatar</strong> with advanced lip-sync technology</p>
          <p>💬 Optimized for {audience} communication with medical terminology pronunciation</p>
          <p>🎭 Real-time facial animations: eye blinking, eyebrow movement, head tilt</p>
          <p>👄 Dynamic viseme-based lip sync matching speech patterns</p>
          {selectedVoice && (
            <p>🎙️ Voice: {availableVoices.find(v => v.voice.name === selectedVoice.name)?.displayName}</p>
          )}
        </div>
      </div>
    </div>
  )
}