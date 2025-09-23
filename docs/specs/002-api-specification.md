# API Specification: Plumly FHIR Summarization Service

**Status:** Draft
**Version:** 1.0
**Created:** 2024-01-23
**Updated:** 2024-01-23
**Authors:** Claude Code AI

## Overview

This document specifies the REST API endpoints for the Plumly FHIR Data Summarization service. The API provides functionality for uploading FHIR bundles, generating AI-powered summaries, managing prompt templates, and creating FHIR compositions.

## Base URL

```
Development: http://localhost:3000/api
Production: TBD
```

## Authentication

**Current Status:** No authentication required (POC environment)
**Future:** OAuth2/OIDC for production deployments

## Content Types

- **Request Content-Type:** `application/json`
- **Response Content-Type:** `application/json`
- **FHIR Content-Type:** `application/fhir+json` (for FHIR resources)

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description",
  "details": "Additional technical details",
  "timestamp": "2024-01-23T10:30:00Z",
  "path": "/api/endpoint"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (future)
- `403` - Forbidden (future)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error
- `503` - Service Unavailable

## API Endpoints

## 1. FHIR Bundle Management

### Upload FHIR Bundle

Upload and validate a FHIR bundle for processing.

**Endpoint:** `POST /api/fhir/upload`

**Request Body:**
```json
{
  "resourceType": "Bundle",
  "id": "example-bundle",
  "type": "collection",
  "entry": [
    {
      "fullUrl": "Patient/patient-1",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-1",
        "name": [
          {
            "given": ["John"],
            "family": "Doe"
          }
        ],
        "gender": "male",
        "birthDate": "1980-01-01"
      }
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "bundleId": "bundle-123",
  "message": "Bundle uploaded successfully",
  "data": {
    "id": "bundle-123",
    "resourceCount": 15,
    "patientId": "patient-1",
    "timestamp": "2024-01-23T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid FHIR Bundle format",
  "details": "Bundle type must be one of: collection, document, message, transaction",
  "timestamp": "2024-01-23T10:30:00Z",
  "path": "/api/fhir/upload"
}
```

### Get Upload Information

Get information about the upload endpoint.

**Endpoint:** `GET /api/fhir/upload`

**Success Response (200):**
```json
{
  "message": "FHIR Upload API",
  "endpoints": {
    "POST": "Upload a FHIR Bundle"
  },
  "supportedResourceTypes": [
    "Patient",
    "Observation",
    "Condition",
    "MedicationRequest",
    "Encounter"
  ]
}
```

## 2. AI Summarization

### Generate Summary

Generate an AI-powered summary from a FHIR bundle.

**Endpoint:** `POST /api/summarize`

**Request Body:**
```json
{
  "bundle": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [...]
  },
  "options": {
    "targetAudience": "patient",
    "outputFormat": "narrative",
    "includeRecommendations": true,
    "focusAreas": ["diabetes", "medications"],
    "templateId": "patient-narrative"
  }
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bundle` | FHIRBundle | Yes | FHIR bundle containing patient data |
| `options` | SummarizationOptions | Yes | Configuration for summary generation |

**SummarizationOptions Schema:**
```json
{
  "targetAudience": {
    "type": "string",
    "enum": ["patient", "provider", "payer"],
    "description": "Target audience for the summary"
  },
  "outputFormat": {
    "type": "string",
    "enum": ["narrative", "structured", "composition"],
    "description": "Desired output format"
  },
  "includeRecommendations": {
    "type": "boolean",
    "description": "Whether to include clinical recommendations"
  },
  "focusAreas": {
    "type": "array",
    "items": {"type": "string"},
    "description": "Specific areas to focus on in the summary"
  },
  "templateId": {
    "type": "string",
    "description": "ID of prompt template to use"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "summary": "John Doe is a 44-year-old male with type 2 diabetes...",
  "metadata": {
    "timestamp": "2024-01-23T10:30:00Z",
    "options": {
      "targetAudience": "patient",
      "outputFormat": "narrative",
      "includeRecommendations": true,
      "focusAreas": ["diabetes", "medications"]
    },
    "resourceCounts": {
      "Patient": 1,
      "Observation": 5,
      "Condition": 2,
      "MedicationRequest": 3,
      "Encounter": 2,
      "Total": 13
    },
    "promptUsed": "patient-narrative",
    "processingTime": 3.2
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid FHIR Bundle format",
  "details": "Bundle validation failed: missing resourceType",
  "timestamp": "2024-01-23T10:30:00Z",
  "path": "/api/summarize"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to generate summary",
  "details": "Claude API request failed: rate limit exceeded",
  "timestamp": "2024-01-23T10:30:00Z",
  "path": "/api/summarize"
}
```

