import { selectResources, attachProvenance } from '../src/resource-processor';
import type { ResourceSelection, StructuredSummaryJSON } from '../src/types';

describe('selectResources', () => {
  it('should extract and normalize all resource types from a FHIR bundle', () => {
    const mockBundle = {
      resourceType: 'Bundle' as const,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-1',
            name: [{ given: ['John'], family: 'Doe' }],
            gender: 'male',
            birthDate: '1980-01-01',
            identifier: [{ system: 'http://hospital.com/patients', value: '12345' }]
          }
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'condition-1',
            code: {
              coding: [{ code: 'E11', display: 'Type 2 diabetes mellitus' }]
            },
            clinicalStatus: { coding: [{ code: 'active' }] },
            verificationStatus: { coding: [{ code: 'confirmed' }] }
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-1',
            category: [{ coding: [{ code: 'laboratory' }] }],
            code: {
              coding: [{ code: '33747-0', display: 'Glucose [Mass/volume] in Blood' }]
            },
            valueQuantity: { value: 150, unit: 'mg/dL' },
            status: 'final',
            effectiveDateTime: '2024-01-15',
            interpretation: [{ coding: [{ code: 'H' }] }]
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'vital-1',
            category: [{ coding: [{ code: 'vital-signs' }] }],
            code: {
              coding: [{ code: '8480-6', display: 'Systolic blood pressure' }]
            },
            valueQuantity: { value: 140, unit: 'mmHg' },
            status: 'final',
            effectiveDateTime: '2024-01-15'
          }
        },
        {
          resource: {
            resourceType: 'MedicationRequest',
            id: 'med-1',
            medicationCodeableConcept: {
              coding: [{ code: '860975', display: 'Metformin' }]
            },
            status: 'active',
            authoredOn: '2024-01-10',
            dosageInstruction: [{
              text: '1000 mg twice daily',
              route: { text: 'oral' },
              timing: { repeat: { frequency: 2 } }
            }]
          }
        },
        {
          resource: {
            resourceType: 'Encounter',
            id: 'enc-1',
            type: [{ coding: [{ display: 'Outpatient visit' }] }],
            status: 'finished',
            period: { start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' },
            participant: [{ individual: { display: 'Dr. Smith' } }]
          }
        }
      ]
    };

    const result = selectResources(mockBundle);

    // Test patient normalization
    expect(result.patient).toEqual({
      id: 'patient-1',
      name: {
        given: ['John'],
        family: 'Doe',
        full: 'John Doe'
      },
      birthDate: '1980-01-01',
      age: expect.any(Number),
      gender: 'male',
      identifiers: [{ system: 'http://hospital.com/patients', value: '12345' }],
      contact: undefined
    });

    // Test lab extraction
    expect(result.labs).toHaveLength(1);
    expect(result.labs[0]).toEqual({
      id: 'obs-1',
      code: '33747-0',
      display: 'Glucose [Mass/volume] in Blood',
      value: '150',
      unit: 'mg/dL',
      status: 'final',
      date: '2024-01-15',
      isAbnormal: true,
      reference: undefined
    });

    // Test vitals extraction
    expect(result.vitals).toHaveLength(1);
    expect(result.vitals[0]).toEqual({
      id: 'vital-1',
      code: '8480-6',
      display: 'Systolic blood pressure',
      value: '140',
      unit: 'mmHg',
      date: '2024-01-15',
      category: 'vital-signs'
    });

    // Test medication extraction
    expect(result.meds).toHaveLength(1);
    expect(result.meds[0]).toEqual({
      id: 'med-1',
      code: '860975',
      display: 'Metformin',
      status: 'active',
      dosage: '1000 mg twice daily',
      route: 'oral',
      frequency: '2',
      startDate: '2024-01-10',
      endDate: undefined
    });

    // Test condition extraction
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toEqual({
      id: 'condition-1',
      code: 'E11',
      display: 'Type 2 diabetes mellitus',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      severity: undefined,
      onsetDate: undefined,
      isChronic: true
    });

    // Test encounter extraction
    expect(result.encounters).toHaveLength(1);
    expect(result.encounters[0]).toEqual({
      id: 'enc-1',
      type: 'Outpatient visit',
      status: 'finished',
      startDate: '2024-01-15T10:00:00Z',
      endDate: '2024-01-15T11:00:00Z',
      provider: 'Dr. Smith',
      location: undefined,
      reasonCode: undefined,
      reasonDisplay: undefined
    });
  });

  it('should handle empty bundle gracefully', () => {
    const emptyBundle = {
      resourceType: 'Bundle' as const,
      entry: []
    };

    expect(() => selectResources(emptyBundle)).toThrow('Patient resource not found in bundle');
  });

  it('should handle bundle with only patient resource', () => {
    const bundleWithPatientOnly = {
      resourceType: 'Bundle' as const,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-1',
            name: [{ given: ['Jane'], family: 'Smith' }],
            gender: 'female',
            birthDate: '1990-05-15'
          }
        }
      ]
    };

    const result = selectResources(bundleWithPatientOnly);

    expect(result.patient.name.full).toBe('Jane Smith');
    expect(result.labs).toHaveLength(0);
    expect(result.vitals).toHaveLength(0);
    expect(result.meds).toHaveLength(0);
    expect(result.conditions).toHaveLength(0);
    expect(result.encounters).toHaveLength(0);
  });

  it('should correctly identify chronic conditions', () => {
    const bundleWithChronicCondition = {
      resourceType: 'Bundle' as const,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'patient-1',
            name: [{ given: ['Test'], family: 'Patient' }],
            gender: 'male',
            birthDate: '1970-01-01'
          }
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'condition-chronic',
            code: {
              coding: [{ code: 'I10', display: 'Essential hypertension' }]
            },
            clinicalStatus: { coding: [{ code: 'active' }] }
          }
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'condition-acute',
            code: {
              coding: [{ code: 'J06.9', display: 'Acute upper respiratory infection' }]
            },
            clinicalStatus: { coding: [{ code: 'active' }] }
          }
        }
      ]
    };

    const result = selectResources(bundleWithChronicCondition);

    expect(result.conditions).toHaveLength(2);
    expect(result.conditions[0].isChronic).toBe(true); // hypertension
    expect(result.conditions[1].isChronic).toBe(false); // acute infection
  });
});

