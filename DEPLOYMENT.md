# Plumly Deployment Guide

## Vercel Deployment

This application is configured for seamless deployment on Vercel.

### Prerequisites

1. **Anthropic API Key**: Required for AI summarization
   - Get your key from https://console.anthropic.com/
   - Required for the `/api/summarize` endpoint

2. **FHIR Server** (Optional): The app now supports public test servers
   - Default: Uses public FHIR test servers (no setup needed)
   - Optional: Connect to local or custom FHIR server

### Public FHIR Test Servers

The application includes 3 pre-configured public test servers:

1. **Firely Public Server** (https://server.fire.ly) - FHIR 4.0.1
2. **SMART Health IT** (https://r4.smarthealthit.org) - FHIR 4.0.0
3. **HAPI FHIR Public** (https://hapi.fhir.org/baseR4) - FHIR 4.0.1

No additional configuration needed - these work out of the box!

### Deployment Steps

1. **Push to GitHub**: `git push origin main`
2. **Deploy to Vercel**: Import repo at https://vercel.com/new
3. **Set Environment Variables**:
   - Required: `ANTHROPIC_API_KEY`
   - Optional: `FHIR_SERVER_URL`, `NEXT_PUBLIC_FHIR_SERVER_URL`

### Testing Your Deployment

1. Visit your deployment URL
2. Click "FHIR Server Connection" → Select "HAPI FHIR Public"
3. Click "Test" → should show green checkmark
4. Click "Browse Patients" → should show 10 patients
5. Select a patient → Click "Fetch Patient Data"
6. Click "Generate AI Summary" → verify summary appears

✅ All three public servers tested and working!

---

For full details, see README.md
