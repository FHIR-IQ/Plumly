import crypto from 'crypto'

interface ShareTokenData {
  bundleId: string
  summaryData: any
  reviewItems: any[]
  expiry: number
  created: number
}

interface ShareTokenPayload extends ShareTokenData {
  signature: string
}

const SECRET_KEY = process.env.SHARE_TOKEN_SECRET || 'fallback-dev-secret-do-not-use-in-production'
const EXPIRY_DAYS = 7
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000

/**
 * Generate a signed share token with 7-day expiry
 */
export function generateShareToken(data: {
  bundleId: string
  summaryData: any
  reviewItems: any[]
}): string {
  const now = Date.now()
  const tokenData: ShareTokenData = {
    ...data,
    expiry: now + EXPIRY_MS,
    created: now
  }

  // Create signature
  const dataString = JSON.stringify(tokenData)
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataString)
    .digest('hex')

  const payload: ShareTokenPayload = {
    ...tokenData,
    signature
  }

  // Base64 encode the payload
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Verify and decode a share token
 */
export function verifyShareToken(token: string): ShareTokenData | null {
  try {
    // Decode from base64
    const payloadString = Buffer.from(token, 'base64').toString('utf-8')
    const payload: ShareTokenPayload = JSON.parse(payloadString)

    // Extract signature and data
    const { signature, ...tokenData } = payload

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(JSON.stringify(tokenData))
      .digest('hex')

    if (signature !== expectedSignature) {
      console.warn('Share token signature verification failed')
      return null
    }

    // Check expiry
    if (Date.now() > tokenData.expiry) {
      console.warn('Share token has expired')
      return null
    }

    return tokenData
  } catch (error) {
    console.warn('Failed to verify share token:', error)
    return null
  }
}

/**
 * Get token expiry date
 */
export function getTokenExpiry(token: string): Date | null {
  const data = verifyShareToken(token)
  return data ? new Date(data.expiry) : null
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const data = verifyShareToken(token)
  return data ? Date.now() > data.expiry : true
}