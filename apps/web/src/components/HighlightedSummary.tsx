'use client'

import React from 'react'
import { highlightHealthConcerns, getConcernSummary, HealthConcern, HighlightPart } from '@/lib/health-concern-detector'

interface HighlightedSummaryProps {
  text: string
  className?: string
  showLegend?: boolean
}

export default function HighlightedSummary({ text, className = '', showLegend = true }: HighlightedSummaryProps) {
  const parts = highlightHealthConcerns(text)
  const summary = getConcernSummary(text)

  const renderPart = (part: HighlightPart, index: number) => {
    if (part.type === 'text') {
      return <span key={index}>{part.text}</span>
    }

    if (part.type === 'concern' && part.concern) {
      const concern = part.concern
      return (
        <span
          key={part.key || index}
          className={`inline-flex items-center px-1 mx-0.5 rounded ${concern.bgColor} ${concern.borderColor} border ${concern.color} font-medium`}
          title={concern.description}
        >
          <span className="mr-1 text-xs">{concern.icon}</span>
          {part.text}
        </span>
      )
    }

    return null
  }

  return (
    <div className={className}>
      {/* Concern Summary */}
      {showLegend && summary.total > 0 && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-sm font-medium text-gray-700 mb-2">Health Indicators Detected:</div>
          <div className="flex flex-wrap gap-3 text-xs">
            {summary.critical > 0 && (
              <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-1 bg-red-50 border border-red-300 text-red-700 rounded">
                  <span className="mr-1">🚨</span>
                  {summary.critical} Critical
                </span>
              </div>
            )}
            {summary.warning > 0 && (
              <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-1 bg-orange-50 border border-orange-300 text-orange-700 rounded">
                  <span className="mr-1">⚠️</span>
                  {summary.warning} Warning
                </span>
              </div>
            )}
            {summary.info > 0 && (
              <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-300 text-blue-700 rounded">
                  <span className="mr-1">ℹ️</span>
                  {summary.info} Informational
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Hover over highlighted terms for more details
          </div>
        </div>
      )}

      {/* Highlighted Text */}
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
        {parts.map((part, index) => renderPart(part, index))}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-xs text-gray-700">
            <div className="font-medium mb-2">Color Legend:</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 bg-red-50 border border-red-300 text-red-700 rounded text-xs">
                  🚨 Critical
                </span>
                <span className="text-gray-600">Requires immediate attention</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 bg-orange-50 border border-orange-300 text-orange-700 rounded text-xs">
                  ⚠️ Warning
                </span>
                <span className="text-gray-600">Chronic conditions or concerns</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 border border-blue-300 text-blue-700 rounded text-xs">
                  ℹ️ Info
                </span>
                <span className="text-gray-600">General medical information</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}