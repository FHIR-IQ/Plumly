import { NextRequest, NextResponse } from 'next/server'
import { fhirClient } from '@/lib/fhir-client'
import { validateFHIRBundle } from '@/lib/fhir-validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!validateFHIRBundle(body)) {
      return NextResponse.json(
        { error: 'Invalid FHIR Bundle format' },
        { status: 400 }
      )
    }

    // For MVP deployment, we'll validate and accept the bundle without storing it
    // since we're using a public FHIR server that may have limitations
    try {
      const result = await fhirClient.uploadBundle(body)
      return NextResponse.json({
        success: true,
        bundleId: result.id || 'local-bundle',
        message: 'Bundle uploaded successfully',
        data: result
      })
    } catch (uploadError) {
      // If upload fails (e.g., to public server), still accept for summarization
      console.warn('FHIR upload failed, proceeding with local validation:', uploadError)
      return NextResponse.json({
        success: true,
        bundleId: 'local-bundle-' + Date.now(),
        message: 'Bundle validated successfully (local processing)',
        data: {
          resourceCount: body.entry?.length || 0,
          timestamp: new Date().toISOString()
        }
      })
    }
  } catch (error) {
    console.error('Error processing FHIR bundle:', error)
    return NextResponse.json(
      {
        error: 'Failed to process FHIR bundle',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FHIR Upload API',
    endpoints: {
      POST: 'Upload a FHIR Bundle'
    }
  })
}