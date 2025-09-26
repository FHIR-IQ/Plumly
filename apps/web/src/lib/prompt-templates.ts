import { PromptTemplate } from '@/types/fhir'

export const defaultPromptTemplates: PromptTemplate[] = [
  {
    id: 'patient-narrative',
    name: 'Patient-Friendly Summary',
    description: 'A simple, easy-to-understand summary for patients',
    targetAudience: 'patient',
    outputFormat: 'narrative',
    template: `Create a patient-friendly health summary that is easy to understand. Use simple language and avoid medical jargon.

Focus on:
- Current health status
- Important medical conditions in plain terms
- Current medications and their purposes
- Recent test results and what they mean
- Any recommendations for the patient

Make it encouraging and informative, helping the patient understand their health journey.`
  },
  {
    id: 'provider-clinical',
    name: 'Clinical Summary for Providers',
    description: 'Detailed clinical summary for healthcare providers',
    targetAudience: 'provider',
    outputFormat: 'structured',
    template: `Generate a comprehensive clinical summary for healthcare providers.

Include:
- **Chief Complaints & Current Status**: Primary health concerns
- **Active Conditions**: ICD-10 codes, onset dates, severity
- **Current Medications**: Dosages, frequencies, indications
- **Recent Diagnostics**: Lab values, imaging results, vital signs
- **Care Plan**: Treatment goals, monitoring requirements
- **Clinical Recommendations**: Next steps, referrals, follow-ups
- **Risk Factors**: Potential complications, contraindications

Use appropriate medical terminology and clinical formatting.`
  },
  {
    id: 'payer-utilization',
    name: 'Payer Utilization Summary',
    description: 'Summary focused on utilization and cost-effectiveness for payers',
    targetAudience: 'payer',
    outputFormat: 'structured',
    template: `Create a utilization-focused summary for payer review.

Analyze:
- **High-Cost Conditions**: Chronic diseases, complex conditions
- **Medication Utilization**: Brand vs generic, therapeutic alternatives
- **Healthcare Utilization**: Frequency of encounters, emergency visits
- **Preventive Care**: Screenings, vaccinations, wellness visits
- **Quality Metrics**: Care gaps, adherence, outcomes
- **Risk Stratification**: Future care needs, cost projections
- **Care Coordination**: Specialist referrals, duplicate services

Focus on value-based care metrics and cost-effectiveness.`
  },
  {
    id: 'discharge-summary',
    name: 'Hospital Discharge Summary',
    description: 'Comprehensive discharge summary for care transitions',
    targetAudience: 'provider',
    outputFormat: 'composition',
    template: `Generate a structured discharge summary following standard format.

Sections:
- **Admission Information**: Date, presenting complaint, admitting diagnosis
- **Hospital Course**: Treatment provided, procedures, complications
- **Discharge Diagnosis**: Primary and secondary diagnoses
- **Medications**: Discharge medications, changes from admission
- **Discharge Instructions**: Activity level, diet, wound care
- **Follow-up**: Appointments, monitoring, red flags
- **Patient Education**: Understanding of condition and care plan

Ensure continuity of care with clear, actionable information.`
  },
  {
    id: 'preventive-care',
    name: 'Preventive Care Gaps Analysis',
    description: 'Analysis of preventive care opportunities and gaps',
    targetAudience: 'provider',
    outputFormat: 'structured',
    template: `Analyze preventive care opportunities and identify gaps.

Review:
- **Age-Appropriate Screenings**: Cancer screenings, cardiovascular risk
- **Immunization Status**: Recommended vaccines, boosters needed
- **Health Maintenance**: Annual exams, specialist consultations
- **Risk Factor Management**: Smoking, obesity, hypertension, diabetes
- **Care Gaps**: Missing or overdue preventive services
- **Patient Barriers**: Access, cost, adherence challenges
- **Recommendations**: Priority interventions, scheduling needs

Focus on evidence-based preventive care guidelines.`
  },
  {
    id: 'medication-reconciliation',
    name: 'Medication Reconciliation Summary',
    description: 'Focused summary for medication review and reconciliation',
    targetAudience: 'provider',
    outputFormat: 'structured',
    template: `Provide a comprehensive medication reconciliation summary.

Include:
- **Current Medications**: Active prescriptions with details
- **Recent Changes**: New, discontinued, or modified medications
- **Drug Interactions**: Potential interactions and contraindications
- **Adherence Assessment**: Compliance patterns, barriers
- **Therapeutic Duplications**: Redundant or conflicting medications
- **Cost Considerations**: Generic alternatives, formulary status
- **Monitoring Requirements**: Lab work, side effects to watch
- **Patient Education**: Medication understanding, administration

Ensure medication safety and optimize therapeutic outcomes.`
  }
]

export class PromptTemplateManager {
  private templates: PromptTemplate[] = [...defaultPromptTemplates]

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.find(template => template.id === id)
  }

  getAllTemplates(): PromptTemplate[] {
    return [...this.templates]
  }

  getTemplatesByAudience(audience: 'patient' | 'provider' | 'payer'): PromptTemplate[] {
    return this.templates.filter(template => template.targetAudience === audience)
  }

  getTemplatesByFormat(format: 'narrative' | 'structured' | 'composition'): PromptTemplate[] {
    return this.templates.filter(template => template.outputFormat === format)
  }

  addTemplate(template: Omit<PromptTemplate, 'id'>): PromptTemplate {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    this.templates.push(newTemplate)
    return newTemplate
  }

  updateTemplate(id: string, updates: Partial<Omit<PromptTemplate, 'id'>>): PromptTemplate | null {
    const index = this.templates.findIndex(template => template.id === id)
    if (index === -1) return null

    this.templates[index] = { ...this.templates[index], ...updates }
    return this.templates[index]
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(template => template.id === id)
    if (index === -1) return false

    this.templates.splice(index, 1)
    return true
  }

  buildCustomPrompt(templateId: string, customizations?: {
    focusAreas?: string[]
    additionalInstructions?: string
    excludeAreas?: string[]
  }): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    let prompt = template.template

    if (customizations?.focusAreas && customizations.focusAreas.length > 0) {
      prompt += `\n\nPay special attention to: ${customizations.focusAreas.join(', ')}`
    }

    if (customizations?.excludeAreas && customizations.excludeAreas.length > 0) {
      prompt += `\n\nDo not focus on or minimize discussion of: ${customizations.excludeAreas.join(', ')}`
    }

    if (customizations?.additionalInstructions) {
      prompt += `\n\nAdditional instructions: ${customizations.additionalInstructions}`
    }

    return prompt
  }
}

export const promptTemplateManager = new PromptTemplateManager()