# Specification: FHIR Data Summarization POC

**Status:** Draft
**Created:** 2024-01-23
**Updated:** 2024-01-23
**Authors:** Claude Code AI
**Reviewers:** TBD

## Summary

This specification defines the requirements and architecture for Plumly, a proof-of-concept application that demonstrates AI-powered summarization of FHIR healthcare data using Claude API integration.

## Problem Statement

Healthcare systems generate vast amounts of structured FHIR data that is difficult for patients, providers, and payers to quickly understand and act upon. There is a need for intelligent summarization that can:

1. Transform complex medical data into patient-friendly narratives
2. Generate clinical summaries for healthcare providers
3. Create utilization reports for payers and health systems
4. Maintain FHIR compliance for downstream integration

## Goals

### Primary Goals
- Build a functional POC that ingests FHIR bundles and generates AI-powered summaries
- Demonstrate multiple output formats (narrative, structured, FHIR Composition)
- Provide configurable prompt templates for different audiences
- Achieve <5s response time for summary generation
- Support up to 1,000 resources per patient

### Non-Goals
- Production-ready security and compliance (PHI handling)
- Multi-tenant architecture
- Real-time data synchronization
- Advanced analytics and reporting

## User Stories

### As a Patient
- I want to upload my FHIR health data and receive a simple, understandable summary
- I want to download my health summary in multiple formats
- I want to focus the summary on specific health concerns

### As a Healthcare Provider
- I want to generate clinical summaries with medical terminology and structured sections
- I want to identify care gaps and medication reconciliation issues
- I want to export summaries as FHIR Compositions for EHR integration

### As a Payer/Health System
- I want to analyze utilization patterns and cost-effectiveness
- I want to identify quality metrics and preventive care opportunities
- I want to generate reports for value-based care initiatives

## Technical Requirements

### Functional Requirements

#### FR-001: FHIR Data Ingestion
- **Description:** System shall accept FHIR R4 bundles via file upload
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Support JSON format FHIR bundles
  - Validate bundle structure and resource types
  - Handle bundles with 1-1000 resources
  - Support Patient, Observation, Condition, MedicationRequest, Encounter resources

#### FR-002: AI-Powered Summarization
- **Description:** System shall generate summaries using Claude API
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Integrate with Anthropic Claude API
  - Support configurable prompt templates
  - Generate summaries in <5 seconds
  - Support multiple target audiences (patient, provider, payer)

#### FR-003: Multi-Format Output
- **Description:** System shall provide multiple output formats
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Narrative text format
  - Structured JSON format
  - FHIR Composition resource format
  - Download functionality for all formats

#### FR-004: Prompt Configuration
- **Description:** System shall allow prompt customization
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Pre-built templates for different audiences
  - Custom focus areas selection
  - Include/exclude recommendations option
  - Template management interface

#### FR-005: FHIR Server Integration
- **Description:** System shall integrate with HAPI FHIR server
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Store uploaded bundles in FHIR server
  - Query resources for summarization
  - Support standard FHIR REST operations

### Non-Functional Requirements

#### NFR-001: Performance
- Summary generation: <5 seconds response time
- UI responsiveness: <2 seconds for page loads
- Support concurrent users: 10+ simultaneous requests

#### NFR-002: Scalability
- Handle bundles up to 1000 resources
- Memory usage: <512MB per summarization request
- Horizontal scaling capability

#### NFR-003: Reliability
- 99% uptime for demo environments
- Graceful error handling and user feedback
- Data validation and sanitization

#### NFR-004: Security
- Local deployment only (no cloud PHI exposure)
- API key management through environment variables
- Input validation and sanitization

#### NFR-005: Usability
- Intuitive drag-and-drop file upload
- Clear progress indicators
- Responsive design for desktop and tablet
- Accessible UI components

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  External APIs  │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Claude AI)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  HAPI FHIR      │
                       │  Server         │
                       │  (Docker)       │
                       └─────────────────┘
