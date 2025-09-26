'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertTriangle,
  Cloud,
  CloudOff,
  Database,
  Loader2,
  Lock,
  Shield,
  ShieldAlert,
  Upload,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { fetchPatientEverything, testConnection, clearCache, type FHIRServerError } from '@/lib/fhirServerClient'
import type { FHIRBundle } from '@/types/fhir'

interface FHIRServerConnectorProps {
  onDataLoaded: (bundle: FHIRBundle) => void
  onError?: (error: string) => void
  className?: string
}

export function FHIRServerConnector({
  onDataLoaded,
  onError,
  className = ''
}: FHIRServerConnectorProps) {
  // Form state
  const [serverUrl, setServerUrl] = useState('http://localhost:8080/fhir')
  const [patientId, setPatientId] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  // Results
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null)
  const [serverVersion, setServerVersion] = useState<string | null>(null)
  const [lastError, setLastError] = useState<FHIRServerError | null>(null)
  const [lastFetch, setLastFetch] = useState<{ fromCache: boolean; timestamp: string } | null>(null)

  // Error type icons
  const getErrorIcon = (code: FHIRServerError['code']) => {
    switch (code) {
      case 'TLS_ERROR':
        return <ShieldAlert className="h-4 w-4" />
      case 'AUTH_ERROR':
        return <Lock className="h-4 w-4" />
      case 'NETWORK_ERROR':
        return <WifiOff className="h-4 w-4" />
      case 'MALFORMED_DATA':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <XCircle className="h-4 w-4" />
    }
  }

  // Handle connection test
  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setLastError(null)

    const result = await testConnection(serverUrl)

    if (result.success) {
      setConnectionStatus('connected')
      setServerVersion(result.version || null)
    } else {
      setConnectionStatus('error')
      setLastError(result.error || null)
      setServerVersion(null)
    }

    setIsTestingConnection(false)
  }

  // Handle data fetch
  const handleFetchData = async () => {
    if (!patientId.trim()) {
      setLastError({
        code: 'INVALID_PATIENT',
        message: 'Please enter a patient ID'
      })
      return
    }

    setIsLoading(true)
    setLastError(null)

    const result = await fetchPatientEverything({
      serverUrl,
      patientId: patientId.trim(),
      authToken: authToken.trim() || undefined,
      isDemoMode
    })

    if (result.success && result.data) {
      onDataLoaded(result.data)
      setLastFetch({
        fromCache: result.fromCache || false,
        timestamp: result.timestamp
      })
      setConnectionStatus('connected')
    } else {
      setLastError(result.error || null)
      setConnectionStatus('error')
      onError?.(result.error?.message || 'Failed to fetch data')
    }

    setIsLoading(false)
  }

  // Handle cache clear
  const handleClearCache = () => {
    clearCache()
    setLastFetch(null)
  }

  // Format URL for display
  const formatUrl = (url: string) => {
    try {
      const parsed = new URL(url)
      return `${parsed.protocol}//${parsed.host}`
    } catch {
      return url
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          FHIR Server Connection
        </CardTitle>
        <CardDescription>
          Connect to a FHIR server to fetch patient data using the $everything operation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server URL Input */}
        <div className="space-y-2">
          <Label htmlFor="server-url">FHIR Server URL</Label>
          <div className="flex gap-2">
            <Input
              id="server-url"
              type="url"
              placeholder="http://localhost:8080/fhir"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !serverUrl}
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Test
            </Button>
          </div>

          {/* Connection Status */}
          {connectionStatus && (
            <div className="flex items-center gap-2 text-sm">
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Connected</span>
                  {serverVersion && (
                    <Badge variant="outline" className="text-xs">
                      FHIR {serverVersion}
                    </Badge>
                  )}
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Connection failed</span>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Patient ID Input */}
        <div className="space-y-2">
          <Label htmlFor="patient-id">Patient ID</Label>
          <Input
            id="patient-id"
            type="text"
            placeholder="example-patient-123"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
        </div>

        {/* Authentication (collapsible) */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAuth(!showAuth)}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            {showAuth ? 'Hide' : 'Show'} Authentication
          </Button>

          {showAuth && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="auth-token">Bearer Token (Optional)</Label>
              <Input
                id="auth-token"
                type="password"
                placeholder="Enter bearer token if required"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Demo Mode Checkbox */}
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Checkbox
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={(checked) => setIsDemoMode(checked as boolean)}
          />
          <div className="flex-1">
            <Label
              htmlFor="demo-mode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Demo Mode (Sanitize PHI)
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              When enabled, all personal health information will be anonymized for demo purposes
            </p>
          </div>
          <Shield className="h-4 w-4 text-blue-500" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleFetchData}
            disabled={isLoading || !serverUrl || !patientId}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Fetch Patient Data
              </>
            )}
          </Button>

          {lastFetch && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              title="Clear cached data"
            >
              Clear Cache
            </Button>
          )}
        </div>

        {/* Error Display */}
        {lastError && (
          <Alert variant="destructive">
            <div className="flex items-start gap-2">
              {getErrorIcon(lastError.code)}
              <div className="flex-1">
                <AlertTitle>
                  {lastError.code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </AlertTitle>
                <AlertDescription className="mt-1">
                  {lastError.message}
                  {lastError.statusCode && (
                    <span className="block text-xs mt-1">
                      HTTP Status: {lastError.statusCode}
                    </span>
                  )}
                </AlertDescription>

                {/* Fallback suggestion */}
                {(lastError.code === 'TLS_ERROR' || lastError.code === 'AUTH_ERROR' ||
                  lastError.code === 'NETWORK_ERROR') && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-700 flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      You can still upload a FHIR Bundle file directly using the file upload option
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Success Info */}
        {lastFetch && !lastError && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Data Loaded Successfully</AlertTitle>
            <AlertDescription className="text-green-700">
              <div className="flex items-center gap-4 text-sm mt-1">
                <span>
                  {lastFetch.fromCache ? 'Loaded from cache' : 'Fresh data fetched'}
                </span>
                <span className="text-xs">
                  {new Date(lastFetch.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {isDemoMode && (
                <Badge variant="outline" className="mt-2 text-xs border-blue-300 text-blue-700">
                  <Shield className="h-3 w-3 mr-1" />
                  PHI Sanitized
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Info about $everything operation */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Uses FHIR Patient/$everything operation to fetch all related resources</p>
          <p>• Data is cached for 15 minutes to reduce server load</p>
          <p>• Demo mode replaces all PHI with synthetic data</p>
          <p>• Falls back to file upload if server connection fails</p>
        </div>
      </CardContent>
    </Card>
  )
}