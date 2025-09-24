'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ttsClient, TTSControls, TextToSpeechClient } from '@/lib/text-to-speech'

interface TextToSpeechPlayerProps {
  text: string
  audience?: 'patient' | 'provider' | 'payer'
  className?: string
}

export default function TextToSpeechPlayer({
  text,
  audience = 'patient',
  className = ''
}: TextToSpeechPlayerProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [controls, setControls] = useState<TTSControls | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Check browser support and load voices
  useEffect(() => {
    const checkSupport = async () => {
      const supported = TextToSpeechClient.isSupported()
      setIsSupported(supported)

      if (supported) {
        try {
          const voices = await ttsClient.getVoices()
          setAvailableVoices(voices)
          if (voices.length > 0) {
            setSelectedVoice(voices[0])
          }
        } catch (err) {
          console.error('Failed to load voices:', err)
          setError('Failed to load text-to-speech voices')
        }
      }
    }

    checkSupport()
  }, [])

  // Update state when TTS state changes
  const updateState = useCallback(() => {
    if (controls) {
      setIsPlaying(controls.isPlaying)
      setIsPaused(controls.isPaused)
      setProgress(controls.progress)
    }
  }, [controls])

  const handlePlay = async () => {
    if (!text.trim()) {
      setError('No text to read')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Get healthcare-specific TTS settings
      const presets = TextToSpeechClient.getHealthcarePresets()
      const options = {
        ...presets[audience],
        voice: selectedVoice || undefined
      }

      const ttsControls = await ttsClient.speak(text, options, updateState)
      setControls(ttsControls)
    } catch (err) {
      console.error('TTS Error:', err)
      setError('Failed to start text-to-speech')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = () => {
    if (controls) {
      controls.pause()
      updateState()
    }
  }

  const handleResume = () => {
    if (controls) {
      controls.resume()
      updateState()
    }
  }

  const handleStop = () => {
    if (controls) {
      controls.stop()
      updateState()
      setControls(null)
    }
  }

  const formatTime = (progress: number, estimatedDuration: number = 60) => {
    const seconds = Math.floor(progress * estimatedDuration)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isSupported) {
    return (
      <div className={`${className} p-3 bg-yellow-50 border border-yellow-200 rounded-md`}>
        <div className="flex items-center">
          <span className="text-yellow-800 text-sm">
            🔊 Text-to-speech is not supported in this browser
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} p-4 bg-blue-50 border border-blue-200 rounded-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-blue-800 font-medium text-sm">🔊 Audio Summary</span>
          <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">
            {audience} mode
          </span>
        </div>

        {availableVoices.length > 1 && (
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = availableVoices.find(v => v.name === e.target.value)
              setSelectedVoice(voice || null)
            }}
            className="text-xs bg-white border border-blue-300 rounded px-2 py-1"
            disabled={isPlaying}
          >
            {availableVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Progress Bar */}
      {controls && (
        <div className="mb-3">
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-600 mt-1">
            <span>{formatTime(progress)}</span>
            <span>Audio Progress: {Math.round(progress * 100)}%</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-2">
        {!controls || (!isPlaying && !isPaused) ? (
          <button
            onClick={handlePlay}
            disabled={isLoading || !text.trim()}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Play Audio</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            {isPaused ? (
              <button
                onClick={handleResume}
                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center space-x-1 bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zM11 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
                </svg>
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={handleStop}
              className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <span>Stop</span>
            </button>
          </div>
        )}

        {/* Status indicator */}
        {isPlaying && (
          <div className="flex items-center space-x-1 text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-xs">Playing...</span>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Info */}
      <div className="mt-3 text-xs text-blue-600">
        <p>💡 Audio optimized for {audience} audience with medical terminology pronunciation</p>
        {selectedVoice && (
          <p>🎙️ Using: {selectedVoice.name} ({selectedVoice.lang})</p>
        )}
      </div>
    </div>
  )
}