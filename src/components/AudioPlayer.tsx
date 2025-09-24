'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { TTSService } from '@/services/tts-service'

interface AudioPlayerProps {
  text: string
  className?: string
}

export default function AudioPlayer({ text, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [rate, setRate] = useState(1.0)
  const [isSupported, setIsSupported] = useState(false)

  const ttsService = TTSService.getInstance()

  useEffect(() => {
    // Check if TTS is supported
    setIsSupported(ttsService.isAvailable())

    // Load voices
    const loadVoices = () => {
      const availableVoices = ttsService.getVoices()
      setVoices(availableVoices)
      if (!selectedVoice && availableVoices.length > 0) {
        setSelectedVoice(ttsService.getPreferredVoice())
      }
    }

    loadVoices()

    // Handle voice list updates (Chrome loads voices asynchronously)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      ttsService.stop()
    }
  }, [ttsService, selectedVoice])

  const handlePlay = useCallback(() => {
    if (!text) return

    setIsPlaying(true)
    setIsPaused(false)

    ttsService.speak(text, {
      voice: selectedVoice || undefined,
      rate,
      onEnd: () => {
        setIsPlaying(false)
        setIsPaused(false)
      },
      onError: (error) => {
        console.error('Speech synthesis error:', error)
        setIsPlaying(false)
        setIsPaused(false)
      }
    })
  }, [text, selectedVoice, rate, ttsService])

  const handlePause = useCallback(() => {
    ttsService.pause()
    setIsPaused(true)
  }, [ttsService])

  const handleResume = useCallback(() => {
    ttsService.resume()
    setIsPaused(false)
  }, [ttsService])

  const handleStop = useCallback(() => {
    ttsService.stop()
    setIsPlaying(false)
    setIsPaused(false)
  }, [ttsService])

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <div className="text-yellow-800 text-sm">
          <strong>Note:</strong> Text-to-speech is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.
        </div>
      </div>
    )
  }

  if (!text) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <div className="text-gray-600 text-sm">
          No text available for audio playback. Generate a summary first.
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex items-center space-x-3">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Play
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </button>
            )}

            <button
              onClick={handleStop}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          </>
        )}
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Voice
        </label>
        <select
          value={selectedVoice?.name || ''}
          onChange={(e) => {
            const voice = voices.find(v => v.name === e.target.value)
            setSelectedVoice(voice || null)
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled={isPlaying}
        >
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Speed: {rate.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full"
          disabled={isPlaying}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Status */}
      {isPlaying && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-blue-800 text-sm font-medium">
              {isPaused ? 'Paused' : 'Speaking...'}
            </span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-gray-700 text-xs">
          <div className="font-medium mb-1">💡 Tips:</div>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Choose a voice that sounds natural to you</li>
            <li>Adjust speed for comfortable listening</li>
            <li>Pause and resume as needed</li>
            <li>Text-to-speech works best with shorter summaries</li>
          </ul>
        </div>
      </div>
    </div>
  )
}