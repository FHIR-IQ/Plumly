import { NextRequest, NextResponse } from 'next/server'
import { FHIRCompositionGenerator } from '@/lib/fhir-composition'
import { validateFHIRBundle } from '@/lib/fhir-validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bundle, summary, metadata, outputType = 'composition' } = body

    if (!summary || !metadata) {
      return NextResponse.json(
        { error: 'Summary and metadata are required' },
        { status: 400 }
      )
    }

    if (bundle && !validateFHIRBundle(bundle)) {
      return NextResponse.json(
        { error: 'Invalid FHIR Bundle format' },
        { status: 400 }
      )
    }

    let result: any

    switch (outputType) {
      case 'composition':
        result = FHIRCompositionGenerator.generateComposition(summary, bundle, metadata)
        break
      case 'document-reference':
        result = FHIRCompositionGenerator.generateDocumentReference(summary, bundle, metadata)
        break
      case 'list':
        result = FHIRCompositionGenerator.generateConditionsList(bundle, summary, metadata)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid output type. Must be: composition, document-reference, or list' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      resource: result,
      resourceType: result.resourceType
    })
  } catch (error) {
    console.error('Error generating FHIR resource:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate FHIR resource',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FHIR Composition Generation API',
    endpoints: {
      POST: 'Generate FHIR Composition, DocumentReference, or List from summary'
    },
    outputTypes: {
      composition: 'FHIR Composition resource with structured sections',
      'document-reference': 'FHIR DocumentReference with summary as attachment',
      list: 'FHIR List resource for conditions or other items'
    }
  })
}