```

### Component Architecture

#### Frontend Components
- **FileUpload**: Drag-and-drop FHIR bundle upload with validation
- **PromptConfiguration**: Template selection and customization interface
- **SummaryOutput**: Display generated summaries with export options
- **TemplateManager**: CRUD operations for prompt templates

#### Backend Services
- **FHIRClient**: Interface to HAPI FHIR server operations
- **ClaudeClient**: AI summarization service integration
- **CompositionGenerator**: FHIR resource generation from summaries
- **PromptTemplateManager**: Template storage and retrieval

#### Data Models
- **FHIRBundle**: TypeScript interfaces for FHIR R4 resources
- **SummaryOutput**: Generated summary with metadata
- **PromptTemplate**: Configurable template definitions

### Data Flow

1. **Upload Phase**
   - User uploads FHIR bundle via drag-and-drop interface
   - Frontend validates JSON structure and FHIR compliance
   - Bundle stored in HAPI FHIR server for persistence

2. **Configuration Phase**
   - User selects prompt template and target audience
   - Custom focus areas and options configured
   - Frontend prepares summarization request parameters

3. **Summarization Phase**
   - Backend retrieves patient data from FHIR server
   - Claude API called with structured prompt and patient data
   - AI generates narrative or structured summary

4. **Output Phase**
   - Summary displayed in frontend with metadata
   - User can download in multiple formats (TXT, JSON, FHIR)
   - FHIR Composition generated for standards compliance

## API Specification

### REST Endpoints

#### POST /api/fhir/upload
Upload and validate FHIR bundle
- **Request:** FHIR Bundle JSON
- **Response:** Upload confirmation with bundle ID

#### POST /api/summarize
Generate AI summary from FHIR data
- **Request:** Bundle + summarization options
- **Response:** Generated summary with metadata

#### POST /api/compose
Generate FHIR Composition from summary
- **Request:** Summary + metadata + output type
- **Response:** FHIR Composition/DocumentReference/List

#### GET /api/templates
Retrieve available prompt templates
- **Parameters:** audience, format filters
- **Response:** Array of template objects

## Security Considerations

### Data Protection
- No PHI data stored permanently
- Local deployment prevents cloud exposure
- Environment variable protection for API keys

### Input Validation
- FHIR bundle structure validation
- File size and type restrictions
- API parameter sanitization

### Authentication
- Demo environment: No authentication required
- Production considerations: OAuth2/OIDC integration
- API key rotation policies

## Testing Strategy

### Unit Testing
- Component functionality testing
- API endpoint validation
- FHIR resource generation accuracy

### Integration Testing
- Claude API integration reliability
- HAPI FHIR server communication
- End-to-end summarization workflow

### Performance Testing
- Load testing with 1000-resource bundles
- Concurrent user simulation
- Memory usage profiling

### Usability Testing
- User workflow validation
- Accessibility compliance
- Mobile responsiveness

## Success Metrics

### Technical Metrics
- **Response Time:** <5s for summary generation
- **Accuracy:** >80% clinical relevance in generated summaries
- **Reliability:** <1% error rate in production scenarios

### User Experience Metrics
- **Task Completion Rate:** >90% successful summary generation
- **User Satisfaction:** >4/5 rating in usability studies
- **Adoption:** Demonstrable use by all three target user types

### Business Metrics
- **Demonstration Value:** Successfully showcase AI-FHIR integration
- **Scalability Proof:** Handle projected load requirements
- **Integration Readiness:** Export formats compatible with downstream systems

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- ✅ Next.js project setup with TypeScript
- ✅ HAPI FHIR server Docker configuration
- ✅ Basic file upload and validation
- ✅ Claude API integration prototype

### Phase 2: Core Features (Week 3-4)
- ✅ Prompt template system implementation
- ✅ Multi-format summary generation
- ✅ FHIR Composition creation
- ✅ Download/export functionality

### Phase 3: Enhancement (Week 5-6)
- Enhanced error handling and validation
- Performance optimization
- UI/UX improvements
- Comprehensive testing

### Phase 4: Documentation (Week 7-8)
- User documentation and guides
- API documentation
- Deployment instructions
- Demo scenarios and sample data

## Dependencies

### External Services
- **Anthropic Claude API:** AI summarization engine
- **HAPI FHIR Server:** FHIR-compliant data storage

### Technology Stack
- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Node.js
- **Storage:** HAPI FHIR server (Docker)
- **AI Integration:** Anthropic SDK
- **Containerization:** Docker, Docker Compose

### Development Tools
- **IDE:** VS Code with TypeScript extensions
- **Version Control:** Git with GitHub
- **Package Management:** npm
- **Testing:** Jest, React Testing Library
- **Linting:** ESLint, Prettier

## Risks and Mitigation

### Technical Risks
- **Risk:** Claude API rate limiting or downtime
- **Mitigation:** Implement retry logic and fallback options

- **Risk:** FHIR bundle complexity variations
- **Mitigation:** Extensive validation and error handling

- **Risk:** Performance degradation with large bundles
- **Mitigation:** Pagination and resource filtering

### Business Risks
- **Risk:** Demo data not representative of real scenarios
- **Mitigation:** Collaborate with healthcare SMEs for realistic test cases

- **Risk:** AI summary accuracy concerns
- **Mitigation:** Implement validation metrics and human review processes

## Future Considerations

### Production Readiness
- Authentication and authorization implementation
- HIPAA compliance measures
- Audit logging and monitoring
- Multi-tenant architecture

### Advanced Features
- Real-time data synchronization
- Advanced analytics and dashboards
- Integration with EHR systems
- Mobile application support

### AI Enhancement
- Multi-model support (OpenAI, Gemini)
- Fine-tuning for healthcare domains
- Feedback loop for accuracy improvement
- Natural language query interface

---

## Appendices

### A. FHIR Resource Examples
See `sample-data/sample-patient-bundle.json` for complete examples

### B. Prompt Template Examples
See `src/lib/prompt-templates.ts` for implementation details

### C. API Response Examples
See API documentation for detailed request/response schemas