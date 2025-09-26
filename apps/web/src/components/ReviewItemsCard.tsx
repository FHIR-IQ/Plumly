'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Activity,
  Pill,
  TestTube,
  Heart,
  Calendar,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Clock,
  BarChart3
} from 'lucide-react'
import { computeReviewItems, type ReviewItem } from '@/lib/reviewItemsAnalyzer'
import type { ResourceSelectionResult } from '@plumly/fhir-utils'

interface ReviewItemsCardProps {
  selection: ResourceSelectionResult | null
  onNavigate?: (tab: string, options?: { code?: string; medicationId?: string; resourceRef?: string }) => void
  onHighlight?: (resourceRef: string) => void
  className?: string
}

// Icon mapping for different review item types
const getReviewItemIcon = (type: ReviewItem['type']) => {
  switch (type) {
    case 'lab-abnormal':
      return <TestTube className="h-4 w-4" />
    case 'lab-delta':
      return <TrendingUp className="h-4 w-4" />
    case 'med-interaction':
      return <Pill className="h-4 w-4" />
    case 'med-adherence':
      return <Clock className="h-4 w-4" />
    case 'care-gap':
      return <Calendar className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

// Color scheme for severity levels
const getSeverityColors = (severity: ReviewItem['severity']) => {
  switch (severity) {
    case 'high':
      return {
        badge: 'destructive' as const,
        border: 'border-red-200 bg-red-50',
        icon: 'text-red-600'
      }
    case 'medium':
      return {
        badge: 'default' as const,
        border: 'border-yellow-200 bg-yellow-50',
        icon: 'text-yellow-600'
      }
    case 'low':
      return {
        badge: 'secondary' as const,
        border: 'border-blue-200 bg-blue-50',
        icon: 'text-blue-600'
      }
  }
}

// Format the review item type for display
const formatReviewItemType = (type: ReviewItem['type']) => {
  switch (type) {
    case 'lab-abnormal':
      return 'Lab Abnormal'
    case 'lab-delta':
      return 'Lab Trend'
    case 'med-interaction':
      return 'Drug Interaction'
    case 'med-adherence':
      return 'Medication Review'
    case 'care-gap':
      return 'Care Gap'
    default:
      return 'Review Item'
  }
}

export function ReviewItemsCard({
  selection,
  onNavigate,
  onHighlight,
  className = ''
}: ReviewItemsCardProps) {
  // Compute review items from the selection
  const reviewItems = useMemo(() => {
    if (!selection) return []
    return computeReviewItems(selection)
  }, [selection])

  // Group items by severity for summary
  const itemStats = useMemo(() => {
    return reviewItems.reduce((stats, item) => {
      stats[item.severity]++
      if (item.actionRequired) stats.actionRequired++
      return stats
    }, { high: 0, medium: 0, low: 0, actionRequired: 0 })
  }, [reviewItems])

  const handleItemClick = (item: ReviewItem) => {
    // Highlight the resource if available
    if (item.resourceRef && onHighlight) {
      onHighlight(item.resourceRef)
    }

    // Navigate to the appropriate chart or table
    if (item.chartLink && onNavigate) {
      onNavigate(item.chartLink.tab, {
        code: item.chartLink.code,
        medicationId: item.chartLink.medicationId,
        resourceRef: item.resourceRef
      })
    }
  }

  if (!selection) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Clinical Review Items
          </CardTitle>
          <CardDescription>
            Upload FHIR data to see clinical issues requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No data available for review
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Clinical Review Items
          {reviewItems.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {reviewItems.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {reviewItems.length === 0 ? (
            'No clinical issues identified'
          ) : (
            <>
              {itemStats.actionRequired > 0 && (
                <>
                  <Badge variant="destructive" className="mr-2">
                    {itemStats.actionRequired} require action
                  </Badge>
                </>
              )}
              {itemStats.high > 0 && (
                <Badge variant="destructive" className="mr-1">
                  {itemStats.high} high
                </Badge>
              )}
              {itemStats.medium > 0 && (
                <Badge variant="default" className="mr-1">
                  {itemStats.medium} medium
                </Badge>
              )}
              {itemStats.low > 0 && (
                <Badge variant="secondary" className="mr-1">
                  {itemStats.low} low
                </Badge>
              )}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviewItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-8 w-8 text-green-500" />
            </div>
            <p className="font-medium">No Issues Identified</p>
            <p className="text-sm opacity-75">Clinical data appears normal</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reviewItems.map((item) => {
              const severityColors = getSeverityColors(item.severity)
              const itemIcon = getReviewItemIcon(item.type)

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${severityColors.border}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header with icon and title */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex-shrink-0 ${severityColors.icon}`}>
                          {itemIcon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <Badge variant={severityColors.badge} className="text-xs">
                              {item.severity}
                            </Badge>
                            {item.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatReviewItemType(item.type)}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 mb-2">{item.description}</p>

                      {/* Details */}
                      <p className="text-xs text-gray-500">{item.details}</p>

                      {/* Date */}
                      <p className="text-xs text-gray-400 mt-2">
                        Identified: {new Date(item.dateIdentified).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Navigation icon */}
                    <div className="flex-shrink-0 ml-3">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Chart link info */}
                  {item.chartLink && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <BarChart3 className="h-3 w-3" />
                        <span>Click to view in {item.chartLink.tab} tab</span>
                        {item.chartLink.code && (
                          <Badge variant="outline" className="text-xs">
                            {item.chartLink.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary footer */}
        {reviewItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                {reviewItems.length} review item{reviewItems.length !== 1 ? 's' : ''} identified
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-500">High priority</span>
                <div className="w-2 h-2 rounded-full bg-yellow-500 ml-2"></div>
                <span className="text-xs text-gray-500">Medium</span>
                <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>
                <span className="text-xs text-gray-500">Low</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}