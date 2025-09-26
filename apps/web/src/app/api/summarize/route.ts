import { NextRequest, NextResponse } from 'next/server'
import { ClaudeClient } from '@plumly/summarizer'
import { ResourceSelector } from '@plumly/fhir-utils'
import { validateFHIRBundle } from '@/lib/fhir-validator'
import type { FHIRBundle } from '@/types/fhir'
import type { SummaryRequest, PersonaType, TemplateOptions } from '@plumly/summarizer'

interface RequestBody {
  bundle: FHIRBundle
  options?: {
    targetAudience?: 'patient' | 'provider' | 'payer'
    outputFormat?: 'narrative' | 'structured' | 'composition'
    includeRecommendations?: boolean
    focusAreas?: string[]
    persona?: PersonaType
    templateOptions?: TemplateOptions
    abTestVariant?: string
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: RequestBody = await request.json()
    const { bundle, options = {} } = body

    // Validate FHIR bundle
    const isValid = validateFHIRBundle(bundle)
    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Invalid FHIR Bundle format',
          errorType: 'validation',
          details: 'Bundle validation failed'
        },
        { status: 400 }
      )
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'Claude API key not configured',
          errorType: 'configuration'
        },
        { status: 500 }
      )
    }

    // Initialize Claude client
    const claudeClient = new ClaudeClient(process.env.ANTHROPIC_API_KEY)

    // Process FHIR data for resource selection
    const resourceSelector = new ResourceSelector(bundle)
    const resourceData = resourceSelector.selectRelevantResources()

    // Map legacy options to new structured format
    const persona: PersonaType = options.persona ||
      (options.targetAudience === 'provider' ? 'provider' :
       options.targetAudience === 'payer' ? 'caregiver' : 'patient')

    const templateOptions: TemplateOptions = {
      focusAreas: options.focusAreas,
      ...options.templateOptions
    }

    // Create structured request
    const summaryRequest: SummaryRequest = {
      resourceData,
      persona,
      templateOptions,
      abTestVariant: options.abTestVariant
    }

    // Generate summary using new ClaudeClient
    const result = await claudeClient.summarize(summaryRequest)

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      summary: result.summary,
      sections: result.sections,
      metadata: {
        ...result.metadata,
        totalProcessingTime: processingTime,
        endpoint: '/api/summarize'
      }
    })
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error('Error generating summary:', error)

    // Enhanced error handling using ClaudeClient error analysis
    let userFriendlyError = 'Failed to generate summary'
    let errorType = 'unknown'
    let statusCode = 500
    let retryable = false

    // Use enhanced error information from ClaudeClient if available
    if (error.type) {
      errorType = error.type
      retryable = error.retryable || false

      switch (error.type) {
        case 'capacity':
          userFriendlyError = 'Claude AI is currently experiencing high demand. Please try again in a few minutes.'
          statusCode = 503
          break
        case 'rate_limit':
          userFriendlyError = 'Rate limit exceeded. Please wait a moment before trying again.'
          statusCode = 429
          break
        case 'auth':
          userFriendlyError = 'Claude API authentication failed. Please check API key configuration.'
          statusCode = 401
          break
        case 'invalid_request':
          userFriendlyError = 'Invalid request format. Please check your FHIR bundle and try again.'
          statusCode = 400
          break
        case 'network':
          userFriendlyError = 'Network connection error. Please check your internet connection and try again.'
          statusCode = 503
          retryable = true
          break
        default:
          userFriendlyError = error.message || 'An unexpected error occurred'
      }
    } else {
      // Fallback error parsing
      const errorMessage = error.message || ''
      if (errorMessage.includes('overloaded') || errorMessage.includes('capacity')) {
        userFriendlyError = 'Claude AI is currently experiencing high demand. Please try again in a few minutes.'
        errorType = 'capacity'
        statusCode = 503
        retryable = true
      } else if (errorMessage.includes('rate_limit')) {
        userFriendlyError = 'Rate limit exceeded. Please wait a moment before trying again.'
        errorType = 'rate_limit'
        statusCode = 429
        retryable = true
      }
    }

    return NextResponse.json(
      {
        error: userFriendlyError,
        errorType,
        details: error.message || 'Unknown error',
        retryable,
        processingTime,
        timestamp: new Date().toISOString()
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