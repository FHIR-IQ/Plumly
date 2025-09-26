'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Heart, Pill, TestTube, Clock, TrendingUp, BarChart3 } from 'lucide-react'
import { ResourceSelector } from '@plumly/fhir-utils'
import type { FHIRBundle, ResourceSelectionResult } from '@plumly/fhir-utils'
import { useMemo, useState, useEffect } from 'react'
import { LabTrendChart } from './LabTrendChart'
import { MedicationTimeline } from './MedicationTimeline'

interface ResourceSummaryProps {
  bundle: FHIRBundle | null
  highlightedResourceRef?: string | null
  onChartPointClick?: (resourceRef: string) => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function ResourceSummary({
  bundle,
  highlightedResourceRef,
  onChartPointClick,
  activeTab,
  onTabChange
}: ResourceSummaryProps) {
  const selectionResult = useMemo(() => {
    if (!bundle) return null

    try {
      const selector = new ResourceSelector(bundle)
      return selector.selectRelevantResources()
    } catch (error) {
      console.error('Resource selection failed:', error)
      return null
    }
  }, [bundle])

  // Helper function to check if a resource should be highlighted
  const isResourceHighlighted = (resourceId: string, resourceType: string = 'Observation') => {
    if (!highlightedResourceRef) return false
    return highlightedResourceRef.includes(`${resourceType}/${resourceId}`)
  }

  // Helper function to get highlight styles
  const getHighlightStyles = (isHighlighted: boolean) => {
    return isHighlighted
      ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-200 ring-opacity-50'
      : 'border-gray-200'
  }

  if (!bundle || !selectionResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Clinical Data Summary
          </CardTitle>
          <CardDescription>
            Upload a FHIR Bundle to see intelligent resource selection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const { patient, labValues, medications, conditions, processingStats } = selectionResult

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(2)
    }
    return value
  }

