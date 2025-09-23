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
  const [error, setError] = useState<string | null>(null)

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
      setError('Please upload a FHIR bundle first')
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
        throw new Error(data.error || 'Failed to generate summary')
      }

      setSummaryResult({
        summary: data.summary,
        metadata: data.metadata
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
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
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-red-800 text-sm">
                    <strong>Error:</strong> {error}
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