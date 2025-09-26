// Deterministic resource selection algorithms
import type { FHIRBundle } from './types';
import type {
  FHIRPatient,
  FHIRObservation,
  FHIRCondition,
  FHIRMedicationRequest,
  FHIREncounter,
  ProcessedLabValue,
  ProcessedMedication,
  ProcessedCondition,
  ResourceSelectionResult
} from './clinical-types';

// Common LOINC codes for important lab values
const PRIORITY_LOINC_CODES: Record<string, { display: string; priority: number }> = {
  '4548-4': { display: 'Hemoglobin A1c', priority: 10 },
  '33747-0': { display: 'Hemoglobin A1c', priority: 10 },
  '18262-6': { display: 'Low density lipoprotein cholesterol', priority: 9 },
  '13457-7': { display: 'Cholesterol in LDL', priority: 9 },
  '2093-3': { display: 'Total cholesterol', priority: 8 },
  '2085-9': { display: 'High density lipoprotein cholesterol', priority: 8 },
  '8480-6': { display: 'Systolic blood pressure', priority: 9 },
  '8462-4': { display: 'Diastolic blood pressure', priority: 9 },
  '33743-4': { display: 'Estimated glomerular filtration rate', priority: 8 },
  '2160-0': { display: 'Creatinine', priority: 7 },
  '6690-2': { display: 'Leukocytes', priority: 6 },
  '718-7': { display: 'Hemoglobin', priority: 7 },
  '4544-3': { display: 'Hematocrit', priority: 6 },
  '777-3': { display: 'Platelets', priority: 6 },
  '2947-0': { display: 'Sodium', priority: 5 },
  '2823-3': { display: 'Potassium', priority: 5 },
  '1975-2': { display: 'Bilirubin', priority: 4 },
  '1742-6': { display: 'ALT', priority: 4 },
  '1920-8': { display: 'AST', priority: 4 },
};

// Chronic condition SNOMED codes
const CHRONIC_CONDITION_CODES = new Set([
  '44054006', // Type 2 diabetes
  '46635009', // Type 1 diabetes
  '38341003', // Hypertension
  '13644009', // Hypercholesterolemia
  '49601007', // Cardiovascular disease
  '413838009', // Chronic kidney disease
  '195967001', // Asthma
  '13645005', // COPD
  '40412008', // Rheumatoid arthritis
  '56265001', // Heart disease
]);

export class ResourceSelector {
  private bundle: FHIRBundle;
  private patient: FHIRPatient | null = null;

  constructor(bundle: FHIRBundle) {
    this.bundle = bundle;
    this.extractPatient();
  }

  private extractPatient(): void {
    if (!this.bundle.entry) return;

    for (const entry of this.bundle.entry) {
      if (entry.resource?.resourceType === 'Patient') {
        this.patient = entry.resource as FHIRPatient;
        break;
      }
    }
  }

  private parseDate(dateString?: string): Date | null {
    if (!dateString) return null;

    try {
      // Handle various FHIR date formats
      if (dateString.includes('T')) {
        return new Date(dateString);
      } else {
        // Date-only format
        return new Date(dateString + 'T00:00:00.000Z');
      }
    } catch {
      return null;
    }
  }

  private isDateRecent(dateString?: string, maxDaysAgo: number = 365): boolean {
    const date = this.parseDate(dateString);
    if (!date) return false;

    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays <= maxDaysAgo;
  }

  private getMostRecentByLoinc(observations: FHIRObservation[]): Map<string, FHIRObservation> {
    const loincMap = new Map<string, FHIRObservation>();

    for (const obs of observations) {
      const loincCoding = obs.code?.coding?.find(coding =>
        coding.system?.includes('loinc.org')
      );

      if (!loincCoding?.code) continue;

      const existingObs = loincMap.get(loincCoding.code);
      if (!existingObs) {
        loincMap.set(loincCoding.code, obs);
        continue;
      }

      // Compare dates to keep most recent
      const obsDate = this.parseDate(obs.effectiveDateTime);
      const existingDate = this.parseDate(existingObs.effectiveDateTime);

      if (obsDate && existingDate && obsDate > existingDate) {
        loincMap.set(loincCoding.code, obs);
      } else if (obsDate && !existingDate) {
        loincMap.set(loincCoding.code, obs);
      }
    }

    return loincMap;
  }

