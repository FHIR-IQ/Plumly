'use client'

import React, { useState } from 'react'
import AudioPlayer from './AudioPlayer'
import HighlightedSummary from './HighlightedSummary'

interface SummaryOutputProps {
  summary: string
  metadata?: {
    timestamp: string
    options: any
    resourceCounts: Record<string, number>
  }
  isLoading?: boolean
  onDownload?: (format: 'txt' | 'json' | 'fhir') => void
  className?: string
}

export default function SummaryOutput({
  summary,
  metadata,
  isLoading = false,
  onDownload,
  className = ''
}: SummaryOutputProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'metadata' | 'audio'>('summary')

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-gray-600">Generating AI summary...</div>
          <div className="text-sm text-gray-500">This may take a moment</div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className={`${className} text-center py-12 text-gray-500`}>
        <div className="text-4xl mb-4">📋</div>
        <div>No summary generated yet</div>
        <div className="text-sm mt-2">Upload a FHIR bundle and configure your prompt to get started</div>
      </div>
    )
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Header with tabs and download button */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audio'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audio
          </button>
          {metadata && (
            <button
              onClick={() => setActiveTab('metadata')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metadata'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Metadata
            </button>
          )}
        </div>

        {onDownload && (
          <div className="flex space-x-2">
            <button
              onClick={() => onDownload('txt')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              📄 TXT
            </button>
            <button
              onClick={() => onDownload('json')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              🔧 JSON
            </button>
            <button
              onClick={() => onDownload('fhir')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🏥 FHIR
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeTab === 'summary' && (
          <div className="prose max-w-none">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <HighlightedSummary text={summary} />
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <AudioPlayer text={summary} />
          </div>
        )}

        {activeTab === 'metadata' && metadata && (
          <div className="space-y-6">
            {/* Generation Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Generation Information</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Generated</dt>
                  <dd className="text-gray-600">{formatTimestamp(metadata.timestamp)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Target Audience</dt>
                  <dd className="text-gray-600 capitalize">{metadata.options?.targetAudience || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Output Format</dt>
                  <dd className="text-gray-600 capitalize">{metadata.options?.outputFormat || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Recommendations</dt>
                  <dd className="text-gray-600">{metadata.options?.includeRecommendations ? 'Included' : 'Not included'}</dd>
                </div>
              </dl>
              {metadata.options?.focusAreas && Array.isArray(metadata.options.focusAreas) && metadata.options.focusAreas.length > 0 && (
                <div className="mt-3">
                  <dt className="font-medium text-gray-700">Focus Areas</dt>
                  <dd className="text-gray-600 mt-1">
                    <div className="flex flex-wrap gap-1">
                      {metadata.options.focusAreas.map((area: string) => (
                        <span key={area} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {area}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </div>

            {/* Resource Counts */}
            {metadata.resourceCounts && typeof metadata.resourceCounts === 'object' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">FHIR Resources Processed</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(metadata.resourceCounts)
                    .filter(([key]) => key !== 'Total')
                    .map(([resourceType, count]) => (
                      <div key={resourceType} className="text-center">
                        <div className="text-lg font-semibold text-blue-700">{count}</div>
                        <div className="text-sm text-blue-600">{resourceType}</div>
                      </div>
                    ))}
                </div>
                {metadata.resourceCounts.Total && (
                  <div className="mt-4 pt-3 border-t border-blue-200 text-center">
                    <div className="text-xl font-bold text-blue-800">{metadata.resourceCounts.Total}</div>
                    <div className="text-sm text-blue-600">Total Resources</div>
                  </div>
                )}
              </div>
            )}

            {/* Prompt Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Prompt Used</h4>
              <div className="bg-white border border-gray-200 rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {metadata.options?.templateId || 'Custom prompt'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}