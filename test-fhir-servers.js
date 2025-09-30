/**
 * Test script to verify connections to public FHIR test servers
 * Run with: node test-fhir-servers.js
 */

const PUBLIC_FHIR_SERVERS = [
  {
    name: 'Firely Public Server',
    url: 'https://server.fire.ly'
  },
  {
    name: 'SMART Health IT',
    url: 'https://r4.smarthealthit.org'
  },
  {
    name: 'HAPI FHIR Public',
    url: 'https://hapi.fhir.org/baseR4'
  }
]

async function testServer(server) {
  console.log(`\n🔍 Testing ${server.name}...`)
  console.log(`   URL: ${server.url}`)

  try {
    // Test 1: Metadata endpoint
    console.log('   📋 Checking metadata endpoint...')
    const metadataResponse = await fetch(`${server.url}/metadata`, {
      headers: { 'Accept': 'application/fhir+json' }
    })

    if (!metadataResponse.ok) {
      console.log(`   ❌ Metadata failed: ${metadataResponse.status}`)
      return { success: false, server: server.name, error: 'Metadata endpoint failed' }
    }

    const metadata = await metadataResponse.json()
    const fhirVersion = metadata.fhirVersion || 'Unknown'
    console.log(`   ✅ Metadata OK - FHIR ${fhirVersion}`)

    // Test 2: Patient search
    console.log('   👥 Fetching patient list...')
    const patientResponse = await fetch(`${server.url}/Patient?_count=5&_sort=-_lastUpdated`, {
      headers: { 'Accept': 'application/fhir+json' }
    })

    if (!patientResponse.ok) {
      console.log(`   ❌ Patient search failed: ${patientResponse.status}`)
      return { success: false, server: server.name, error: 'Patient search failed' }
    }

    const patientBundle = await patientResponse.json()
    const patientCount = patientBundle.entry?.length || 0
    console.log(`   ✅ Found ${patientCount} patients`)

    if (patientCount > 0) {
      const firstPatient = patientBundle.entry[0].resource
      const patientId = firstPatient.id
      const patientName = firstPatient.name?.[0]
        ? `${firstPatient.name[0].given?.join(' ') || ''} ${firstPatient.name[0].family || ''}`.trim()
        : 'Unnamed'

      console.log(`   👤 Sample patient: ${patientName} (ID: ${patientId})`)

      // Test 3: $everything operation
      console.log(`   📦 Testing $everything for patient ${patientId}...`)
      const everythingResponse = await fetch(`${server.url}/Patient/${patientId}/$everything`, {
        headers: { 'Accept': 'application/fhir+json' }
      })

      if (!everythingResponse.ok) {
        console.log(`   ⚠️  $everything not supported or failed: ${everythingResponse.status}`)
      } else {
        const everythingBundle = await everythingResponse.json()
        const resourceCount = everythingBundle.entry?.length || 0
        console.log(`   ✅ $everything returned ${resourceCount} resources`)
      }
    }

    return { success: true, server: server.name, patientCount, fhirVersion }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return { success: false, server: server.name, error: error.message }
  }
}

async function main() {
  console.log('🚀 Testing Public FHIR Server Connections\n')
  console.log('=' .repeat(60))

  const results = []

  for (const server of PUBLIC_FHIR_SERVERS) {
    const result = await testServer(server)
    results.push(result)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Brief delay between tests
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary:\n')

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`✅ Successful: ${successful.length}/${results.length}`)
  successful.forEach(r => {
    console.log(`   - ${r.server}: ${r.patientCount} patients, FHIR ${r.fhirVersion}`)
  })

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`)
    failed.forEach(r => {
      console.log(`   - ${r.server}: ${r.error}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n✨ Testing complete!')
  console.log('\n💡 Next steps:')
  console.log('   1. Open http://localhost:3000 in your browser')
  console.log('   2. Click "FHIR Server Connection" tab')
  console.log('   3. Select a server and click "Test"')
  console.log('   4. Click "Browse Patients" to see available patients')
  console.log('   5. Select a patient and click "Fetch Patient Data"')
  console.log('   6. Generate an AI summary!\n')
}

main().catch(console.error)