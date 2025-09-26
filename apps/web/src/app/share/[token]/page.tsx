'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Share2,
  Download,
  Clock,
  Shield,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react'
import { ResourceSummary } from '@/components/ResourceSummary'
import { ReviewItemsCard } from '@/components/ReviewItemsCard'
import type { FHIRBundle } from '@/types/fhir'

interface SharedData {
  bundleId: string
  summaryData: any
  reviewItems: any[]
  created: string
  expires: string
}

export default function SharedReportPage() {
  const params = useParams()
  const token = params.token as string

  const [sharedData, setSharedData] = useState<SharedData | null>(null)
  const [bundle, setBundle] = useState<FHIRBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const response = await fetch(`/api/share/${token}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          setError(result.error || 'Failed to load shared report')
          return
        }

        setSharedData(result.data)

        // Mock bundle data from summary data (in real implementation, you'd reconstruct the bundle)
        const mockBundle: FHIRBundle = {
          resourceType: 'Bundle',
          type: 'collection',
          entry: []
        }
        setBundle(mockBundle)
      } catch (err) {
        console.error('Failed to fetch shared data:', err)
        setError('Failed to load shared report')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchSharedData()
    } else {
      setError('Invalid share link')
      setLoading(false)
    }
  }, [token])

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const exportToPDF = () => {
    // This will trigger PDF export with watermark
    window.print()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading shared report...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to Load Report</AlertTitle>
          <AlertDescription>
            {error === 'Invalid or expired share token'
              ? 'This share link has expired or is invalid. Share links are valid for 7 days from creation.'
              : error
            }
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!sharedData) {
    return null
  }

  const expiresDate = new Date(sharedData.expires)
  const createdDate = new Date(sharedData.created)
  const isExpiringSoon = expiresDate.getTime() - Date.now() < 24 * 60 * 60 * 1000 // 24 hours

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Watermark */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-5">
        <div className="flex items-center justify-center h-full">
          <div className="transform rotate-45 text-6xl font-bold text-gray-400 select-none">
            DEMO – NOT FOR CLINICAL USE
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <h1 className="text-2xl font-bold">Shared Clinical Report</h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Demo Mode
                </Badge>
              </div>
              <p className="text-gray-600 mb-4">
                AI-generated clinical summary • Generated on {createdDate.toLocaleDateString()}
              </p>

              {/* Expiry Warning */}
              <Alert className={`mb-4 ${isExpiringSoon ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                <Clock className={`h-4 w-4 ${isExpiringSoon ? 'text-amber-600' : 'text-blue-600'}`} />
                <AlertTitle className={isExpiringSoon ? 'text-amber-800' : 'text-blue-800'}>
                  {isExpiringSoon ? 'Link Expiring Soon' : 'Temporary Link'}
                </AlertTitle>
                <AlertDescription className={isExpiringSoon ? 'text-amber-700' : 'text-blue-700'}>
                  This shared report will expire on {expiresDate.toLocaleDateString()} at {expiresDate.toLocaleTimeString()}.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyShareLink}
                className="flex items-center gap-2"
              >
                {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Demo Disclaimer */}
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Demo Mode - Not for Clinical Use</AlertTitle>
            <AlertDescription>
              This is a demonstration report with sanitized data. All patient information has been anonymized.
              This tool is for demonstration purposes only and should not be used for actual clinical decision-making.
            </AlertDescription>
          </Alert>
        </div>

        {/* Review Items */}
        {sharedData.reviewItems && sharedData.reviewItems.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Clinical Review Items</h2>
            <div className="space-y-3">
              {sharedData.reviewItems.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      item.severity === 'high' ? 'bg-red-100 text-red-600' :
                      item.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <Badge variant={
                        item.severity === 'high' ? 'destructive' :
                        item.severity === 'medium' ? 'secondary' :
                        'default'
                      }>
                        {item.severity?.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{item.description}</p>
                    {item.recommendation && (
                      <p className="text-gray-600 text-sm">
                        <strong>Recommendation:</strong> {item.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resource Summary */}
        {sharedData.summaryData && (
          <ResourceSummary
            bundle={bundle}
            highlightedResourceRef={null}
            onChartPointClick={() => {}} // Disabled in shared view
            activeTab="labs"
            onTabChange={() => {}} // Disabled in shared view
          />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 py-8">
          <p>Generated by Plumly AI Clinical Summarization Platform</p>
          <p className="mt-1">This report contains AI-generated content and should be reviewed by qualified healthcare professionals.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            font-size: 48px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.1);
            z-index: -1;
            pointer-events: none;
          }

          @page {
            margin: 1in;
            size: letter;
          }
        }
      `}</style>
    </div>
  )
}