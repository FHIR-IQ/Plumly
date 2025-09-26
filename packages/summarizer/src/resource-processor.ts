// Resource processing and LLM interaction functions
import Anthropic from '@anthropic-ai/sdk';
import type {
  ResourceSelection,
  NormalizedPatient,
  PersonaType,
  StructuredSummaryJSON,
  Claim,
  SectionSummary
} from './types';
import { PromptTemplateManager } from './prompt-templates';

// FHIR Bundle type (simplified)
interface FHIRBundle {
  resourceType: 'Bundle';
  entry?: {
    resource: any;
  }[];
}

/**
 * Selects and normalizes relevant resources from a FHIR bundle
 */
export function selectResources(bundle: FHIRBundle): ResourceSelection {
  const resources = bundle.entry?.map(entry => entry.resource) || [];

  // Find patient resource
  const patientResource = resources.find(r => r.resourceType === 'Patient');
  const patient = normalizePatient(patientResource);

  // Extract lab results (Observations with laboratory category)
  const labs = resources
    .filter(r => r.resourceType === 'Observation' &&
                 r.category?.some((cat: any) =>
                   cat.coding?.some((code: any) => code.code === 'laboratory')))
    .map(normalizeLabObservation);

  // Extract vital signs
  const vitals = resources
    .filter(r => r.resourceType === 'Observation' &&
                 r.category?.some((cat: any) =>
                   cat.coding?.some((code: any) => code.code === 'vital-signs')))
    .map(normalizeVitalObservation);

  // Extract medications
  const meds = resources
    .filter(r => r.resourceType === 'MedicationRequest')
    .map(normalizeMedication);

  // Extract conditions
  const conditions = resources
    .filter(r => r.resourceType === 'Condition')
    .map(normalizeCondition);

  // Extract encounters
  const encounters = resources
    .filter(r => r.resourceType === 'Encounter')
    .map(normalizeEncounter);

  return {
    labs,
    vitals,
    meds,
    conditions,
    encounters,
    patient
  };
}

/**
 * Assembles a persona-specific prompt from resource selection
 */
export function assemblePersonaPrompt(persona: PersonaType, selection: ResourceSelection): string {
  // Build a custom prompt based on persona without using the complex template system
  let prompt = `You are a healthcare AI assistant. Please analyze the following clinical data and provide a summary appropriate for a ${persona}.

`;

  // Add persona-specific instructions
  switch (persona) {
    case 'patient':
      prompt += 'Create a patient-friendly summary using simple, clear language. Avoid medical jargon when possible.\n\n';
      break;
    case 'provider':
      prompt += 'Create a clinical summary for healthcare providers. Use precise medical terminology and focus on clinical decision-making.\n\n';
      break;
    case 'caregiver':
      prompt += 'Create a summary for caregivers with practical, actionable information. Include specific care instructions.\n\n';
      break;
  }

  // Add patient information
  prompt += `**Patient Information:**\n`;
  prompt += `- Name: ${selection.patient.name.full}\n`;
  prompt += `- Gender: ${selection.patient.gender}\n`;
  prompt += `- Birth Date: ${selection.patient.birthDate}\n`;
  if (selection.patient.age) {
    prompt += `- Age: ${selection.patient.age}\n`;
  }
  prompt += '\n';

  // Add conditions
  if (selection.conditions.length > 0) {
    prompt += `**Medical Conditions (${selection.conditions.length}):**\n`;
    selection.conditions.forEach((condition, index) => {
      prompt += `${index + 1}. ${condition.display} (Status: ${condition.clinicalStatus}`;
      if (condition.isChronic) prompt += ', chronic';
      prompt += ')\n';
    });
    prompt += '\n';
  }

  // Add medications
  if (selection.meds.length > 0) {
    prompt += `**Medications (${selection.meds.length}):**\n`;
    selection.meds.forEach((med, index) => {
      prompt += `${index + 1}. ${med.display} (Status: ${med.status}`;
      if (med.dosage) prompt += `, ${med.dosage}`;
      prompt += ')\n';
    });
    prompt += '\n';
  }

  // Add lab results
  if (selection.labs.length > 0) {
    prompt += `**Laboratory Results (${selection.labs.length}):**\n`;
    selection.labs.forEach((lab, index) => {
      prompt += `${index + 1}. ${lab.display}: ${lab.value} ${lab.unit || ''}`;
      if (lab.isAbnormal) prompt += ' (abnormal)';
      if (lab.date) prompt += ` (${lab.date})`;
      prompt += '\n';
    });
    prompt += '\n';
  }

  // Add vital signs
  if (selection.vitals.length > 0) {
    prompt += `**Vital Signs (${selection.vitals.length}):**\n`;
    selection.vitals.forEach((vital, index) => {
      prompt += `${index + 1}. ${vital.display}: ${vital.value} ${vital.unit}`;
      if (vital.date) prompt += ` (${vital.date})`;
      prompt += '\n';
    });
    prompt += '\n';
  }

  // Add encounters
  if (selection.encounters.length > 0) {
    prompt += `**Healthcare Encounters (${selection.encounters.length}):**\n`;
    selection.encounters.slice(0, 5).forEach((encounter, index) => {
      prompt += `${index + 1}. ${encounter.type} (${encounter.startDate}, Status: ${encounter.status})`;
      if (encounter.provider) prompt += ` - Provider: ${encounter.provider}`;
      prompt += '\n';
    });
    if (selection.encounters.length > 5) {
      prompt += `... and ${selection.encounters.length - 5} more encounters\n`;
    }
    prompt += '\n';
  }

  prompt += `Please provide a comprehensive summary of this patient's health information appropriate for a ${persona}.`;

  return prompt;
}

