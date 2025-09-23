import Anthropic from '@anthropic-ai/sdk'
import { FHIRBundle } from '@/types/fhir'
import { createPatientSummaryData } from './fhir-validator'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface SummarizationOptions {
  targetAudience: 'patient' | 'provider' | 'payer'
  outputFormat: 'narrative' | 'structured' | 'composition'
  includeRecommendations?: boolean
  focusAreas?: string[]
}

export class ClaudeClient {
  async summarizePatientData(
    bundle: FHIRBundle,
    options: SummarizationOptions = { targetAudience: 'patient', outputFormat: 'narrative' }
  ): Promise<{
    summary: string
    metadata: {
      promptUsed: string
      timestamp: string
      options: SummarizationOptions
      resourceCounts: Record<string, number>
    }
  }> {
    const summaryData = createPatientSummaryData(bundle)
    const prompt = this.buildPrompt(summaryData, options)

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const summary = response.content[0].type === 'text' ? response.content[0].text : ''

      return {
        summary,
        metadata: {
          promptUsed: prompt,
          timestamp: new Date().toISOString(),
          options,
          resourceCounts: {
            Patient: summaryData.patient ? 1 : 0,
            Observation: summaryData.observations.length,
            Condition: summaryData.conditions.length,
            MedicationRequest: summaryData.medications.length,
            Encounter: summaryData.encounters.length,
            Total: summaryData.totalResources
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildPrompt(
    data: ReturnType<typeof createPatientSummaryData>,
    options: SummarizationOptions
  ): string {
    const { patient, observations, conditions, medications, encounters } = data

    let prompt = `You are a healthcare AI assistant tasked with summarizing FHIR patient data. `

    switch (options.targetAudience) {
      case 'patient':
        prompt += `Create a patient-friendly summary that is easy to understand, avoiding medical jargon when possible. `
        break
      case 'provider':
        prompt += `Create a clinical summary for healthcare providers, including relevant medical details and clinical terminology. `
        break
      case 'payer':
        prompt += `Create a summary focused on relevant clinical information for payer/insurance purposes, highlighting key conditions and treatments. `
        break
    }

    switch (options.outputFormat) {
      case 'narrative':
        prompt += `Format the output as a coherent narrative text. `
        break
      case 'structured':
        prompt += `Format the output as structured data with clear sections and bullet points. `
        break
      case 'composition':
        prompt += `Format the output following FHIR Composition structure with sections. `
        break
    }

    if (options.includeRecommendations) {
      prompt += `Include relevant recommendations or next steps based on the data. `
    }

    if (options.focusAreas && options.focusAreas.length > 0) {
      prompt += `Focus particularly on these areas: ${options.focusAreas.join(', ')}. `
    }

    prompt += `\n\nHere is the patient data to summarize:\n\n`

    if (patient) {
      prompt += `**Patient Information:**\n`
      prompt += `- Name: ${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}\n`
      prompt += `- Gender: ${patient.gender}\n`
      prompt += `- Birth Date: ${patient.birthDate}\n\n`
    }

    if (conditions.length > 0) {
      prompt += `**Conditions (${conditions.length}):**\n`
      conditions.forEach((condition, index) => {
        const conditionName = condition.code?.coding?.[0]?.display || 'Unknown condition'
        const onsetDate = condition.onsetDateTime ? new Date(condition.onsetDateTime).toLocaleDateString() : 'Unknown date'
        prompt += `${index + 1}. ${conditionName} (Onset: ${onsetDate})\n`
      })
      prompt += `\n`
    }

    if (medications.length > 0) {
      prompt += `**Medications (${medications.length}):**\n`
      medications.forEach((med, index) => {
        const medName = med.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown medication'
        const authoredDate = med.authoredOn ? new Date(med.authoredOn).toLocaleDateString() : 'Unknown date'
        prompt += `${index + 1}. ${medName} (Prescribed: ${authoredDate}, Status: ${med.status})\n`
      })
      prompt += `\n`
    }

    if (observations.length > 0) {
      prompt += `**Recent Observations (${observations.length}):**\n`
      observations.slice(0, 10).forEach((obs, index) => {
        const obsName = obs.code?.coding?.[0]?.display || 'Unknown observation'
        const value = obs.valueQuantity ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}` : 'No value recorded'
        const effectiveDate = obs.effectiveDateTime ? new Date(obs.effectiveDateTime).toLocaleDateString() : 'Unknown date'
        prompt += `${index + 1}. ${obsName}: ${value} (${effectiveDate})\n`
      })
      if (observations.length > 10) {
        prompt += `... and ${observations.length - 10} more observations\n`
      }
      prompt += `\n`
    }

    if (encounters.length > 0) {
      prompt += `**Healthcare Encounters (${encounters.length}):**\n`
      encounters.slice(0, 5).forEach((encounter, index) => {
        const encounterType = encounter.type?.[0]?.coding?.[0]?.display || 'Unknown type'
        const startDate = encounter.period?.start ? new Date(encounter.period.start).toLocaleDateString() : 'Unknown date'
        prompt += `${index + 1}. ${encounterType} (${startDate}, Status: ${encounter.status})\n`
      })
      if (encounters.length > 5) {
        prompt += `... and ${encounters.length - 5} more encounters\n`
      }
      prompt += `\n`
    }

    prompt += `Please provide a comprehensive summary of this patient's health information based on the above data.`

    return prompt
  }
}

export const claudeClient = new ClaudeClient()