describe('attachProvenance', () => {
  const mockResourceSelection: ResourceSelection = {
    patient: {
      id: 'patient-1',
      name: { given: ['John'], family: 'Doe', full: 'John Doe' },
      birthDate: '1980-01-01',
      gender: 'male',
      identifiers: []
    },
    labs: [
      {
        id: 'lab-1',
        code: '33747-0',
        display: 'Glucose',
        value: '150',
        unit: 'mg/dL',
        status: 'final',
        date: '2024-01-15',
        isAbnormal: true
      }
    ],
    vitals: [
      {
        id: 'vital-1',
        code: '8480-6',
        display: 'Blood pressure',
        value: '140',
        unit: 'mmHg',
        date: '2024-01-15',
        category: 'vital-signs'
      }
    ],
    meds: [
      {
        id: 'med-1',
        code: '860975',
        display: 'Metformin',
        status: 'active'
      }
    ],
    conditions: [
      {
        id: 'cond-1',
        code: 'E11',
        display: 'Diabetes',
        clinicalStatus: 'active',
        verificationStatus: 'confirmed',
        isChronic: true
      }
    ],
    encounters: []
  };

  const mockStructuredSummary: StructuredSummaryJSON = {
    summary: 'Patient has diabetes with elevated glucose levels.',
    sections: [
      {
        id: 'conditions',
        title: 'Medical Conditions',
        content: 'Patient has Type 2 diabetes mellitus.',
        claims: [
          {
            text: 'Patient has diabetes',
            refs: ['cond-1'],
            confidence: 'high'
          }
        ],
        confidence: 0.95
      },
      {
        id: 'lab-results',
        title: 'Laboratory Results',
        content: 'Glucose level is elevated at 150 mg/dL.',
        claims: [
          {
            text: 'Glucose level is 150 mg/dL',
            refs: ['lab-1'],
            confidence: 'high'
          },
          {
            text: 'Glucose level is abnormal',
            refs: ['lab-1'],
            confidence: 'med'
          }
        ],
        confidence: 0.9
      }
    ],
    metadata: {
      persona: 'patient',
      timestamp: '2024-01-15T12:00:00Z',
      processingTime: 1000,
      model: 'claude-3-5-sonnet-20241022',
      templateUsed: 'patient-template'
    }
  };

  it('should attach correct provenance information to sections', () => {
    const result = attachProvenance(mockStructuredSummary, mockResourceSelection);

    expect(result).toHaveLength(2);

    // Test first section (conditions)
    expect(result[0]).toMatchObject({
      id: 'conditions',
      title: 'Medical Conditions',
      content: 'Patient has Type 2 diabetes mellitus.',
      confidence: 0.95
    });

    expect(result[0].claims).toHaveLength(1);
    expect(result[0].claims[0]).toMatchObject({
      text: 'Patient has diabetes',
      refs: ['cond-1'],
      confidence: 'high',
      category: 'diagnosis',
      timestamp: expect.any(String)
    });

    expect(result[0].sources).toHaveLength(1);
    expect(result[0].sources[0]).toMatchObject({
      resourceType: 'Condition',
      resourceId: 'cond-1',
      reference: 'Condition/cond-1',
      relevanceScore: expect.any(Number)
    });

    // Test second section (lab results)
    expect(result[1]).toMatchObject({
      id: 'lab-results',
      title: 'Laboratory Results',
      content: 'Glucose level is elevated at 150 mg/dL.',
      confidence: 0.9
    });

    expect(result[1].claims).toHaveLength(2);
    expect(result[1].sources).toHaveLength(1); // Should deduplicate same resource
    expect(result[1].sources[0]).toMatchObject({
      resourceType: 'Observation',
      resourceId: 'lab-1',
      reference: 'Observation/lab-1'
    });
  });

  it('should handle unknown resource references gracefully', () => {
    const summaryWithUnknownRefs: StructuredSummaryJSON = {
      ...mockStructuredSummary,
      sections: [
        {
          id: 'test-section',
          title: 'Test Section',
          content: 'Test content',
          claims: [
            {
              text: 'Unknown claim',
              refs: ['unknown-resource-id'],
              confidence: 'low'
            }
          ],
          confidence: 0.5
        }
      ]
    };

    const result = attachProvenance(summaryWithUnknownRefs, mockResourceSelection);

    expect(result[0].sources).toHaveLength(1);
    expect(result[0].sources[0]).toMatchObject({
      resourceType: 'Unknown',
      resourceId: 'unknown-resource-id',
      reference: 'unknown-resource-id',
      relevanceScore: 0.5
    });
  });

  it('should calculate different relevance scores based on confidence and resource type', () => {
    const summaryWithDifferentConfidences: StructuredSummaryJSON = {
      ...mockStructuredSummary,
      sections: [
        {
          id: 'mixed-section',
          title: 'Mixed Section',
          content: 'Mixed content',
          claims: [
            {
              text: 'High confidence condition claim',
              refs: ['cond-1'],
              confidence: 'high'
            },
            {
              text: 'Low confidence lab claim',
              refs: ['lab-1'],
              confidence: 'low'
            }
          ],
          confidence: 0.7
        }
      ]
    };

    const result = attachProvenance(summaryWithDifferentConfidences, mockResourceSelection);

    expect(result[0].sources).toHaveLength(2);

    // Find condition and lab sources
    const conditionSource = result[0].sources.find(s => s.resourceType === 'Condition');
    const labSource = result[0].sources.find(s => s.resourceType === 'Observation');

    expect(conditionSource?.relevanceScore).toBeGreaterThan(labSource?.relevanceScore || 0);
  });

  it('should categorize claims correctly', () => {
    const summaryWithVariousClaims: StructuredSummaryJSON = {
      ...mockStructuredSummary,
      sections: [
        {
          id: 'categorization-test',
          title: 'Categorization Test',
          content: 'Test content',
          claims: [
            {
              text: 'Patient has a diagnosis of diabetes',
              refs: ['cond-1'],
              confidence: 'high'
            },
            {
              text: 'Lab test results show elevated glucose',
              refs: ['lab-1'],
              confidence: 'high'
            },
            {
              text: 'Medication prescribed for treatment',
              refs: ['med-1'],
              confidence: 'high'
            },
            {
              text: 'Patient had a visit last week',
              refs: ['enc-1'],
              confidence: 'med'
            }
          ],
          confidence: 0.8
        }
      ]
    };

    const result = attachProvenance(summaryWithVariousClaims, mockResourceSelection);

    expect(result[0].claims[0].category).toBe('diagnosis');
    expect(result[0].claims[1].category).toBe('diagnostic');
    expect(result[0].claims[2].category).toBe('treatment');
    expect(result[0].claims[3].category).toBe('encounter');
  });

  it('should include correct metadata', () => {
    const result = attachProvenance(mockStructuredSummary, mockResourceSelection);

    result.forEach(section => {
      expect(section.metadata).toMatchObject({
        generatedAt: expect.any(String),
        persona: 'patient',
        template: 'patient-template',
        processingTime: expect.any(Number)
      });

      // Check that timestamp is a valid ISO string
      expect(new Date(section.metadata.generatedAt).toISOString()).toBe(section.metadata.generatedAt);
    });
  });
});