  private normalizeUnit(value: number, fromUnit: string): { value: number; unit: string } {
    // Basic unit conversions for common lab values
    const conversions: Record<string, { factor: number; targetUnit: string }> = {
      // HbA1c conversions
      'mmol/mol': { factor: 0.09148, targetUnit: '%' },
      // Cholesterol conversions
      'mmol/L': { factor: 38.67, targetUnit: 'mg/dL' },
      // Glucose conversions
      'mmol/L_glucose': { factor: 18.018, targetUnit: 'mg/dL' },
      // Creatinine conversions
      'umol/L': { factor: 0.0113, targetUnit: 'mg/dL' },
    };

    const conversion = conversions[fromUnit];
    if (conversion) {
      return {
        value: Math.round((value * conversion.factor) * 100) / 100,
        unit: conversion.targetUnit
      };
    }

    return { value, unit: fromUnit };
  }

  public selectLabValues(): ProcessedLabValue[] {
    if (!this.bundle.entry) return [];

    const observations = this.bundle.entry
      .filter(entry => entry.resource?.resourceType === 'Observation')
      .map(entry => entry.resource as FHIRObservation)
      .filter(obs => obs.status === 'final' || obs.status === 'amended');

    const loincMap = this.getMostRecentByLoinc(observations);
    const processedLabs: ProcessedLabValue[] = [];

    for (const [loincCode, observation] of loincMap) {
      const priorityInfo = PRIORITY_LOINC_CODES[loincCode];
      const loincCoding = observation.code?.coding?.find(coding =>
        coding.system?.includes('loinc.org')
      );

      if (!loincCoding || !observation.valueQuantity?.value) continue;

      const rawValue = observation.valueQuantity.value;
      const rawUnit = observation.valueQuantity.unit || observation.valueQuantity.code || '';
      const normalized = this.normalizeUnit(rawValue, rawUnit);

      // Determine if value is abnormal based on reference range
      let isAbnormal = false;
      const refRange = observation.referenceRange?.[0];
      if (refRange && typeof normalized.value === 'number') {
        const low = refRange.low?.value;
        const high = refRange.high?.value;
        if (low !== undefined && normalized.value < low) isAbnormal = true;
        if (high !== undefined && normalized.value > high) isAbnormal = true;
      }

      // Calculate relevance score
      let relevanceScore = priorityInfo?.priority || 3;
      if (isAbnormal) relevanceScore += 2;
      if (this.isDateRecent(observation.effectiveDateTime, 90)) relevanceScore += 1;

      const processedLab: ProcessedLabValue = {
        loincCode,
        display: priorityInfo?.display || loincCoding.display || 'Unknown Lab',
        value: normalized.value,
        unit: rawUnit,
        normalizedUnit: normalized.unit,
        normalizedValue: normalized.value,
        referenceRange: refRange ? {
          low: refRange.low?.value,
          high: refRange.high?.value,
          text: refRange.text
        } : undefined,
        interpretation: observation.interpretation?.[0]?.coding?.[0]?.display,
        date: observation.effectiveDateTime || '',
        isAbnormal,
        relevanceScore,
        source: observation
      };

      processedLabs.push(processedLab);
    }

    // Sort by relevance score (highest first)
    return processedLabs.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public selectActiveMedications(): ProcessedMedication[] {
    if (!this.bundle.entry) return [];

    const medications = this.bundle.entry
      .filter(entry => entry.resource?.resourceType === 'MedicationRequest')
      .map(entry => entry.resource as FHIRMedicationRequest)
      .filter(med => med.status === 'active' || med.status === 'completed');

    const processedMeds: ProcessedMedication[] = [];

    for (const med of medications) {
      const isActive = med.status === 'active' ||
        (med.status === 'completed' && this.isDateRecent(med.authoredOn, 90));

      if (!isActive && med.status !== 'active') continue;

      const medicationName = med.medicationCodeableConcept?.text ||
        med.medicationCodeableConcept?.coding?.[0]?.display ||
        med.medicationReference?.display ||
        'Unknown Medication';

      const dosageText = med.dosageInstruction?.[0]?.text;
      const route = med.dosageInstruction?.[0]?.route?.coding?.[0]?.display;
      const frequency = med.dosageInstruction?.[0]?.timing?.repeat?.frequency;
      const period = med.dosageInstruction?.[0]?.timing?.repeat?.period;
      const periodUnit = med.dosageInstruction?.[0]?.timing?.repeat?.periodUnit;

      let frequencyText = '';
      if (frequency && period && periodUnit) {
        frequencyText = `${frequency} times per ${period} ${periodUnit}`;
      }

      // Calculate relevance score
      let relevanceScore = 5;
      if (med.status === 'active') relevanceScore += 3;
      if (this.isDateRecent(med.authoredOn, 30)) relevanceScore += 2;
      if (med.category?.[0]?.coding?.[0]?.code === 'inpatient') relevanceScore += 1;

      const processedMed: ProcessedMedication = {
        name: medicationName,
        status: med.status,
        isActive: med.status === 'active',
        category: med.category?.[0]?.coding?.[0]?.display,
        dosage: dosageText,
        frequency: frequencyText,
        route,
        authoredDate: med.authoredOn,
        validityPeriod: med.dispenseRequest?.validityPeriod,
        relevanceScore,
        source: med
      };

      processedMeds.push(processedMed);
    }

    return processedMeds.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public selectConditions(): ProcessedCondition[] {
    if (!this.bundle.entry) return [];

    const conditions = this.bundle.entry
      .filter(entry => entry.resource?.resourceType === 'Condition')
      .map(entry => entry.resource as FHIRCondition)
      .filter(cond => cond.clinicalStatus?.coding?.[0]?.code !== 'inactive');

    const processedConditions: ProcessedCondition[] = [];

    for (const condition of conditions) {
      const clinicalStatus = condition.clinicalStatus?.coding?.[0]?.code || 'unknown';
      const verificationStatus = condition.verificationStatus?.coding?.[0]?.code;

      // Skip unconfirmed conditions unless recently recorded
      if (verificationStatus === 'unconfirmed' &&
          !this.isDateRecent(condition.recordedDate, 30)) {
        continue;
      }

      const conditionName = condition.code?.text ||
        condition.code?.coding?.[0]?.display ||
        'Unknown Condition';

      // Check if condition is chronic
      const snomedCode = condition.code?.coding?.find(coding =>
        coding.system?.includes('snomed.info')
      )?.code;
      const isChronic = snomedCode ? CHRONIC_CONDITION_CODES.has(snomedCode) : false;

      const isActive = clinicalStatus === 'active' || clinicalStatus === 'recurrence';

      // Calculate relevance score
      let relevanceScore = 4;
      if (isActive) relevanceScore += 3;
      if (isChronic) relevanceScore += 2;
      if (condition.severity?.coding?.[0]?.code === 'severe') relevanceScore += 2;
      if (this.isDateRecent(condition.recordedDate, 90)) relevanceScore += 1;

      const processedCondition: ProcessedCondition = {
        name: conditionName,
        clinicalStatus,
        verificationStatus,
        category: condition.category?.[0]?.coding?.[0]?.display,
        severity: condition.severity?.coding?.[0]?.display,
        onsetDate: condition.onsetDateTime || condition.onsetPeriod?.start,
        recordedDate: condition.recordedDate,
        isChronic,
        isActive,
        relevanceScore,
        source: condition
      };

      processedConditions.push(processedCondition);
    }

    return processedConditions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private selectEncounters(): FHIREncounter[] {
    if (!this.bundle.entry) return [];

    return this.bundle.entry
      .filter(entry => entry.resource?.resourceType === 'Encounter')
      .map(entry => entry.resource as FHIREncounter)
      .filter(enc => enc.status === 'finished' || enc.status === 'in-progress')
      .sort((a, b) => {
        const aDate = this.parseDate(a.period?.start);
        const bDate = this.parseDate(b.period?.start);
        if (!aDate || !bDate) return 0;
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 10); // Keep most recent 10 encounters
  }

  public selectRelevantResources(): ResourceSelectionResult {
    const startTime = Date.now();

    if (!this.patient) {
      throw new Error('No patient resource found in bundle');
    }

    const labValues = this.selectLabValues();
    const medications = this.selectActiveMedications();
    const conditions = this.selectConditions();
    const encounters = this.selectEncounters();

    const processingTime = Date.now() - startTime;

    // Calculate statistics
    const totalObservations = this.bundle.entry?.filter(
      entry => entry.resource?.resourceType === 'Observation'
    ).length || 0;

    const totalMedications = this.bundle.entry?.filter(
      entry => entry.resource?.resourceType === 'MedicationRequest'
    ).length || 0;

    const totalConditions = this.bundle.entry?.filter(
      entry => entry.resource?.resourceType === 'Condition'
    ).length || 0;

    return {
      labValues,
      medications,
      conditions,
      encounters,
      patient: this.patient,
      processingStats: {
        totalObservations,
        selectedLabValues: labValues.length,
        totalMedications,
        activeMedications: medications.filter(med => med.isActive).length,
        totalConditions,
        chronicConditions: conditions.filter(cond => cond.isChronic).length,
        processingTime
      }
    };
  }
}