### Get Summarization Information

Get information about the summarization endpoint.

**Endpoint:** `GET /api/summarize`

**Success Response (200):**
```json
{
  "message": "FHIR Summarization API",
  "endpoints": {
    "POST": "Generate AI summary from FHIR Bundle"
  },
  "options": {
    "targetAudience": ["patient", "provider", "payer"],
    "outputFormat": ["narrative", "structured", "composition"],
    "includeRecommendations": "boolean",
    "focusAreas": "array of strings"
  },
  "performanceTargets": {
    "responseTime": "< 5 seconds",
    "maxBundleSize": "1000 resources"
  }
}
```

## 3. FHIR Composition Generation

### Generate FHIR Composition

Create FHIR-compliant resources from generated summaries.

**Endpoint:** `POST /api/compose`

**Request Body:**
```json
{
  "bundle": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [...]
  },
  "summary": "Generated summary text content...",
  "metadata": {
    "timestamp": "2024-01-23T10:30:00Z",
    "options": {...},
    "resourceCounts": {...}
  },
  "outputType": "composition"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bundle` | FHIRBundle | No | Original FHIR bundle (for context) |
| `summary` | string | Yes | Generated summary text |
| `metadata` | object | Yes | Summary generation metadata |
| `outputType` | string | Yes | Type of FHIR resource to generate |

**Output Types:**
- `composition` - FHIR Composition resource
- `document-reference` - FHIR DocumentReference resource
- `list` - FHIR List resource

**Success Response (200) - Composition:**
```json
{
  "success": true,
  "resource": {
    "resourceType": "Composition",
    "id": "summary-1234567890",
    "status": "final",
    "type": {
      "coding": [
        {
          "system": "http://loinc.org",
          "code": "11503-0",
          "display": "Medical records"
        }
      ]
    },
    "subject": {
      "reference": "Patient/patient-1",
      "display": "John Michael Doe"
    },
    "date": "2024-01-23T10:30:00Z",
    "author": [
      {
        "display": "Plumly AI Summary Generator"
      }
    ],
    "title": "AI Generated Health Summary - patient",
    "confidentiality": "N",
    "section": [
      {
        "title": "Health Summary",
        "text": {
          "status": "generated",
          "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">Generated summary content...</div>"
        }
      }
    ]
  },
  "resourceType": "Composition"
}
```

**Success Response (200) - DocumentReference:**
```json
{
  "success": true,
  "resource": {
    "resourceType": "DocumentReference",
    "id": "summary-doc-1234567890",
    "status": "current",
    "type": {
      "coding": [
        {
          "system": "http://loinc.org",
          "code": "11503-0",
          "display": "Medical records"
        }
      ]
    },
    "subject": {
      "reference": "Patient/patient-1",
      "display": "John Michael Doe"
    },
    "date": "2024-01-23T10:30:00Z",
    "author": [
      {
        "display": "Plumly AI Summary Generator"
      }
    ],
    "description": "AI-generated health summary for patient audience",
    "content": [
      {
        "attachment": {
          "contentType": "text/plain",
          "data": "base64encodedcontent",
          "title": "Health Summary - 1/23/2024",
          "creation": "2024-01-23T10:30:00Z"
        }
      }
    ]
  },
  "resourceType": "DocumentReference"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid output type. Must be: composition, document-reference, or list",
  "timestamp": "2024-01-23T10:30:00Z",
  "path": "/api/compose"
}
```

