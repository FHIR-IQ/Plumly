import { FHIRBundle, FHIRPatient, FHIRObservation, FHIRCondition, FHIRMedicationRequest, FHIRResource } from '@plumly/fhir-utils'
import { TemplateOptions } from '@plumly/summarizer'
import { SummaryResult } from './provenance'

// Helper function to cast resources to proper FHIR types
const asPatient = (resource: any): FHIRPatient => resource as FHIRPatient
const asObservation = (resource: any): FHIRObservation => resource as FHIRObservation
const asCondition = (resource: any): FHIRCondition => resource as FHIRCondition
const asMedicationRequest = (resource: any): FHIRMedicationRequest => resource as FHIRMedicationRequest

export interface EvaluationFixture {
  name: string
  description: string
  bundle: FHIRBundle
  options?: TemplateOptions
  expectedMetrics?: {
    minCoverage?: number
    maxExecutionTime?: number
    requiredSections?: string[]
  }
}

/**
 * Test fixtures for evaluation
 */
export const testFixtures: EvaluationFixture[] = [
  {
    name: 'simple-patient',
    description: 'Basic patient with demographics and one observation',
    bundle: {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-1',
            name: [{ given: ['John'], family: 'Doe' }],
            gender: 'male',
            birthDate: '1980-01-01'
          } as FHIRPatient
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-1',
            status: 'final',
            code: {
              coding: [{ system: 'http://loinc.org', code: '2345-7', display: 'Glucose' }],
              text: 'Blood glucose'
            },
            subject: { reference: 'Patient/patient-1' },
            valueQuantity: { value: 180, unit: 'mg/dL' },
            effectiveDateTime: '2024-01-15',
            referenceRange: [{ low: { value: 70, unit: 'mg/dL' }, high: { value: 100, unit: 'mg/dL' } }]
          } as FHIRObservation
        }
      ]
    },
    options: {
      persona: 'provider',
      includeRecommendations: true,
      focusAreas: ['diabetes']
    },
    expectedMetrics: {
      minCoverage: 80,
      maxExecutionTime: 30000,
      requiredSections: ['Patient Demographics', 'Clinical Summary']
    }
  },

  {
    name: 'diabetes-patient',
    description: 'Patient with diabetes, multiple observations, and medications',
    bundle: {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-2',
            name: [{ given: ['Jane'], family: 'Smith' }],
            gender: 'female',
            birthDate: '1975-06-15'
          }
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'condition-1',
            subject: { reference: 'Patient/patient-2' },
            code: {
              coding: [{ system: 'http://snomed.info/sct', code: '44054006', display: 'Type 2 diabetes mellitus' }]
            },
            clinicalStatus: { coding: [{ code: 'active' }] }
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-2',
            status: 'final',
            code: {
              coding: [{ system: 'http://loinc.org', code: '4548-4', display: 'Hemoglobin A1c' }]
            },
            subject: { reference: 'Patient/patient-2' },
            valueQuantity: { value: 8.2, unit: '%' },
            effectiveDateTime: '2024-01-10',
            referenceRange: [{ high: { value: 7, unit: '%' } }]
          }
        },
        {
          resource: {
            resourceType: 'MedicationRequest',
            id: 'med-1',
            status: 'active',
            subject: { reference: 'Patient/patient-2' },
            medicationCodeableConcept: {
              coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '860975', display: 'Metformin 500mg' }]
            },
            dosageInstruction: [{ text: 'Take 500mg twice daily with meals' }]
          }
        }
      ]
    },
    options: {
      persona: 'patient',
      includeRecommendations: false,
      focusAreas: ['diabetes', 'medication-management']
    },
    expectedMetrics: {
      minCoverage: 90,
      maxExecutionTime: 45000,
      requiredSections: ['Patient Demographics', 'Conditions', 'Medications', 'Laboratory Results']
    }
  },

  {
    name: 'complex-patient',
    description: 'Complex patient with multiple conditions, medications, and observations',
    bundle: {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-3',
            name: [{ given: ['Robert'], family: 'Johnson' }],
            gender: 'male',
            birthDate: '1960-12-03'
          }
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'condition-2',
            subject: { reference: 'Patient/patient-3' },
            code: {
              coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }]
            },
            clinicalStatus: { coding: [{ code: 'active' }] }
          }
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'condition-3',
            subject: { reference: 'Patient/patient-3' },
            code: {
              coding: [{ system: 'http://snomed.info/sct', code: '13644009', display: 'Hypercholesterolemia' }]
            },
            clinicalStatus: { coding: [{ code: 'active' }] }
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-3',
            status: 'final',
            code: {
              coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }]
            },
            subject: { reference: 'Patient/patient-3' },
            valueQuantity: { value: 158, unit: 'mmHg' },
            effectiveDateTime: '2024-01-12'
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-4',
            status: 'final',
            code: {
              coding: [{ system: 'http://loinc.org', code: '2093-3', display: 'Total cholesterol' }]
            },
            subject: { reference: 'Patient/patient-3' },
            valueQuantity: { value: 245, unit: 'mg/dL' },
            effectiveDateTime: '2024-01-05',
            referenceRange: [{ high: { value: 200, unit: 'mg/dL' } }]
          }
        }
      ]
    },
    options: {
      persona: 'provider',
      includeRecommendations: true,
      focusAreas: ['cardiovascular', 'risk-stratification']
    },
    expectedMetrics: {
      minCoverage: 75,
      maxExecutionTime: 60000,
      requiredSections: ['Patient Demographics', 'Conditions', 'Risk Assessment', 'Recommendations']
    }
  },

  {
    name: 'minimal-patient',
    description: 'Minimal patient data to test edge cases',
    bundle: {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-4',
            name: [{ given: ['Test'], family: 'Patient' }],
            gender: 'unknown'
          }
        }
      ]
    },
    options: {
      persona: 'provider',
      includeRecommendations: false
    },
    expectedMetrics: {
      minCoverage: 50, // Lower expectation for minimal data
      maxExecutionTime: 15000
    }
  }
] as any

/**
 * Get fixture by name
 */
export function getFixture(name: string): EvaluationFixture | undefined {
  return testFixtures.find(fixture => fixture.name === name)
}

/**
 * Get all fixture names
 */
export function getFixtureNames(): string[] {
  return testFixtures.map(fixture => fixture.name)
}