/**
 * Calls the LLM with structured output requirements
 */
export async function callLLM(prompt: string, apiKey?: string): Promise<StructuredSummaryJSON> {
  if (!apiKey) {
    throw new Error('Anthropic API key is required');
  }

  const anthropic = new Anthropic({ apiKey });

  const structuredPrompt = `${prompt}

IMPORTANT: You must respond with valid JSON in exactly this format:
{
  "summary": "A comprehensive narrative summary",
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "content": "Section content with specific claims",
      "claims": [
        {
          "text": "Specific factual claim from the data",
          "refs": ["resource-id-1", "resource-id-2"],
          "confidence": "high"
        }
      ],
      "confidence": 0.95
    }
  ],
  "metadata": {
    "persona": "patient|provider|caregiver",
    "timestamp": "${new Date().toISOString()}",
    "processingTime": 0,
    "model": "claude-3-5-sonnet-20241022",
    "templateUsed": "default"
  }
}

Ensure all claims reference specific resource IDs from the input data. Use confidence levels: "low", "med", "high".`;

  try {
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for consistent structured output
      messages: [{
        role: 'user',
        content: structuredPrompt
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response from Claude');
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as StructuredSummaryJSON;

    // Update processing time
    result.metadata.processingTime = Date.now() - startTime;

    return result;
  } catch (error) {
    throw new Error(`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Attaches provenance information to structured summary sections
 */
export function attachProvenance(structured: StructuredSummaryJSON, selection: ResourceSelection): SectionSummary[] {
  const startTime = Date.now();

  return structured.sections.map(section => {
    // Create resource mapping for provenance
    const allResources = [
      ...selection.labs.map(r => ({ ...r, resourceType: 'Observation' })),
      ...selection.vitals.map(r => ({ ...r, resourceType: 'Observation' })),
      ...selection.meds.map(r => ({ ...r, resourceType: 'MedicationRequest' })),
      ...selection.conditions.map(r => ({ ...r, resourceType: 'Condition' })),
      ...selection.encounters.map(r => ({ ...r, resourceType: 'Encounter' })),
      { ...selection.patient, resourceType: 'Patient' }
    ];

    // Find sources referenced in claims
    const sources = section.claims.flatMap(claim =>
      claim.refs.map(refId => {
        const resource = allResources.find(r => r.id === refId);
        if (!resource) {
          return {
            resourceType: 'Unknown',
            resourceId: refId,
            reference: `${refId}`,
            relevanceScore: 0.5
          };
        }

        return {
          resourceType: resource.resourceType,
          resourceId: resource.id,
          reference: `${resource.resourceType}/${resource.id}`,
          relevanceScore: calculateRelevanceScore(claim.confidence, resource.resourceType)
        };
      })
    ).filter((source, index, self) =>
      // Remove duplicates based on resourceId
      self.findIndex(s => s.resourceId === source.resourceId) === index
    );

    // Enhance claims with metadata
    const enhancedClaims: Claim[] = section.claims.map(claim => ({
      ...claim,
      timestamp: new Date().toISOString(),
      category: categorizeClaimByContent(claim.text)
    }));

    return {
      id: section.id,
      title: section.title,
      content: section.content,
      claims: enhancedClaims,
      sources,
      confidence: section.confidence,
      metadata: {
        generatedAt: new Date().toISOString(),
        persona: structured.metadata.persona,
        template: structured.metadata.templateUsed,
        processingTime: Date.now() - startTime
      }
    };
  });
}

// Helper functions

function normalizePatient(resource: any): NormalizedPatient {
  if (!resource) {
    throw new Error('Patient resource not found in bundle');
  }

  const name = resource.name?.[0] || {};
  const given = name.given || [];
  const family = name.family || '';

  return {
    id: resource.id || 'unknown',
    name: {
      given,
      family,
      full: [...given, family].filter(Boolean).join(' ')
    },
    birthDate: resource.birthDate || '',
    age: resource.birthDate ? calculateAge(resource.birthDate) : undefined,
    gender: resource.gender || 'unknown',
    identifiers: resource.identifier || [],
    contact: resource.telecom || resource.address ? {
      phone: resource.telecom?.find((t: any) => t.system === 'phone')?.value,
      email: resource.telecom?.find((t: any) => t.system === 'email')?.value,
      address: resource.address?.[0] ? {
        line: resource.address[0].line || [],
        city: resource.address[0].city,
        state: resource.address[0].state,
        postalCode: resource.address[0].postalCode,
        country: resource.address[0].country
      } : undefined
    } : undefined
  };
}

function normalizeLabObservation(resource: any) {
  const code = resource.code?.coding?.[0] || {};
  const value = resource.valueQuantity?.value;
  const unit = resource.valueQuantity?.unit;

  return {
    id: resource.id || 'unknown',
    code: code.code || 'unknown',
    display: code.display || resource.code?.text || 'Unknown Lab',
    value: value?.toString(),
    unit: unit,
    status: resource.status || 'unknown',
    date: resource.effectiveDateTime || resource.issued || '',
    isAbnormal: isAbnormalValue(resource),
    reference: resource.referenceRange?.[0]?.text
  };
}

function normalizeVitalObservation(resource: any) {
  const code = resource.code?.coding?.[0] || {};
  const value = resource.valueQuantity?.value;
  const unit = resource.valueQuantity?.unit;

  return {
    id: resource.id || 'unknown',
    code: code.code || 'unknown',
    display: code.display || resource.code?.text || 'Unknown Vital',
    value: value?.toString() || '',
    unit: unit || '',
    date: resource.effectiveDateTime || resource.issued || '',
    category: 'vital-signs' as const
  };
}

function normalizeMedication(resource: any) {
  const medication = resource.medicationCodeableConcept?.coding?.[0] || {};

  return {
    id: resource.id || 'unknown',
    code: medication.code || 'unknown',
    display: medication.display || resource.medicationCodeableConcept?.text || 'Unknown Medication',
    status: resource.status || 'unknown',
    dosage: resource.dosageInstruction?.[0]?.text,
    route: resource.dosageInstruction?.[0]?.route?.text,
    frequency: resource.dosageInstruction?.[0]?.timing?.repeat?.frequency?.toString(),
    startDate: resource.authoredOn,
    endDate: resource.dispenseRequest?.validityPeriod?.end
  };
}

function normalizeCondition(resource: any) {
  const condition = resource.code?.coding?.[0] || {};

  return {
    id: resource.id || 'unknown',
    code: condition.code || 'unknown',
    display: condition.display || resource.code?.text || 'Unknown Condition',
    clinicalStatus: resource.clinicalStatus?.coding?.[0]?.code || 'unknown',
    verificationStatus: resource.verificationStatus?.coding?.[0]?.code || 'unknown',
    severity: resource.severity?.coding?.[0]?.display,
    onsetDate: resource.onsetDateTime || resource.onsetPeriod?.start,
    isChronic: isChronicCondition(condition.code, condition.display)
  };
}

function normalizeEncounter(resource: any) {
  const type = resource.type?.[0]?.coding?.[0] || {};

  return {
    id: resource.id || 'unknown',
    type: type.display || resource.type?.[0]?.text || 'Unknown Encounter',
    status: resource.status || 'unknown',
    startDate: resource.period?.start || '',
    endDate: resource.period?.end,
    provider: resource.participant?.[0]?.individual?.display,
    location: resource.location?.[0]?.location?.display,
    reasonCode: resource.reasonCode?.[0]?.coding?.[0]?.code,
    reasonDisplay: resource.reasonCode?.[0]?.coding?.[0]?.display
  };
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function isAbnormalValue(observation: any): boolean {
  const interpretation = observation.interpretation?.[0]?.coding?.[0]?.code;
  return ['H', 'L', 'A', 'AA', 'HH', 'LL'].includes(interpretation);
}

function isChronicCondition(code?: string, display?: string): boolean {
  const chronicConditions = [
    'diabetes', 'hypertension', 'asthma', 'copd', 'heart failure',
    'chronic kidney', 'arthritis', 'depression', 'anxiety'
  ];

  const text = (display || code || '').toLowerCase();
  return chronicConditions.some(condition => text.includes(condition));
}

function calculateRelevanceScore(confidence: string, resourceType: string): number {
  const confidenceScore = confidence === 'high' ? 0.9 : confidence === 'med' ? 0.7 : 0.5;
  const typeScore = resourceType === 'Condition' ? 0.9 :
                   resourceType === 'Observation' ? 0.8 :
                   resourceType === 'MedicationRequest' ? 0.7 : 0.6;

  return (confidenceScore + typeScore) / 2;
}

function categorizeClaimByContent(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('diagnos') || lower.includes('condition') ||
      lower.includes('diabetes') || lower.includes('hypertension') ||
      lower.includes('has ') || lower.includes('suffer') || lower.includes('disease')) return 'diagnosis';
  if (lower.includes('medicati') || lower.includes('drug') || lower.includes('treatment')) return 'treatment';
  if (lower.includes('lab') || lower.includes('test') || lower.includes('result')) return 'diagnostic';
  if (lower.includes('vital') || lower.includes('blood pressure') || lower.includes('heart rate')) return 'vital-signs';
  if (lower.includes('encounter') || lower.includes('visit') || lower.includes('appointment')) return 'encounter';

  return 'general';
}