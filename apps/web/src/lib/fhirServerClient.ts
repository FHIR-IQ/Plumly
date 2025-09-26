import { FHIRBundle } from '@/types/fhir'

export interface FHIRServerConfig {
  serverUrl: string
  patientId: string
  authToken?: string
  isDemoMode?: boolean
}

export interface FHIRServerResponse {
  success: boolean
  data?: FHIRBundle
  error?: FHIRServerError
  fromCache?: boolean
  timestamp: string
}

export interface FHIRServerError {
  code: 'TLS_ERROR' | 'AUTH_ERROR' | 'MALFORMED_DATA' | 'NETWORK_ERROR' | 'INVALID_PATIENT' | 'SERVER_ERROR'
  message: string
  details?: any
  statusCode?: number
}

// In-memory cache with TTL (15 minutes)
const CACHE_TTL = 15 * 60 * 1000
const cache = new Map<string, { data: FHIRBundle; timestamp: number }>()

// PHI sanitization for demo mode
const DEMO_MODE_WARNING = 'DEMO_MODE_DATA_SANITIZED'
const PHI_FIELDS = ['name', 'telecom', 'address', 'birthDate', 'identifier', 'contact', 'photo']

/**
 * Sanitize PHI from FHIR resources in demo mode
 */
function sanitizePHI(bundle: FHIRBundle, isDemoMode: boolean): FHIRBundle {
  if (!isDemoMode) return bundle

  const sanitized = JSON.parse(JSON.stringify(bundle))

  // Add demo mode marker
  if (!sanitized.meta) sanitized.meta = {}
  sanitized.meta.tag = sanitized.meta.tag || []
  sanitized.meta.tag.push({
    system: 'http://plumly.health/demo',
    code: DEMO_MODE_WARNING,
    display: 'Demo mode - PHI has been sanitized'
  })

  // Sanitize entries
  if (sanitized.entry) {
    sanitized.entry.forEach((entry: any) => {
      if (entry.resource) {
        sanitizeResource(entry.resource)
      }
    })
  }

  return sanitized
}

function sanitizeResource(resource: any): void {
  if (!resource) return

  // Sanitize Patient resources
  if (resource.resourceType === 'Patient') {
    if (resource.name) {
      resource.name = resource.name.map((n: any) => ({
        ...n,
        given: ['DEMO'],
        family: 'PATIENT',
        text: 'DEMO PATIENT'
      }))
    }
    if (resource.birthDate) {
      // Keep year but anonymize month/day
      const year = resource.birthDate.substring(0, 4)
      resource.birthDate = `${year}-01-01`
    }
    if (resource.address) {
      resource.address = resource.address.map((a: any) => ({
        ...a,
        line: ['123 Demo Street'],
        city: 'Demo City',
        state: 'DC',
        postalCode: '12345',
        text: '123 Demo Street, Demo City, DC 12345'
      }))
    }
    if (resource.telecom) {
      resource.telecom = resource.telecom.map((t: any) => ({
        ...t,
        value: t.system === 'email' ? 'demo@example.com' : '555-0100'
      }))
    }
    if (resource.identifier) {
      resource.identifier = resource.identifier.map((id: any, index: number) => ({
        ...id,
        value: `DEMO-${index + 1}`
      }))
    }
  }

  // Sanitize Practitioner resources
  if (resource.resourceType === 'Practitioner') {
    if (resource.name) {
      resource.name = resource.name.map(() => ({
        given: ['Demo'],
        family: 'Provider',
        text: 'Demo Provider'
      }))
    }
  }

  // Recursively sanitize contained resources
  if (resource.contained) {
    resource.contained.forEach((contained: any) => {
      sanitizeResource(contained)
    })
  }
}

/**
 * Validate FHIR Bundle structure
 */
function validateBundle(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Response is not a valid object' }
  }

  if (data.resourceType !== 'Bundle') {
    return { valid: false, error: 'Response is not a FHIR Bundle' }
  }

  if (!Array.isArray(data.entry) && data.total !== 0) {
    return { valid: false, error: 'Bundle missing entry array' }
  }

  // Check for basic FHIR structure
  if (data.entry) {
    for (const entry of data.entry) {
      if (!entry.resource || !entry.resource.resourceType) {
        return { valid: false, error: 'Bundle contains invalid entries' }
      }
    }
  }

  return { valid: true }
}

/**
 * Get cache key for request
 */
function getCacheKey(config: FHIRServerConfig): string {
  return `${config.serverUrl}|${config.patientId}`
}

/**
 * Check cache for valid entry
 */
