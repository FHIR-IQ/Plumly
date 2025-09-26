import { FHIRBundle, FHIRResource } from '@/types/fhir'

export function validateFHIRBundle(data: any): data is FHIRBundle {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  if (data.resourceType !== 'Bundle') {
    return false
  }

  if (!['document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection'].includes(data.type)) {
    return false
  }

  if (data.entry && !Array.isArray(data.entry)) {
    return false
  }

  return true
}

export function validateFHIRResource(data: any): data is FHIRResource {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  if (typeof data.resourceType !== 'string') {
    return false
  }

  return true
}

export function extractPatientFromBundle(bundle: FHIRBundle): FHIRResource | null {
  if (!bundle.entry) return null

  for (const entry of bundle.entry) {
    if (entry.resource?.resourceType === 'Patient') {
      return entry.resource
    }
  }

  return null
}

export function extractResourcesByType(bundle: FHIRBundle, resourceType: string): FHIRResource[] {
  if (!bundle.entry) return []

  return bundle.entry
    .filter(entry => entry.resource?.resourceType === resourceType)
    .map(entry => entry.resource!)
}

export function createPatientSummaryData(bundle: FHIRBundle) {
  const patient = extractPatientFromBundle(bundle)
  const observations = extractResourcesByType(bundle, 'Observation')
  const conditions = extractResourcesByType(bundle, 'Condition')
  const medications = extractResourcesByType(bundle, 'MedicationRequest')
  const encounters = extractResourcesByType(bundle, 'Encounter')

  return {
    patient,
    observations,
    conditions,
    medications,
    encounters,
    totalResources: bundle.entry?.length || 0
  }
}