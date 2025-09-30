import { NextRequest, NextResponse } from 'next/server'

interface PatientSummary {
  id: string
  name: string
  gender?: string
  birthDate?: string
  identifier?: string
}

/**
 * Fetch patients from a FHIR server
 * GET /api/fhir/patients?serverUrl=<url>&count=<number>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const serverUrl = searchParams.get('serverUrl')
  const count = parseInt(searchParams.get('count') || '10', 10)

  if (!serverUrl) {
    return NextResponse.json(
      { error: 'Server URL is required' },
      { status: 400 }
    )
  }

  try {
    // Construct search URL with count limit
    const searchUrl = `${serverUrl}/Patient?_count=${Math.min(count, 50)}&_sort=-_lastUpdated`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      },
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Server returned ${response.status}`,
          serverUrl,
          details: response.statusText
        },
        { status: response.status }
      )
    }

    const bundle = await response.json()

    if (bundle.resourceType !== 'Bundle') {
      return NextResponse.json(
        { error: 'Invalid response - not a FHIR Bundle' },
        { status: 500 }
      )
    }

    // Extract patient summaries
    const patients: PatientSummary[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const patient = entry.resource
        if (patient?.resourceType === 'Patient') {
          const name = patient.name?.[0]
          const displayName = name
            ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() || 'Unnamed Patient'
            : 'Unnamed Patient'

          patients.push({
            id: patient.id,
            name: displayName,
            gender: patient.gender,
            birthDate: patient.birthDate,
            identifier: patient.identifier?.[0]?.value
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      serverUrl,
      total: bundle.total || patients.length,
      patients,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timeout',
          serverUrl,
          details: 'Server took too long to respond'
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch patients',
        serverUrl,
        details: error.message
      },
      { status: 500 }
    )
  }
}