function checkCache(key: string): FHIRBundle | null {
  const cached = cache.get(key)
  if (!cached) return null

  const age = Date.now() - cached.timestamp
  if (age > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return cached.data
}

/**
 * Store in cache
 */
function storeInCache(key: string, data: FHIRBundle): void {
  // Limit cache size to prevent memory issues
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }

  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * Clear cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Fetch patient data using $everything operation
 */
export async function fetchPatientEverything(
  config: FHIRServerConfig
): Promise<FHIRServerResponse> {
  const cacheKey = getCacheKey(config)

  // Check cache first
  const cached = checkCache(cacheKey)
  if (cached) {
    return {
      success: true,
      data: sanitizePHI(cached, config.isDemoMode || false),
      fromCache: true,
      timestamp: new Date().toISOString()
    }
  }

  try {
    // Validate server URL
    let serverUrl: URL
    try {
      serverUrl = new URL(config.serverUrl)
    } catch {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Invalid server URL format'
        },
        timestamp: new Date().toISOString()
      }
    }

    // Construct $everything URL
    const everythingUrl = `${config.serverUrl}/Patient/${config.patientId}/$everything`

    // Prepare headers
    const headers: HeadersInit = {
      'Accept': 'application/fhir+json',
      'Content-Type': 'application/fhir+json'
    }

    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`
    }

    // Make request with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response: Response
    try {
      response = await fetch(everythingUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      })
    } catch (error: any) {
      clearTimeout(timeout)

      // Check for TLS/SSL errors
      if (error.message?.includes('SSL') || error.message?.includes('TLS') ||
          error.message?.includes('certificate') || error.message?.includes('CERT')) {
        return {
          success: false,
          error: {
            code: 'TLS_ERROR',
            message: 'TLS/SSL certificate error. Server may be using self-signed certificate.',
            details: error.message
          },
          timestamp: new Date().toISOString()
        }
      }

      // Network errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Request timeout - server took too long to respond'
          },
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to FHIR server',
          details: error.message
        },
        timestamp: new Date().toISOString()
      }
    } finally {
      clearTimeout(timeout)
    }

    // Check response status
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed. Please check your credentials.',
          statusCode: response.status
        },
        timestamp: new Date().toISOString()
      }
    }

    if (response.status === 404) {
      return {
        success: false,
        error: {
          code: 'INVALID_PATIENT',
          message: `Patient with ID '${config.patientId}' not found`,
          statusCode: 404
        },
        timestamp: new Date().toISOString()
      }
    }

    if (!response.ok) {
      let errorMessage = `Server returned ${response.status}: ${response.statusText}`
      try {
        const errorBody = await response.json()
        if (errorBody.issue?.[0]?.diagnostics) {
          errorMessage = errorBody.issue[0].diagnostics
        }
      } catch {
        // Ignore JSON parse errors for error body
      }

      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: errorMessage,
          statusCode: response.status
        },
        timestamp: new Date().toISOString()
      }
    }

    // Parse response
    let data: any
    try {
      const text = await response.text()
      if (!text) {
        return {
          success: false,
          error: {
            code: 'MALFORMED_DATA',
            message: 'Server returned empty response'
          },
          timestamp: new Date().toISOString()
        }
      }
      data = JSON.parse(text)
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MALFORMED_DATA',
          message: 'Server returned invalid JSON',
          details: error
        },
        timestamp: new Date().toISOString()
      }
    }

    // Validate Bundle structure
    const validation = validateBundle(data)
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'MALFORMED_DATA',
          message: validation.error || 'Invalid FHIR Bundle structure'
        },
        timestamp: new Date().toISOString()
      }
    }

    // Store in cache before sanitization
    storeInCache(cacheKey, data)

    // Sanitize and return
    return {
      success: true,
      data: sanitizePHI(data, config.isDemoMode || false),
      fromCache: false,
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Unexpected error occurred',
        details: error.message
      },
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Test connection to FHIR server
 */
export async function testConnection(serverUrl: string): Promise<{
  success: boolean
  version?: string
  error?: FHIRServerError
}> {
  try {
    const metadataUrl = `${serverUrl}/metadata`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(metadataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json'
      },
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: `Server returned ${response.status}`,
          statusCode: response.status
        }
      }
    }

    const data = await response.json()

    if (data.resourceType !== 'CapabilityStatement') {
      return {
        success: false,
        error: {
          code: 'MALFORMED_DATA',
          message: 'Server did not return a valid CapabilityStatement'
        }
      }
    }

    return {
      success: true,
      version: data.fhirVersion || 'Unknown'
    }

  } catch (error: any) {
    if (error.message?.includes('SSL') || error.message?.includes('TLS')) {
      return {
        success: false,
        error: {
          code: 'TLS_ERROR',
          message: 'TLS/SSL certificate error'
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server'
      }
    }
  }
}