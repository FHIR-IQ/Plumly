'use client'

import React, { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import PromptConfiguration from '@/components/PromptConfiguration'
import SummaryOutput from '@/components/SummaryOutput'
import { FHIRBundle } from '@/types/fhir'
import { SummarizationOptions } from '@/lib/claude-client'

interface SummaryResult {
  summary: string
  metadata: {
    timestamp: string
    options: SummarizationOptions
    resourceCounts: Record<string, number>
  }
}

interface ErrorResponse {
  error: string
  errorType?: string
  details?: string
  retryable?: boolean
}

export default function Home() {
  const [currentBundle, setCurrentBundle] = useState<FHIRBundle | null>(null)
  const [promptConfig, setPromptConfig] = useState<SummarizationOptions & { templateId?: string }>({
    targetAudience: 'patient',
    outputFormat: 'narrative',
    includeRecommendations: false,
    focusAreas: []
  })
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<ErrorResponse | null>(null)

  const handleFileUpload = (bundle: FHIRBundle) => {
    setCurrentBundle(bundle)
    setSummaryResult(null)
    setError(null)
  }

  const handlePromptConfigChange = (config: SummarizationOptions & { templateId?: string }) => {
    setPromptConfig(config)
  }

  const generateSummary = async () => {
    if (!currentBundle) {
      setError({ error: 'Please upload a FHIR bundle first' })
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bundle: currentBundle,
          options: promptConfig
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Use the enhanced error response from the API
        setError({
          error: data.error || 'Failed to generate summary',
          errorType: data.errorType,
          details: data.details,
          retryable: data.retryable
        })
        return
      }

      setSummaryResult({
        summary: data.summary,
        metadata: data.metadata
      })
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : 'Failed to generate summary',
        errorType: 'network'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (format: 'txt' | 'json' | 'fhir') => {
    if (!summaryResult) return

    let content: string
    let filename: string
    let mimeType: string

    switch (format) {
      case 'txt':
        content = summaryResult.summary
        filename = `summary-${new Date().toISOString().split('T')[0]}.txt`
        mimeType = 'text/plain'
        break
      case 'json':
        content = JSON.stringify({
          summary: summaryResult.summary,
          metadata: summaryResult.metadata
        }, null, 2)
        filename = `summary-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
        break
      case 'fhir':
        try {
          const response = await fetch('/api/compose', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bundle: currentBundle,
              summary: summaryResult.summary,
              metadata: summaryResult.metadata,
              outputType: 'composition'
            })
          })

          const data = await response.json()

          if (response.ok) {
            content = JSON.stringify(data.resource, null, 2)
          } else {
            // Fallback to simple composition
            content = JSON.stringify({
              resourceType: 'Composition',
              status: 'final',
              type: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '11503-0',
                  display: 'Medical records'
                }]
              },
              date: summaryResult.metadata.timestamp,
              title: 'AI Generated Health Summary',
              section: [{
                title: 'Summary',
                text: {
                  status: 'generated',
                  div: `<div xmlns="http://www.w3.org/1999/xhtml">${summaryResult.summary.replace(/\n/g, '<br/>')}</div>`
                }
              }]
            }, null, 2)
          }
        } catch (error) {
          console.error('Failed to generate FHIR composition:', error)
          content = JSON.stringify({
            resourceType: 'Composition',
            status: 'final',
            type: {
              coding: [{
                system: 'http://loinc.org',
                code: '11503-0',
                display: 'Medical records'
              }]
            },
            date: summaryResult.metadata.timestamp,
            title: 'AI Generated Health Summary',
            section: [{
              title: 'Summary',
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml">${summaryResult.summary.replace(/\n/g, '<br/>')}</div>`
              }
            }]
          }, null, 2)
        }
        filename = `composition-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/fhir+json'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plumly</h1>
              <p className="text-sm text-gray-600">FHIR Data Summarization with AI</p>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Claude
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Configuration */}
          <div className="lg:col-span-1 space-y-8">
            {/* File Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">1. Upload FHIR Bundle</h2>
              <FileUpload onFileUpload={handleFileUpload} />
              {currentBundle && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-green-800 text-sm">
                    ✅ Bundle uploaded successfully ({currentBundle.entry?.length || 0} resources)
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">2. Configure Prompt</h2>
              <PromptConfiguration onConfigChange={handlePromptConfigChange} />
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">3. Generate Summary</h2>
              <button
                onClick={generateSummary}
                disabled={!currentBundle || isGenerating}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  !currentBundle || isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {isGenerating ? 'Generating Summary...' : 'Generate AI Summary'}
              </button>

              {error && (
                <div className={`mt-4 p-4 border rounded-md ${
                  error.errorType === 'capacity' || error.errorType === 'rate_limit'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                      error.errorType === 'capacity' || error.errorType === 'rate_limit'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {error.errorType === 'capacity' || error.errorType === 'rate_limit' ? (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${
                        error.errorType === 'capacity' || error.errorType === 'rate_limit'
                          ? 'text-yellow-800'
                          : 'text-red-800'
                      }`}>
                        {error.errorType === 'capacity' ? 'Claude AI Temporarily Unavailable' :
                         error.errorType === 'rate_limit' ? 'Rate Limit Exceeded' :
                         error.errorType === 'auth' ? 'Authentication Error' :
                         error.errorType === 'invalid_request' ? 'Invalid Request' :
                         'Generation Error'}
                      </h4>
                      <div className={`mt-1 text-sm ${
                        error.errorType === 'capacity' || error.errorType === 'rate_limit'
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
                        {error.error}
                      </div>
                      {error.retryable && (
                        <div className="mt-3 flex items-center space-x-3">
                          <button
                            onClick={generateSummary}
                            disabled={isGenerating}
                            className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            {isGenerating ? 'Retrying...' : 'Try Again'}
                          </button>
                          <span className="text-xs text-yellow-600">
                            This is a temporary issue with Claude&apos;s servers, not the app.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">AI Generated Summary</h2>
              </div>
              <div className="p-6">
                <SummaryOutput
                  summary={summaryResult?.summary || ''}
                  metadata={summaryResult?.metadata}
                  isLoading={isGenerating}
                  onDownload={handleDownload}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Built with Next.js, TypeScript, and Claude AI</p>
          <p className="mt-1">
            For demo purposes only. Do not use with real patient data.
          </p>
        </footer>
      </main>
    </div>
  )
}