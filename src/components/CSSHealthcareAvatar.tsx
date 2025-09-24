'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ttsClient, VoiceInfo } from '@/lib/text-to-speech'
import TextToSpeechPlayer from './TextToSpeechPlayer'

interface CSSHealthcareAvatarProps {
  text: string
  audience?: 'patient' | 'provider' | 'payer'
  className?: string
  autoStart?: boolean
}

export default function CSSHealthcareAvatar({
  text,
  audience = 'patient',
  className = '',
  autoStart = false
}: CSSHealthcareAvatarProps) {
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('female')
  const [avatarMood, setAvatarMood] = useState<'professional' | 'caring' | 'calm' | 'attentive'>('professional')
  const [selectedExpression, setSelectedExpression] = useState<'neutral' | 'smiling' | 'concerned' | 'reassuring'>('neutral')
  const [isAnimating, setIsAnimating] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

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

  const handleStartPresentation = useCallback(() => {
    setIsAnimating(true)
    setSelectedExpression('smiling')

    // Auto-stop animation after estimated speech time
    const estimatedDuration = (text.length / 10) * 1000
    setTimeout(() => {
      setIsAnimating(false)
      setSelectedExpression('neutral')
    }, estimatedDuration)
  }, [text])

  const handleStopPresentation = useCallback(() => {
    setIsAnimating(false)
    setSelectedExpression('neutral')
  }, [])

  const getAvatarEmoji = () => {
    if (avatarGender === 'female') {
      switch (avatarMood) {
        case 'caring': return '👩‍⚕️'
        case 'professional': return '👩‍💼'
        case 'calm': return '😌👩'
        case 'attentive': return '👀👩'
        default: return '👩‍⚕️'
      }
    } else {
      switch (avatarMood) {
        case 'caring': return '👨‍⚕️'
        case 'professional': return '👨‍💼'
        case 'calm': return '😌👨'
        case 'attentive': return '👀👨'
        default: return '👨‍⚕️'
      }
    }
  }

  const getBackgroundGradient = () => {
    switch (avatarMood) {
      case 'caring': return 'from-pink-100 via-blue-50 to-green-50'
      case 'professional': return 'from-blue-100 via-indigo-50 to-blue-100'
      case 'calm': return 'from-green-100 via-blue-50 to-purple-50'
      case 'attentive': return 'from-yellow-50 via-blue-50 to-indigo-100'
      default: return 'from-blue-50 to-white'
    }
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

  return (
    <div className={`${className} bg-gradient-to-br ${getBackgroundGradient()} rounded-lg shadow-lg overflow-hidden`}>
      {/* Avatar Display Section */}
      <div className="relative p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

        {/* Main Avatar */}
        <div className="relative text-center">
          <div
            className={`text-8xl mb-4 transition-all duration-500 ${
              isAnimating
                ? 'animate-bounce scale-110'
                : selectedExpression === 'smiling'
                  ? 'scale-105'
                  : 'scale-100'
            }`}
          >
            {getAvatarEmoji()}
          </div>

          {/* Name Tag */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 mb-4 inline-block shadow-md">
            <div className="text-sm font-bold text-gray-800">
              Dr. {avatarGender === 'female' ? 'Sarah' : 'Michael'} AI
            </div>
            <div className="text-xs text-gray-600">Healthcare Assistant</div>
          </div>

          {/* Speech Bubble */}
          {isAnimating && (
            <div className="relative bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg mb-4 max-w-md mx-auto">
              <div className="text-sm text-gray-700 animate-pulse">
                {selectedExpression === 'smiling' ?
                  "📢 Reading your healthcare summary..." :
                  "💬 Presenting your medical information..."}
              </div>
              {/* Speech bubble arrow */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45"></div>
            </div>
          )}

          {/* Animated Elements */}
          <div className="flex justify-center space-x-2 mb-6">
            {/* Heartbeat Animation */}
            <div className={`w-4 h-4 rounded-full ${isAnimating ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`}></div>
            {/* Breathing Animation */}
            <div className={`w-4 h-4 rounded-full ${isAnimating ? 'bg-blue-400 animate-bounce' : 'bg-gray-300'}`}></div>
            {/* Activity Animation */}
            <div className={`w-4 h-4 rounded-full ${isAnimating ? 'bg-green-400 animate-ping' : 'bg-gray-300'}`}></div>
          </div>

          {/* Status Indicator */}
          <div className="text-sm text-gray-600 mb-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
              {audience.charAt(0).toUpperCase() + audience.slice(1)} Mode
            </span>
            {isAnimating && (
              <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                🎙️ Speaking
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white/90 backdrop-blur-sm p-4 space-y-4">
        {/* Avatar Customization */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Avatar</label>
            <select
              value={avatarGender}
              onChange={(e) => setAvatarGender(e.target.value as 'male' | 'female')}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              disabled={isAnimating}
            >
              <option value="female">👩‍⚕️ Dr. Sarah (Female)</option>
              <option value="male">👨‍⚕️ Dr. Michael (Male)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mood</label>
            <select
              value={avatarMood}
              onChange={(e) => setAvatarMood(e.target.value as any)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              disabled={isAnimating}
            >
              <option value="professional">🏥 Professional</option>
              <option value="caring">💝 Caring</option>
              <option value="calm">😌 Calm</option>
              <option value="attentive">👀 Attentive</option>
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
              disabled={isAnimating}
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

        {/* Expression Controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedExpression('smiling')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedExpression === 'smiling'
                ? 'bg-green-200 text-green-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={isAnimating}
          >
            😊 Reassuring
          </button>
          <button
            onClick={() => setSelectedExpression('concerned')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedExpression === 'concerned'
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={isAnimating}
          >
            🤔 Concerned
          </button>
          <button
            onClick={() => setSelectedExpression('neutral')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedExpression === 'neutral'
                ? 'bg-blue-200 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={isAnimating}
          >
            😐 Neutral
          </button>
        </div>

        {/* TTS Controls */}
        <div className="border-t pt-4">
          <TextToSpeechPlayer
            text={text}
            audience={audience}
            className="w-full"
          />
        </div>

        {/* Info Section */}
        <div className="text-xs text-gray-600 space-y-1 border-t pt-3">
          <p>🤖 Advanced CSS-Animated Healthcare Assistant</p>
          <p>💬 Optimized for {audience} communication with medical terminology</p>
          <p>🎨 Interactive expressions and mood-based visual themes</p>
          {selectedVoice && (
            <p>🎙️ Voice: {availableVoices.find(v => v.voice.name === selectedVoice.name)?.displayName}</p>
          )}
        </div>
      </div>
    </div>
  )
}