### Get Composition Information

Get information about FHIR composition generation.

**Endpoint:** `GET /api/compose`

**Success Response (200):**
```json
{
  "message": "FHIR Composition Generation API",
  "endpoints": {
    "POST": "Generate FHIR Composition, DocumentReference, or List from summary"
  },
  "outputTypes": {
    "composition": "FHIR Composition resource with structured sections",
    "document-reference": "FHIR DocumentReference with summary as attachment",
    "list": "FHIR List resource for conditions or other items"
  },
  "supportedFormats": [
    "application/fhir+json",
    "application/json"
  ]
}
```

## 4. Template Management

### Get Templates

Retrieve available prompt templates.

**Endpoint:** `GET /api/templates`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audience` | string | No | Filter by target audience |
| `format` | string | No | Filter by output format |

**Success Response (200):**
```json
{
  "success": true,
  "templates": [
    {
      "id": "patient-narrative",
      "name": "Patient-Friendly Summary",
      "description": "A simple, easy-to-understand summary for patients",
      "targetAudience": "patient",
      "outputFormat": "narrative",
      "template": "Create a patient-friendly health summary..."
    },
    {
      "id": "provider-clinical",
      "name": "Clinical Summary for Providers",
      "description": "Detailed clinical summary for healthcare providers",
      "targetAudience": "provider",
      "outputFormat": "structured",
      "template": "Generate a comprehensive clinical summary..."
    }
  ],
  "count": 2
}
```

### Create Template

Create a new prompt template.

**Endpoint:** `POST /api/templates`

**Request Body:**
```json
{
  "name": "Custom Template Name",
  "description": "Description of the template purpose",
  "targetAudience": "provider",
  "outputFormat": "structured",
  "template": "Template content with instructions..."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "template": {
    "id": "custom-1234567890",
    "name": "Custom Template Name",
    "description": "Description of the template purpose",
    "targetAudience": "provider",
    "outputFormat": "structured",
    "template": "Template content with instructions..."
  },
  "message": "Template created successfully"
}
```

### Get Template by ID

Retrieve a specific prompt template.

**Endpoint:** `GET /api/templates/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Template identifier |

**Success Response (200):**
```json
{
  "success": true,
  "template": {
    "id": "patient-narrative",
    "name": "Patient-Friendly Summary",
    "description": "A simple, easy-to-understand summary for patients",
    "targetAudience": "patient",
    "outputFormat": "narrative",
    "template": "Create a patient-friendly health summary..."
  }
}
```

**Error Response (404):**
```json
{
  "error": "Template not found",
  "timestamp": "2024-01-23T10:30:00Z",
  "path": "/api/templates/invalid-id"
}
```

### Update Template

Update an existing prompt template.

**Endpoint:** `PUT /api/templates/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Template identifier |

**Request Body:**
```json
{
  "name": "Updated Template Name",
  "description": "Updated description",
  "targetAudience": "provider",
  "outputFormat": "structured",
  "template": "Updated template content..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "template": {
    "id": "patient-narrative",
    "name": "Updated Template Name",
    "description": "Updated description",
    "targetAudience": "provider",
    "outputFormat": "structured",
    "template": "Updated template content..."
  },
  "message": "Template updated successfully"
}
```

### Delete Template

Delete a prompt template.

**Endpoint:** `DELETE /api/templates/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Template identifier |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Template not found",
  "timestamp": "2024-01-23T10:30:00Z",
  "path": "/api/templates/invalid-id"
}
```

## Data Models

### FHIR Bundle

Based on FHIR R4 Bundle resource specification.

```typescript
interface FHIRBundle {
  resourceType: 'Bundle'
  id?: string
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection'
  entry?: FHIRBundleEntry[]
}

