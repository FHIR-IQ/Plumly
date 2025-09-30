'use client'

import { useState, useEffect } from 'react'
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
  XCircle,
  RefreshCw,
  Users
} from 'lucide-react'
import { fetchPatientEverything, testConnection, clearCache, type FHIRServerError } from '@/lib/fhirServerClient'
import type { FHIRBundle } from '@/types/fhir'

// Public FHIR test servers
const PUBLIC_FHIR_SERVERS = [
  {
    id: 'firely',
    name: 'Firely Public Server',
    url: 'https://server.fire.ly',
    description: 'Public test server by Firely'
  },
  {
    id: 'smarthealthit',
    name: 'SMART Health IT',
    url: 'https://r4.smarthealthit.org',
    description: 'SMART on FHIR test server'
  },
  {
    id: 'hapi',
    name: 'HAPI FHIR Public',
    url: 'https://hapi.fhir.org/baseR4',
    description: 'Public HAPI FHIR test server'
  },
  {
    id: 'local',
    name: 'Local Development',
    url: 'http://localhost:8080/fhir',
    description: 'Local Docker FHIR server'
  }
]

interface PatientSummary {
  id: string
  name: string
  gender?: string
  birthDate?: string
  identifier?: string
}

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
  const [selectedServer, setSelectedServer] = useState(PUBLIC_FHIR_SERVERS[2]) // Default to HAPI
  const [serverUrl, setServerUrl] = useState(PUBLIC_FHIR_SERVERS[2].url)
  const [patientId, setPatientId] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  // Patient list state
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [showPatientList, setShowPatientList] = useState(false)

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

  // Handle server selection
  const handleServerSelect = (server: typeof PUBLIC_FHIR_SERVERS[0]) => {
    setSelectedServer(server)
    setServerUrl(server.url)
    setConnectionStatus(null)
    setServerVersion(null)
    setPatients([])
    setPatientId('')
    setLastError(null)
  }

  // Load patients from server
  const loadPatients = async () => {
    setIsLoadingPatients(true)
    setLastError(null)

    try {
      const response = await fetch(`/api/fhir/patients?serverUrl=${encodeURIComponent(serverUrl)}&count=10`)
      const data = await response.json()

      if (!response.ok) {
        setLastError({
          code: 'SERVER_ERROR',
          message: data.error || 'Failed to load patients',
          details: data.details
        })
        setPatients([])
      } else {
        setPatients(data.patients || [])
        setShowPatientList(true)
        if (data.patients?.length > 0) {
          setConnectionStatus('connected')
        }
      }
    } catch (error: any) {
      setLastError({
        code: 'NETWORK_ERROR',
        message: 'Failed to load patient list',
        details: error.message
      })
      setPatients([])
    } finally {
      setIsLoadingPatients(false)
    }
  }

  // Handle patient selection
  const handlePatientSelect = (patient: PatientSummary) => {
    setPatientId(patient.id)
    setShowPatientList(false)
  }

  // Handle connection test
  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setLastError(null)

    const result = await testConnection(serverUrl)

    if (result.success) {
      setConnectionStatus('connected')
      setServerVersion(result.version || null)
      // Auto-load patients after successful connection
      setTimeout(() => loadPatients(), 500)
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
          Connect to public FHIR test servers and browse available patients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server Selection */}
        <div className="space-y-2">
          <Label>Select FHIR Server</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PUBLIC_FHIR_SERVERS.map((server) => (
              <button
                key={server.id}
                onClick={() => handleServerSelect(server)}
                className={`p-3 text-left border rounded-lg transition-all ${
                  selectedServer.id === server.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-medium text-sm">{server.name}</div>
                <div className="text-xs text-gray-500 mt-1">{server.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Server URL Display & Test */}
        <div className="space-y-2">
          <Label htmlFor="server-url">Server URL</Label>
          <div className="flex gap-2">
            <Input
              id="server-url"
              type="url"
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value)
                setSelectedServer({ id: 'custom', name: 'Custom', url: e.target.value, description: 'Custom server' })
              }}
              className="flex-1 font-mono text-sm"
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

        {/* Patient Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Patient Selection</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPatients}
              disabled={isLoadingPatients || !serverUrl}
              className="flex items-center gap-2"
            >
              {isLoadingPatients ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Browse Patients
                </>
              )}
            </Button>
          </div>

          {/* Patient List */}
          {showPatientList && patients.length > 0 && (
            <div className="border rounded-lg p-2 max-h-64 overflow-y-auto bg-white">
              <div className="text-xs text-gray-500 mb-2 px-2">
                Select a patient (showing top {patients.length}):
              </div>
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-blue-50 transition-colors ${
                    patientId === patient.id ? 'bg-blue-100 border border-blue-300' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{patient.name}</div>
                      <div className="text-xs text-gray-500 space-x-2">
                        <span>ID: {patient.id}</span>
                        {patient.gender && <span>• {patient.gender}</span>}
                        {patient.birthDate && <span>• Born {patient.birthDate}</span>}
                      </div>
                    </div>
                    {patientId === patient.id && (
                      <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Manual Patient ID Input */}
          <div>
            <Label htmlFor="patient-id" className="text-xs text-gray-600">
              Or enter Patient ID manually:
            </Label>
            <Input
              id="patient-id"
              type="text"
              placeholder="example-patient-123"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="mt-1"
            />
          </div>
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

        {/* Info about public servers */}
        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded border border-gray-200">
          <p className="font-medium text-gray-700 mb-1">ℹ️ About Public Test Servers:</p>
          <p>• These are open FHIR test servers for development and testing</p>
          <p>• Uses Patient/$everything operation to fetch comprehensive data</p>
          <p>• Data is cached for 15 minutes to reduce server load</p>
          <p>• Demo mode sanitizes all personal health information (PHI)</p>
          <p>• Some servers may be slow or have rate limits</p>
        </div>
      </CardContent>
    </Card>
  )
}