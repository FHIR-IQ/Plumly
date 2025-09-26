import { FHIRBundle } from '@/types/fhir'

export interface FHIRComposition {
  resourceType: 'Composition'
  id?: string
  status: 'preliminary' | 'final' | 'amended' | 'entered-in-error'
  type: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }
  subject?: {
    reference: string
    display?: string
  }
  date: string
  author: Array<{
    reference?: string
    display: string
  }>
  title: string
  confidentiality?: 'N' | 'R' | 'V'
  section: Array<{
    title: string
    code?: {
      coding: Array<{
        system: string
        code: string
        display: string
      }>
    }
    text: {
      status: 'generated' | 'extensions' | 'additional' | 'empty'
      div: string
    }
    entry?: Array<{
      reference: string
      display?: string
    }>
  }>
}

export interface FHIRDocumentReference {
  resourceType: 'DocumentReference'
  id?: string
  status: 'current' | 'superseded' | 'entered-in-error'
  type: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }
  subject?: {
    reference: string
    display?: string
  }
  date: string
  author: Array<{
    reference?: string
    display: string
  }>
  description?: string
  content: Array<{
    attachment: {
      contentType: string
      data?: string
      title?: string
      creation?: string
    }
  }>
}

export interface FHIRList {
  resourceType: 'List'
  id?: string
  status: 'current' | 'retired' | 'entered-in-error'
  mode: 'working' | 'snapshot' | 'changes'
  title: string
  code?: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }
  subject?: {
    reference: string
    display?: string
  }
  date: string
  source?: {
    reference?: string
    display: string
  }
  note?: Array<{
    text: string
  }>
  entry: Array<{
    item: {
      reference: string
      display?: string
    }
    date?: string
  }>
}