interface FHIRBundleEntry {
  fullUrl?: string
  resource?: FHIRResource
}
```

### Summarization Options

Configuration parameters for AI summary generation.

```typescript
interface SummarizationOptions {
  targetAudience: 'patient' | 'provider' | 'payer'
  outputFormat: 'narrative' | 'structured' | 'composition'
  includeRecommendations?: boolean
  focusAreas?: string[]
  templateId?: string
}
```

### Summary Metadata

Metadata associated with generated summaries.

```typescript
interface SummaryMetadata {
  timestamp: string
  options: SummarizationOptions
  resourceCounts: Record<string, number>
  promptUsed?: string
  processingTime?: number
  modelVersion?: string
}
```

### Prompt Template

Template definition for AI prompt generation.

```typescript
interface PromptTemplate {
  id: string
  name: string
  description: string
  targetAudience: 'patient' | 'provider' | 'payer'
  outputFormat: 'narrative' | 'structured' | 'composition'
  template: string
  createdAt?: string
  updatedAt?: string
}
```

## Rate Limiting

### Current Limits (POC)
- **Requests per minute:** 60
- **Bundle size limit:** 1MB
- **Summary generation:** 10 per minute
- **Template operations:** 100 per minute

### Future Production Limits
- **Authenticated users:** Higher limits based on subscription
- **Anonymous users:** Lower limits for demo usage
- **Enterprise:** Custom rate limiting agreements

## Performance Targets

### Response Time SLA
- **Summary generation:** < 5 seconds (95th percentile)
- **Template operations:** < 500ms (95th percentile)
- **Bundle upload:** < 2 seconds (95th percentile)
- **FHIR composition:** < 1 second (95th percentile)

### Throughput Targets
- **Concurrent summarizations:** 10+
- **Bundle processing:** 1000 resources maximum
- **Template retrieval:** 1000+ requests per minute

## Security Considerations

### Input Validation
- **FHIR bundle validation:** Structure and resource type verification
- **Size limits:** Prevent oversized payloads
- **Content filtering:** Remove potentially malicious content
- **Type checking:** Validate all request parameters

### Data Privacy
- **No persistence:** Summary data not stored long-term
- **PHI handling:** Appropriate safeguards for demo data only
- **Logging:** No PHI in application logs
- **Error responses:** Sanitized error messages

### API Security
- **HTTPS only:** All communications encrypted (production)
- **Request signing:** Future consideration for integrity
- **API versioning:** Backward compatibility for clients
- **CORS configuration:** Appropriate cross-origin policies

## Versioning

### API Versioning Strategy
- **Current:** v1 (implicit in URL structure)
- **Future:** Version headers or URL-based versioning
- **Backward compatibility:** Maintain for at least 2 major versions

### Change Management
- **Breaking changes:** New major version required
- **Non-breaking additions:** Same major version
- **Deprecation:** 6-month notice for deprecated endpoints

## Monitoring and Observability

### Health Checks
- **Endpoint:** `GET /api/health`
- **Dependencies:** FHIR server, Claude API availability
- **Response time:** Real-time performance metrics

### Metrics Collection
- **Response times:** All endpoint performance tracking
- **Error rates:** Failed request monitoring by endpoint
- **Usage patterns:** Template and feature utilization
- **Resource utilization:** Memory and CPU usage

## Support and Contact

### API Documentation
- **Interactive docs:** Swagger/OpenAPI specification
- **Examples:** Sample requests and responses
- **SDKs:** Client libraries for common languages (future)

### Issue Reporting
- **GitHub Issues:** Bug reports and feature requests
- **Support email:** Technical support contact (future)
- **Community forum:** Developer community discussions

---

**Document Status:** Living Document
**API Version:** 1.0
**Last Updated:** 2024-01-23
**Next Review:** 2024-02-23