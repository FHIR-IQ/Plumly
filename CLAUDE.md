# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Production build with type checking
npm run start        # Start production server
npm run typecheck    # TypeScript compilation check without emitting
npm run lint         # ESLint checking with Next.js rules
```

### FHIR Server Management
```bash
npm run fhir:start   # Start HAPI FHIR server in Docker (localhost:8080)
npm run fhir:stop    # Stop FHIR server
npm run fhir:logs    # View FHIR server logs
```

### Environment Setup
```bash
cp .env.local.example .env.local  # Create environment file
# Then add your ANTHROPIC_API_KEY to .env.local
```

## Architecture Overview

### Core Data Flow
The application follows a healthcare-specific architecture centered around FHIR data processing:

1. **FHIR Bundle Upload** → Validation (fhir-validator.ts) → Optional Storage (HAPI FHIR server)
2. **AI Summarization** → Prompt Templates (prompt-templates.ts) → Claude API (claude-client.ts)
3. **Output Generation** → Multiple formats via FHIR Composition Generator (fhir-composition.ts)

### Key Service Classes

**ClaudeClient** (`src/lib/claude-client.ts`):
- Manages Anthropic API integration using Claude 3.5 Sonnet
- Builds dynamic prompts from FHIR data and template configurations
- Supports three target audiences: patient, provider, payer
- Returns structured metadata with summaries

**PromptTemplateManager** (`src/lib/prompt-templates.ts`):
- In-memory template storage with 6 pre-built healthcare templates
- Runtime customization with focus areas and options
- Audience-specific prompt engineering for healthcare contexts

**FHIRCompositionGenerator** (`src/lib/fhir-composition.ts`):
- Converts AI summaries back into FHIR-compliant resources
- Generates Composition, DocumentReference, and List resources
- Parses narrative text into structured FHIR sections

### API Architecture
Next.js API routes handle healthcare-specific workflows:

- `/api/fhir/upload` - FHIR bundle validation and optional storage
- `/api/summarize` - Core AI summarization with configurable options
- `/api/compose` - FHIR resource generation from summaries
- `/api/templates` - Template CRUD operations

### FHIR Resource Handling
The application uses a custom FHIR type system (`src/types/fhir.ts`) that extends the base FHIR specification with healthcare-specific interfaces for Patient, Observation, Condition, MedicationRequest, and Encounter resources.

## Healthcare-Specific Considerations

### FHIR Compliance
- All data structures follow FHIR R4 specification
- Resource validation occurs at multiple layers (upload, processing, output)
- HAPI FHIR server provides optional standards-compliant storage

### AI Prompt Engineering
- Templates are healthcare-domain specific with clinical context awareness
- Prompts dynamically inject patient data while maintaining clinical accuracy
- Multiple output formats support different healthcare stakeholder needs

### Security Model
- POC designed for test data only (no PHI handling)
- API keys managed through environment variables
- Local processing with optional external FHIR server integration

## Key Development Patterns

### FHIR Bundle Processing
When working with FHIR data, always:
1. Validate bundle structure using `validateFHIRBundle()`
2. Extract patient summary data with `createPatientSummaryData()`
3. Process through appropriate prompt templates
4. Generate compliant output resources

### Error Handling
The application implements healthcare-appropriate error handling:
- FHIR validation errors return specific FHIR-compliant error responses
- Claude API failures gracefully degrade with meaningful healthcare context
- Upload failures distinguish between validation and storage issues

### Template Customization
Prompt templates support dynamic customization:
- Focus areas for specific medical conditions or concerns
- Recommendation inclusion/exclusion based on clinical context
- Audience-appropriate language and detail levels

## Testing and Sample Data

Use `sample-data/sample-patient-bundle.json` for testing - it contains a realistic patient scenario with diabetes and hypertension including relevant observations, medications, and encounters.

## Documentation Structure

Comprehensive documentation follows GitHub spec-kit standards:
- `/docs/specs/` - Technical specifications and requirements
- `/docs/adr/` - Architecture Decision Records
- `/docs/architecture/` - System design documentation

The documentation emphasizes healthcare compliance, clinical accuracy, and FHIR standards adherence throughout the development process.