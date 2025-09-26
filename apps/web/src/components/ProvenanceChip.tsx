'use client'

import { useState } from 'react'
import { X, FileText, Calendar, Hash, AlertCircle } from 'lucide-react'

interface ResourceReference {
  resourceType: string
  resourceId: string
  reference: string
  relevanceScore: number
  rawData?: any
}

interface ProvenanceChipProps {
  resourceRef: string
  text: string
  confidence: 'low' | 'med' | 'high'
  resourceData?: ResourceReference
  onHighlight?: (ref: string) => void
  onUnhighlight?: () => void
  className?: string
}

export function ProvenanceChip({
  resourceRef,
  text,
  confidence,
  resourceData,
  onHighlight,
  onUnhighlight,
  className = ''
}: ProvenanceChipProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const confidenceColors = {
    high: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    med: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
  }

  const confidenceIcons = {
    high: '●',
    med: '◐',
    low: '○'
  }

  const handleChipClick = () => {
    setIsDrawerOpen(true)
  }

  const handleMouseEnter = () => {
    onHighlight?.(resourceRef)
  }

  const handleMouseLeave = () => {
    onUnhighlight?.()
  }

  const formatRawData = (data: any) => {
    if (!data) return 'No raw data available'
    return JSON.stringify(data, null, 2)
  }

  const extractLabeledFields = (data: any) => {
    if (!data || !resourceData) return []

    const fields = []

    // Common FHIR fields based on resource type
    switch (resourceData.resourceType) {
      case 'Observation':
        fields.push(
          { label: 'Code', value: data.code?.coding?.[0]?.display || data.code?.text || 'N/A' },
          { label: 'Value', value: data.valueQuantity ? `${data.valueQuantity.value} ${data.valueQuantity.unit}` : data.valueString || 'N/A' },
          { label: 'Status', value: data.status || 'N/A' },
          { label: 'Date', value: data.effectiveDateTime || data.issued || 'N/A' },
          { label: 'Category', value: data.category?.[0]?.coding?.[0]?.display || 'N/A' }
        )
        break
      case 'Condition':
        fields.push(
          { label: 'Condition', value: data.code?.coding?.[0]?.display || data.code?.text || 'N/A' },
          { label: 'Clinical Status', value: data.clinicalStatus?.coding?.[0]?.code || 'N/A' },
          { label: 'Verification', value: data.verificationStatus?.coding?.[0]?.code || 'N/A' },
          { label: 'Onset', value: data.onsetDateTime || data.onsetPeriod?.start || 'N/A' },
          { label: 'Severity', value: data.severity?.coding?.[0]?.display || 'N/A' }
        )
        break
      case 'MedicationRequest':
        fields.push(
          { label: 'Medication', value: data.medicationCodeableConcept?.coding?.[0]?.display || 'N/A' },
          { label: 'Status', value: data.status || 'N/A' },
          { label: 'Intent', value: data.intent || 'N/A' },
          { label: 'Authored On', value: data.authoredOn || 'N/A' },
          { label: 'Dosage', value: data.dosageInstruction?.[0]?.text || 'N/A' }
        )
        break
      case 'Patient':
        fields.push(
          { label: 'Name', value: data.name?.[0] ? `${data.name[0].given?.join(' ') || ''} ${data.name[0].family || ''}`.trim() : 'N/A' },
          { label: 'Gender', value: data.gender || 'N/A' },
          { label: 'Birth Date', value: data.birthDate || 'N/A' },
          { label: 'Active', value: data.active ? 'Yes' : 'No' }
        )
        break
      default:
        fields.push(
          { label: 'Resource Type', value: data.resourceType || 'N/A' },
          { label: 'ID', value: data.id || 'N/A' },
          { label: 'Status', value: data.status || 'N/A' }
        )
    }

    return fields.filter(field => field.value && field.value !== 'N/A')
  }

  return (
    <>
      <button
        onClick={handleChipClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-md
          transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1
          ${confidenceColors[confidence]} ${className}
        `}
        title={`${resourceData?.resourceType || 'Resource'}: ${text} (${confidence} confidence)`}
      >
        <span className="opacity-60">{confidenceIcons[confidence]}</span>
        <span className="max-w-[120px] truncate">{text}</span>
      </button>

      {/* Right Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-25 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Provenance Details</h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                  {/* Claim Information */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Claim</h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{text}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span>{confidenceIcons[confidence]}</span>
                          Confidence: {confidence}
                        </span>
                        {resourceData?.relevanceScore && (
                          <span>
                            Relevance: {Math.round(resourceData.relevanceScore * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resource Reference */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Source Reference</h3>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-4 w-4 text-blue-600" />
                        <span className="font-mono text-sm text-blue-800">{resourceRef}</span>
                      </div>
                      {resourceData && (
                        <div className="text-xs text-blue-600 space-y-1">
                          <div>Type: {resourceData.resourceType}</div>
                          <div>ID: {resourceData.resourceId}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Labeled Fields */}
                  {resourceData?.rawData && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Key Fields</h3>
                      <div className="space-y-2">
                        {extractLabeledFields(resourceData.rawData).map((field, index) => (
                          <div key={index} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                            <span className="text-xs font-medium text-gray-600 w-1/3">{field.label}</span>
                            <span className="text-xs text-gray-900 w-2/3 text-right break-words">{field.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw JSON */}
                  {resourceData?.rawData && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Raw JSON Data</h3>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                          {formatRawData(resourceData.rawData)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* No Data Message */}
                  {!resourceData?.rawData && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Raw resource data not available</p>
                      <p className="text-xs opacity-75">Only reference information is shown</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}