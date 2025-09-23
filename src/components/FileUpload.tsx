'use client'

import React, { useState, useCallback } from 'react'
import { FHIRBundle } from '@/types/fhir'
import { validateFHIRBundle } from '@/lib/fhir-validator'

interface FileUploadProps {
  onFileUpload: (bundle: FHIRBundle) => void
  className?: string
}

export default function FileUpload({ onFileUpload, className = '' }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!validateFHIRBundle(data)) {
        throw new Error('Invalid FHIR Bundle format')
      }

      onFileUpload(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsLoading(false)
    }
  }, [onFileUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'))

    if (jsonFile) {
      handleFile(jsonFile)
    } else {
      setError('Please upload a JSON file')
    }
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="space-y-4">
          <div className="text-4xl">📁</div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-600">Processing file...</div>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-700">
                Drop your FHIR Bundle here or click to browse
              </div>
              <div className="text-sm text-gray-500">
                Supports JSON files containing FHIR R4 Bundles
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <strong>Sample FHIR Bundle structure:</strong>
        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
{`{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "name": [{"given": ["John"], "family": "Doe"}],
        ...
      }
    }
  ]
}`}
        </pre>
      </div>
    </div>
  )
}