export class FHIRCompositionGenerator {
  static generateComposition(
    summary: string,
    originalBundle: FHIRBundle,
    metadata: {
      timestamp: string
      options: any
      resourceCounts: Record<string, number>
    }
  ): FHIRComposition {
    const patientRef = this.extractPatientReference(originalBundle)
    const patientDisplay = this.extractPatientDisplay(originalBundle)

    const sections = this.parseSummaryIntoSections(summary, metadata)

    return {
      resourceType: 'Composition',
      id: `summary-${Date.now()}`,
      status: 'final',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '11503-0',
          display: 'Medical records'
        }]
      },
      subject: patientRef ? {
        reference: patientRef,
        display: patientDisplay
      } : undefined,
      date: metadata.timestamp,
      author: [{
        display: 'Plumly AI Summary Generator'
      }],
      title: `AI Generated Health Summary - ${metadata.options.targetAudience}`,
      confidentiality: 'N',
      section: sections
    }
  }

  static generateDocumentReference(
    summary: string,
    originalBundle: FHIRBundle,
    metadata: {
      timestamp: string
      options: any
      resourceCounts: Record<string, number>
    }
  ): FHIRDocumentReference {
    const patientRef = this.extractPatientReference(originalBundle)
    const patientDisplay = this.extractPatientDisplay(originalBundle)

    return {
      resourceType: 'DocumentReference',
      id: `summary-doc-${Date.now()}`,
      status: 'current',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '11503-0',
          display: 'Medical records'
        }]
      },
      subject: patientRef ? {
        reference: patientRef,
        display: patientDisplay
      } : undefined,
      date: metadata.timestamp,
      author: [{
        display: 'Plumly AI Summary Generator'
      }],
      description: `AI-generated health summary for ${metadata.options.targetAudience} audience`,
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(summary).toString('base64'),
          title: `Health Summary - ${new Date(metadata.timestamp).toLocaleDateString()}`,
          creation: metadata.timestamp
        }
      }]
    }
  }

  static generateConditionsList(
    originalBundle: FHIRBundle,
    summary: string,
    metadata: {
      timestamp: string
      options: any
      resourceCounts: Record<string, number>
    }
  ): FHIRList {
    const patientRef = this.extractPatientReference(originalBundle)
    const patientDisplay = this.extractPatientDisplay(originalBundle)
    const conditions = this.extractConditionsFromBundle(originalBundle)

    return {
      resourceType: 'List',
      id: `conditions-summary-${Date.now()}`,
      status: 'current',
      mode: 'snapshot',
      title: 'Patient Conditions Summary',
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/list-example-use-codes',
          code: 'problems',
          display: 'Problem List'
        }]
      },
      subject: patientRef ? {
        reference: patientRef,
        display: patientDisplay
      } : undefined,
      date: metadata.timestamp,
      source: {
        display: 'Plumly AI Summary Generator'
      },
      note: [{
        text: `AI-generated summary: ${summary.substring(0, 500)}${summary.length > 500 ? '...' : ''}`
      }],
      entry: conditions.map(condition => ({
        item: {
          reference: `Condition/${condition.id}`,
          display: condition.code?.coding?.[0]?.display || 'Unknown condition'
        },
        date: condition.onsetDateTime
      }))
    }
  }

  private static extractPatientReference(bundle: FHIRBundle): string | undefined {
    const patientEntry = bundle.entry?.find(entry => entry.resource?.resourceType === 'Patient')
    return patientEntry?.resource?.id ? `Patient/${patientEntry.resource.id}` : undefined
  }

  private static extractPatientDisplay(bundle: FHIRBundle): string | undefined {
    const patientEntry = bundle.entry?.find(entry => entry.resource?.resourceType === 'Patient')
    const patient = patientEntry?.resource
    if (patient?.name?.[0]) {
      const name = patient.name[0]
      return `${name.given?.join(' ') || ''} ${name.family || ''}`.trim()
    }
    return undefined
  }

  private static extractConditionsFromBundle(bundle: FHIRBundle): any[] {
    return bundle.entry?.filter(entry => entry.resource?.resourceType === 'Condition')
      .map(entry => entry.resource) || []
  }

  private static parseSummaryIntoSections(
    summary: string,
    metadata: any
  ): Array<{
    title: string
    code?: any
    text: {
      status: 'generated'
      div: string
    }
  }> {
    const sections: Array<{
      title: string
      code?: any
      text: {
        status: 'generated'
        div: string
      }
    }> = []

    // Try to parse structured content
    const lines = summary.split('\n')
    let currentSection: { title: string; content: string[] } | null = null
    let generalContent: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Look for section headers (lines that start with ** and end with **)
      const sectionMatch = trimmedLine.match(/^\*\*(.+)\*\*:?$/)
      if (sectionMatch) {
        // Save previous section
        if (currentSection) {
          sections.push({
            title: currentSection.title,
            text: {
              status: 'generated',
              div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.formatContentAsHtml(currentSection.content)}</div>`
            }
          })
        }

        currentSection = {
          title: sectionMatch[1],
          content: []
        }
      } else if (currentSection) {
        if (trimmedLine) {
          currentSection.content.push(trimmedLine)
        }
      } else {
        if (trimmedLine) {
          generalContent.push(trimmedLine)
        }
      }
    }

    // Add the last section
    if (currentSection) {
      sections.push({
        title: currentSection.title,
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.formatContentAsHtml(currentSection.content)}</div>`
        }
      })
    }

    // If no structured sections found, create a single summary section
    if (sections.length === 0) {
      sections.push({
        title: 'Health Summary',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '11503-0',
            display: 'Medical records'
          }]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.formatContentAsHtml([summary])}</div>`
        }
      })
    } else if (generalContent.length > 0) {
      // Add general content as first section
      sections.unshift({
        title: 'Overview',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.formatContentAsHtml(generalContent)}</div>`
        }
      })
    }

    return sections
  }

  private static formatContentAsHtml(content: string[]): string {
    return content
      .map(line => {
        // Handle bullet points
        if (line.match(/^\d+\./)) {
          return `<p>${line}</p>`
        } else if (line.startsWith('- ')) {
          return `<p>• ${line.substring(2)}</p>`
        } else {
          return `<p>${line}</p>`
        }
      })
      .join('')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }
}