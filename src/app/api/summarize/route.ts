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
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
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