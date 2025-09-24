import { NextRequest, NextResponse } from 'next/server'
import { claudeClient, SummarizationOptions } from '@/lib/claude-client'
import { validateFHIRBundle } from '@/lib/fhir-validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bundle, options } = body

    if (!validateFHIRBundle(bundle)) {
      return NextResponse.json(
        { error: 'Invalid FHIR Bundle format' },
        { status: 400 }
      )
    }

    const summarizationOptions: SummarizationOptions = {
      targetAudience: options?.targetAudience || 'patient',
      outputFormat: options?.outputFormat || 'narrative',
      includeRecommendations: options?.includeRecommendations || false,
      focusAreas: options?.focusAreas || []
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      )
    }

    const result = await claudeClient.summarizePatientData(bundle, summarizationOptions)

    return NextResponse.json({
      success: true,
      summary: result.summary,
      metadata: result.metadata
    })
  } catch (error) {
    console.error('Error generating summary:', error)

    // Parse Claude API specific errors for better user experience
    let userFriendlyError = 'Failed to generate summary'
    let errorType = 'unknown'
    let statusCode = 500

    if (error instanceof Error && error.message.includes('overloaded_error')) {
      userFriendlyError = 'Claude AI is currently experiencing high demand. Please try again in a few minutes.'
      errorType = 'capacity'
      statusCode = 503 // Service Temporarily Unavailable
    } else if (error instanceof Error && error.message.includes('rate_limit')) {
      userFriendlyError = 'Rate limit exceeded. Please wait a moment before trying again.'
      errorType = 'rate_limit'
      statusCode = 429 // Too Many Requests
    } else if (error instanceof Error && error.message.includes('authentication_error')) {
      userFriendlyError = 'Claude API authentication failed. Please contact support.'
      errorType = 'auth'
      statusCode = 401 // Unauthorized
    } else if (error instanceof Error && error.message.includes('invalid_request_error')) {
      userFriendlyError = 'Invalid request format. Please check your FHIR bundle and try again.'
      errorType = 'invalid_request'
      statusCode = 400 // Bad Request
    }

    return NextResponse.json(
      {
        error: userFriendlyError,
        errorType,
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: errorType === 'capacity' || errorType === 'rate_limit'
      },
      { status: statusCode }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FHIR Summarization API',
    endpoints: {
      POST: 'Generate AI summary from FHIR Bundle'
    },
    options: {
      targetAudience: ['patient', 'provider', 'payer'],
      outputFormat: ['narrative', 'structured', 'composition'],
      includeRecommendations: 'boolean',
      focusAreas: 'array of strings'
    }
  })
}