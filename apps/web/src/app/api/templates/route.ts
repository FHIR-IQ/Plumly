import { NextRequest, NextResponse } from 'next/server'
import { promptTemplateManager } from '@/lib/prompt-templates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const audience = searchParams.get('audience') as 'patient' | 'provider' | 'payer' | null
    const format = searchParams.get('format') as 'narrative' | 'structured' | 'composition' | null

    let templates = promptTemplateManager.getAllTemplates()

    if (audience) {
      templates = promptTemplateManager.getTemplatesByAudience(audience)
    }

    if (format) {
      templates = templates.filter(template => template.outputFormat === format)
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, targetAudience, outputFormat, template } = body

    if (!name || !description || !targetAudience || !outputFormat || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, targetAudience, outputFormat, template' },
        { status: 400 }
      )
    }

    if (!['patient', 'provider', 'payer'].includes(targetAudience)) {
      return NextResponse.json(
        { error: 'Invalid targetAudience. Must be: patient, provider, or payer' },
        { status: 400 }
      )
    }

    if (!['narrative', 'structured', 'composition'].includes(outputFormat)) {
      return NextResponse.json(
        { error: 'Invalid outputFormat. Must be: narrative, structured, or composition' },
        { status: 400 }
      )
    }

    const newTemplate = promptTemplateManager.addTemplate({
      name,
      description,
      targetAudience,
      outputFormat,
      template
    })

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template created successfully'
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      {
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}