'use client'

import { useState, useCallback } from 'react'
import { ProvenanceChip } from './ProvenanceChip'
import type { SectionSummary, Claim } from '@plumly/summarizer'

interface SummaryRendererProps {
  sections?: SectionSummary[]
  bundleData?: any // FHIR bundle for raw data lookup
  onHighlight?: (resourceRef: string) => void
  onUnhighlight?: () => void
  className?: string
}

export function SummaryRenderer({
  sections = [],
  bundleData,
  onHighlight,
  onUnhighlight,
  className = ''
}: SummaryRendererProps) {
  const [highlightedRef, setHighlightedRef] = useState<string | null>(null)

  const handleChipHighlight = useCallback((resourceRef: string) => {
    setHighlightedRef(resourceRef)
    onHighlight?.(resourceRef)
  }, [onHighlight])

  const handleChipUnhighlight = useCallback(() => {
    setHighlightedRef(null)
    onUnhighlight?.()
  }, [onUnhighlight])

  const findResourceData = (resourceRef: string) => {
    if (!bundleData?.entry) return null

    // Extract resource ID from reference like "Observation/123#value[x]"
    const [resourceType, idPart] = resourceRef.split('/')
    const resourceId = idPart?.split('#')[0]

    const resource = bundleData.entry.find((entry: any) =>
      entry.resource?.resourceType === resourceType && entry.resource?.id === resourceId
    )

    return resource?.resource || null
  }

  const renderTextWithClaims = (content: string, claims: Claim[]) => {
    if (!content || !claims || claims.length === 0) {
      return <span className="text-gray-700">{content}</span>
    }

    // Sort claims by text length (longest first) to avoid partial matches
    const sortedClaims = [...claims].sort((a, b) => b.text.length - a.text.length)

    let remainingText = content
    const elements: React.ReactNode[] = []
    let keyIndex = 0

    for (const claim of sortedClaims) {
      const claimTextLower = claim.text.toLowerCase()
      const remainingTextLower = remainingText.toLowerCase()
      const matchIndex = remainingTextLower.indexOf(claimTextLower)

      if (matchIndex >= 0) {
        // Add text before the match
        if (matchIndex > 0) {
          const beforeText = remainingText.substring(0, matchIndex)
          elements.push(<span key={`text-${keyIndex++}`}>{beforeText}</span>)
        }

        // Add the claim as a chip for each referenced resource
        const matchedText = remainingText.substring(matchIndex, matchIndex + claim.text.length)

        if (claim.refs && claim.refs.length > 0) {
          // Create chips for each resource reference
          const chips = claim.refs.map((ref, refIndex) => {
            const rawData = findResourceData(ref)
            const resourceData = {
              resourceType: ref.split('/')[0] || 'Unknown',
              resourceId: ref.split('/')[1]?.split('#')[0] || 'unknown',
              reference: ref,
              relevanceScore: 0.8, // Default value, could be enhanced
              rawData
            }

            return (
              <ProvenanceChip
                key={`chip-${keyIndex}-${refIndex}`}
                resourceRef={ref}
                text={refIndex === 0 ? matchedText : `${matchedText} #${refIndex + 1}`}
                confidence={claim.confidence}
                resourceData={resourceData}
                onHighlight={handleChipHighlight}
                onUnhighlight={handleChipUnhighlight}
                className="mx-0.5"
              />
            )
          })

          elements.push(...chips)
        } else {
          // No references, just add as plain text
          elements.push(<span key={`text-${keyIndex++}`}>{matchedText}</span>)
        }

        // Update remaining text
        remainingText = remainingText.substring(matchIndex + claim.text.length)
        keyIndex++
      }
    }

    // Add any remaining text
    if (remainingText) {
      elements.push(<span key={`text-${keyIndex++}`}>{remainingText}</span>)
    }

    return <span className="text-gray-700">{elements}</span>
  }

  const renderSection = (section: SectionSummary, index: number) => {
    return (
      <div
        key={section.id}
        className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Confidence: {Math.round((section.confidence || 0) * 100)}%</span>
            <span>•</span>
            <span>{section.claims?.length || 0} claims</span>
          </div>
        </div>

        {/* Section Content with Claims */}
        <div className="prose prose-sm max-w-none mb-4">
          {renderTextWithClaims(section.content, section.claims || [])}
        </div>

        {/* Source Information */}
        {section.sources && section.sources.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">Sources:</span>
              <div className="flex flex-wrap gap-1">
                {section.sources.map((source, sourceIndex) => (
                  <span
                    key={sourceIndex}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      highlightedRef === source.reference
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {source.resourceType}/{source.resourceId}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        {section.metadata && (
          <div className="mt-2 text-xs text-gray-400">
            {section.metadata.generatedAt && (
              <>Generated at {new Date(section.metadata.generatedAt).toLocaleString()} • </>
            )}
            {section.metadata.persona && (
              <>Persona: {section.metadata.persona} • </>
            )}
            {section.metadata.template && (
              <>Template: {section.metadata.template}</>
            )}
          </div>
        )}
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No summary sections available</p>
        <p className="text-xs opacity-75">Generate a summary to see content here</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map(renderSection)}
    </div>
  )
}