'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { validateUploadedFile, validateFileSize, validateFileType } from '@plumly/fhir-utils'
import type { ValidationResult, FileUploadResult } from '@plumly/fhir-utils'

interface FHIRUploadProps {
  onFileProcessed?: (result: FileUploadResult) => void
  maxFileSizeMB?: number
}

export function FHIRUpload({ onFileProcessed, maxFileSizeMB = 10 }: FHIRUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<FileUploadResult | null>(null)

  const handleFileProcessing = useCallback(async (file: File): Promise<FileUploadResult> => {
    const startTime = Date.now()

    // File size validation
    if (!validateFileSize(file, maxFileSizeMB)) {
      return {
        success: false,
        validation: {
          isValid: false,
          isFHIRBundle: false,
          isIndividualResource: false,
          resourceCounts: {},
          totalResources: 0,
          errors: [`File size exceeds ${maxFileSizeMB}MB limit`],
          warnings: []
        },
        processingTime: Date.now() - startTime
      }
    }

    // File type validation
    if (!validateFileType(file)) {
      return {
        success: false,
        validation: {
          isValid: false,
          isFHIRBundle: false,
          isIndividualResource: false,
          resourceCounts: {},
          totalResources: 0,
          errors: ['Invalid file type. Please upload a JSON file'],
          warnings: []
        },
        processingTime: Date.now() - startTime
      }
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const validation = validateUploadedFile(data)

      return {
        success: validation.isValid,
        data: validation.isValid ? data : undefined,
        validation,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        validation: {
          isValid: false,
          isFHIRBundle: false,
          isIndividualResource: false,
          resourceCounts: {},
          totalResources: 0,
          errors: ['Failed to parse JSON file'],
          warnings: []
        },
        processingTime: Date.now() - startTime
      }
    }
  }, [maxFileSizeMB])

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return

    const file = files[0]
    setProcessing(true)

    try {
      const result = await handleFileProcessing(file)
      setLastResult(result)
      onFileProcessed?.(result)
    } finally {
      setProcessing(false)
    }
  }, [handleFileProcessing, onFileProcessed])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const clearResults = useCallback(() => {
    setLastResult(null)
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            FHIR Bundle Upload
          </CardTitle>
          <CardDescription>
            Upload FHIR Bundle or individual Resource files (JSON format, max {maxFileSizeMB}MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
            } ${processing ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={processing}
            />

            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  {processing ? 'Processing...' : 'Drop your FHIR file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse files
                </p>
              </div>
              <Button variant="outline" disabled={processing}>
                Choose File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              Upload Results
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={lastResult.success ? 'default' : 'destructive'}>
                {lastResult.success ? 'Valid' : 'Invalid'}
              </Badge>
              {lastResult.validation.isFHIRBundle && (
                <Badge variant="secondary">FHIR Bundle</Badge>
              )}
              {lastResult.validation.isIndividualResource && (
                <Badge variant="secondary">Individual Resource</Badge>
              )}
              <span className="text-sm text-gray-500">
                Processed in {lastResult.processingTime}ms
              </span>
            </div>

            {lastResult.validation.totalResources > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Resource Summary ({lastResult.validation.totalResources} total):
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(lastResult.validation.resourceCounts).map(([type, count]) => (
                    <Badge key={type} variant="outline">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {lastResult.validation.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                <ul className="text-sm space-y-1">
                  {lastResult.validation.errors.map((error, index) => (
                    <li key={index} className="text-red-600">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {lastResult.validation.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-2">Warnings:</p>
                <ul className="text-sm space-y-1">
                  {lastResult.validation.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-600">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}