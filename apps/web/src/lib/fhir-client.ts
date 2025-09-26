import { FHIRBundle, FHIRResource } from '@/types/fhir'

class FHIRClient {
  private baseUrl: string

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_FHIR_SERVER_URL || 'http://localhost:8080/fhir') {
    this.baseUrl = baseUrl
  }

  async uploadBundle(bundle: FHIRBundle): Promise<any> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      },
      body: JSON.stringify(bundle)
    })

    if (!response.ok) {
      throw new Error(`Failed to upload bundle: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createResource(resource: FHIRResource): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${resource.resourceType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      },
      body: JSON.stringify(resource)
    })

    if (!response.ok) {
      throw new Error(`Failed to create ${resource.resourceType}: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getResource(resourceType: string, id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${resourceType}/${id}`, {
      headers: {
        'Accept': 'application/fhir+json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get ${resourceType}/${id}: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async searchResources(resourceType: string, params: Record<string, string> = {}): Promise<any> {
    const searchParams = new URLSearchParams(params)
    const response = await fetch(`${this.baseUrl}/${resourceType}?${searchParams}`, {
      headers: {
        'Accept': 'application/fhir+json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to search ${resourceType}: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getPatientData(patientId: string): Promise<{
    patient: any
    observations: any[]
    conditions: any[]
    medications: any[]
    encounters: any[]
  }> {
    const [patient, observations, conditions, medications, encounters] = await Promise.all([
      this.getResource('Patient', patientId),
      this.searchResources('Observation', { subject: `Patient/${patientId}` }),
      this.searchResources('Condition', { subject: `Patient/${patientId}` }),
      this.searchResources('MedicationRequest', { subject: `Patient/${patientId}` }),
      this.searchResources('Encounter', { subject: `Patient/${patientId}` })
    ])

    return {
      patient,
      observations: observations.entry?.map((e: any) => e.resource) || [],
      conditions: conditions.entry?.map((e: any) => e.resource) || [],
      medications: medications.entry?.map((e: any) => e.resource) || [],
      encounters: encounters.entry?.map((e: any) => e.resource) || []
    }
  }
}

export const fhirClient = new FHIRClient()