import { NextRequest, NextResponse } from 'next/server'
import { promptTemplateManager } from '@/lib/prompt-templates'

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const template = promptTemplateManager.getTemplate(id)

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const body = await request.json()
    const { name, description, targetAudience, outputFormat, template } = body

    if (targetAudience && !['patient', 'provider', 'payer'].includes(targetAudience)) {
      return NextResponse.json(
        { error: 'Invalid targetAudience. Must be: patient, provider, or payer' },
        { status: 400 }
      )
    }

    if (outputFormat && !['narrative', 'structured', 'composition'].includes(outputFormat)) {
      return NextResponse.json(
        { error: 'Invalid outputFormat. Must be: narrative, structured, or composition' },
        { status: 400 }
      )
    }

    const updatedTemplate = promptTemplateManager.updateTemplate(id, {
      name,
      description,
      targetAudience,
      outputFormat,
      template
    })

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      {
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const deleted = promptTemplateManager.deleteTemplate(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}