  return (
    <div className="space-y-6">
      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patient Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg">
                  {patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-lg capitalize">{patient.gender || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="text-lg">{formatDate(patient.birthDate)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resource Selection Summary
          </CardTitle>
          <CardDescription>
            Intelligently filtered from {processingStats.totalObservations + processingStats.totalMedications + processingStats.totalConditions} total resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{processingStats.selectedLabValues}</div>
              <div className="text-sm text-gray-500">Lab Values</div>
              <div className="text-xs text-gray-400">from {processingStats.totalObservations}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{processingStats.activeMedications}</div>
              <div className="text-sm text-gray-500">Active Meds</div>
              <div className="text-xs text-gray-400">from {processingStats.totalMedications}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{processingStats.chronicConditions}</div>
              <div className="text-sm text-gray-500">Chronic Conditions</div>
              <div className="text-xs text-gray-400">from {processingStats.totalConditions}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{processingStats.processingTime}</div>
              <div className="text-sm text-gray-500">Processing Time</div>
              <div className="text-xs text-gray-400">milliseconds</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Clinical Resources</CardTitle>
          <CardDescription>
            Most relevant resources based on recency, clinical significance, and relevance scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab || "labs"}
            onValueChange={onTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="labs" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Lab Values ({labValues.length})
              </TabsTrigger>
              <TabsTrigger value="lab-trends" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Lab Trends
              </TabsTrigger>
              <TabsTrigger value="medications" className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medications ({medications.length})
              </TabsTrigger>
              <TabsTrigger value="med-timeline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Med Timeline
              </TabsTrigger>
              <TabsTrigger value="conditions" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Conditions ({conditions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="labs" className="space-y-4">
              {labValues.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No lab values found
                </div>
              ) : (
                <div className="space-y-3">
                  {labValues.map((lab, index) => {
                    const isHighlighted = isResourceHighlighted(lab.source?.id || '', 'Observation')
                    return (
                      <div key={index} className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${getHighlightStyles(isHighlighted)}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lab.display}</p>
                          {lab.isAbnormal && (
                            <Badge variant="destructive">Abnormal</Badge>
                          )}
                          <Badge variant="outline">Score: {lab.relevanceScore}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          LOINC: {lab.loincCode} • {formatDate(lab.date)}
                        </p>
                        {lab.interpretation && (
                          <p className="text-xs text-gray-400">{lab.interpretation}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {formatValue(lab.value)} {lab.unit}
                        </p>
                        {lab.normalizedValue !== lab.value && lab.normalizedUnit && lab.normalizedValue !== undefined && (
                          <p className="text-sm text-gray-500">
                            ({formatValue(lab.normalizedValue)} {lab.normalizedUnit})
                          </p>
                        )}
                        {lab.referenceRange && (
                          <p className="text-xs text-gray-400">
                            Ref: {lab.referenceRange.low ?? 'N/A'}-{lab.referenceRange.high ?? 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="lab-trends" className="space-y-4">
              {labValues.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No lab values available for trend analysis
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Common lab trend charts */}
                  {/* HbA1c Trend */}
                  <LabTrendChart
                    code="4548-4"
                    label="HbA1c"
                    labValues={labValues}
                    onPointClick={onChartPointClick}
                  />

                  {/* Glucose Trend */}
                  <LabTrendChart
                    code="2345-7"
                    label="Glucose"
                    labValues={labValues}
                    onPointClick={onChartPointClick}
                  />

                  {/* Blood Pressure Systolic */}
                  <LabTrendChart
                    code="8480-6"
                    label="Systolic Blood Pressure"
                    labValues={labValues}
                    onPointClick={onChartPointClick}
                  />

                  {/* Cholesterol Total */}
                  <LabTrendChart
                    code="2093-3"
                    label="Total Cholesterol"
                    labValues={labValues}
                    onPointClick={onChartPointClick}
                  />

                  {/* Show trends for any other lab values present */}
                  {Array.from(new Set(labValues.map(lab => lab.loincCode)))
                    .filter(code => !['4548-4', '2345-7', '8480-6', '2093-3'].includes(code))
                    .slice(0, 5) // Limit to 5 additional charts
                    .map(code => {
                      const firstLab = labValues.find(lab => lab.loincCode === code)
                      if (!firstLab) return null

                      return (
                        <LabTrendChart
                          key={code}
                          code={code}
                          label={firstLab.display}
                          labValues={labValues}
                          onPointClick={onChartPointClick}
                        />
                      )
                    })
                    .filter(Boolean)
                  }
                </div>
              )}
            </TabsContent>

            <TabsContent value="medications" className="space-y-4">
              {medications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No medications found
                </div>
              ) : (
                <div className="space-y-3">
                  {medications.map((med, index) => {
                    const isHighlighted = isResourceHighlighted(med.source?.id, 'MedicationRequest')
                    return (
                      <div key={index} className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${getHighlightStyles(isHighlighted)}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{med.name}</p>
                          {med.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                          <Badge variant="outline">Score: {med.relevanceScore}</Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          {med.dosage && <p>Dosage: {med.dosage}</p>}
                          {med.frequency && <p>Frequency: {med.frequency}</p>}
                          {med.route && <p>Route: {med.route}</p>}
                          {med.authoredDate && <p>Prescribed: {formatDate(med.authoredDate)}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={med.status === 'active' ? 'default' : 'secondary'}>
                          {med.status}
                        </Badge>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="med-timeline" className="space-y-4">
              <MedicationTimeline
                medications={medications}
                onMedicationClick={onChartPointClick}
              />
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              {conditions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No conditions found
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition, index) => {
                    const isHighlighted = isResourceHighlighted(condition.source?.id, 'Condition')
                    return (
                      <div key={index} className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${getHighlightStyles(isHighlighted)}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{condition.name}</p>
                          {condition.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                          {condition.isChronic && (
                            <Badge variant="secondary">Chronic</Badge>
                          )}
                          <Badge variant="outline">Score: {condition.relevanceScore}</Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Status: {condition.clinicalStatus}</p>
                          {condition.severity && <p>Severity: {condition.severity}</p>}
                          {condition.onsetDate && <p>Onset: {formatDate(condition.onsetDate)}</p>}
                          {condition.recordedDate && <p>Recorded: {formatDate(condition.recordedDate)}</p>}
                        </div>
                      </div>
                    </div>
                  )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}