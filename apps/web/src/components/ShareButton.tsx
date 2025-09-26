'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Share2,
  Copy,
  CheckCircle,
  Download,
  ExternalLink,
  Clock,
  Shield,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { printToPDF } from '@/lib/pdfExport'

interface ShareButtonProps {
  summaryData: any
  reviewItems: any[]
  bundleId?: string
  className?: string
}

export function ShareButton({
  summaryData,
  reviewItems,
  bundleId = 'demo-bundle',
  className = ''
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [includeClaimsAppendix, setIncludeClaimsAppendix] = useState(false)

  const createShareLink = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bundleId,
          summaryData,
          reviewItems
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create share link')
      }

      setShareUrl(result.shareUrl)
    } catch (err) {
      console.error('Failed to create share link:', err)
      setError(err instanceof Error ? err.message : 'Failed to create share link')
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const exportToPDF = () => {
    try {
      printToPDF(summaryData, reviewItems, {
        includeClaimsAppendix,
        title: 'Clinical Summary Report',
        watermarkText: 'Demo – Not for clinical use'
      })
    } catch (err) {
      console.error('Failed to export PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to export PDF')
    }
  }

  const openSharedLink = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank')
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Share2 className="h-4 w-4" />
        Share & Export
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Clinical Report
            </DialogTitle>
            <DialogDescription>
              Generate a shareable link or export as PDF with demo watermark
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Demo Mode Warning */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Mode:</strong> All shared reports include watermarks and disclaimers
                indicating this is demonstration data only.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Share Link Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Secure Share Link</h4>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  7 days
                </Badge>
              </div>

              {!shareUrl ? (
                <Button
                  onClick={createShareLink}
                  disabled={loading}
                  className="w-full"
                  variant="default"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Link...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Generate Share Link
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <code className="flex-1 text-sm text-gray-700 truncate">
                      {shareUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyShareLink}
                      className="flex-shrink-0"
                    >
                      {copySuccess ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyShareLink}
                      className="flex-1"
                    >
                      {copySuccess ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openSharedLink}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    This link will expire in 7 days and can be accessed without authentication.
                  </p>
                </div>
              )}
            </div>

            {/* PDF Export Section */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <h4 className="font-medium">PDF Export</h4>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="claims-appendix"
                    checked={includeClaimsAppendix}
                    onCheckedChange={(checked) => setIncludeClaimsAppendix(checked as boolean)}
                  />
                  <label
                    htmlFor="claims-appendix"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include claims reference appendix
                  </label>
                </div>

                <p className="text-xs text-gray-500">
                  The appendix provides a detailed mapping of clinical claims to their supporting FHIR resource references.
                </p>

                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <p>• Shared reports include demo watermarks and disclaimers</p>
              <p>• Links are cryptographically signed and expire automatically</p>
              <p>• PDF exports are optimized for printing and archival</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}