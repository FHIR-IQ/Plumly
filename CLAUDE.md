# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Monorepo Management
This is a Turborepo monorepo with multiple workspaces. All commands use Turbo for orchestration:

```bash
npm run dev          # Start all development servers (runs Next.js on localhost:3000)
npm run build        # Build all packages and applications
npm run typecheck    # TypeScript compilation check across all workspaces
npm run lint         # ESLint checking across all workspaces
npm run test         # Run all tests
npm run test:ci      # CI-optimized test run
npm run test:performance    # Performance benchmarking tests
npm run test:clinical       # Clinical accuracy validation tests
```

### Web Application (apps/web)
To work with the web app specifically:
```bash
cd apps/web
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run typecheck    # Type checking
npm run test:e2e     # Playwright end-to-end tests
npm run test:e2e:ui  # Playwright UI mode
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

### Monorepo Structure
The project uses Turborepo with three main workspaces:

**apps/web** - Next.js 14 application with App Router
- Main UI and user-facing features
- API routes for FHIR processing and AI summarization
- React components using Radix UI and Tailwind CSS
- Direct dependencies on both packages

**packages/fhir-utils** - FHIR data utilities
- FHIR bundle validation and parsing
- Resource extraction and type definitions
- Clinical data type conversions
- No external package dependencies

**packages/summarizer** - AI summarization engine
- Claude API client integration
- Prompt template management (6 pre-built templates)
- Persona-based prompt engineering (patient/provider/payer)
- Resource processing for summarization
- Depends on fhir-utils

**packages/evaluator** - Quality evaluation tools
- Clinical accuracy metrics
- Performance timing analysis
- Golden test fixtures
- Provenance tracking
- CLI tool for evaluation runs

### Core Data Flow
The application follows a healthcare-specific architecture centered around FHIR data processing:

1. **FHIR Bundle Upload** → Validation (`fhir-utils`) → Optional Storage (HAPI FHIR server)
2. **AI Summarization** → Prompt Templates (`summarizer`) → Claude API → Structured Output
3. **Output Generation** → Multiple formats via FHIR Composition Generator

### Key Service Architecture

**Summarizer Package** (`packages/summarizer/src/`):
- `claude-client.ts` - Anthropic API integration using Claude 3.5 Sonnet
- `prompt-templates.ts` - Template management with 6 pre-built healthcare templates
- `persona-templates.ts` - Audience-specific prompt engineering
- `resource-processor.ts` - FHIR resource to prompt data conversion

**FHIR Utils Package** (`packages/fhir-utils/src/`):
- `validators.ts` - FHIR bundle structure validation
- `parsers.ts` - Resource extraction and parsing
- `clinical-types.ts` - Healthcare-specific type definitions
- `resource-selector.ts` - Smart resource selection for summarization

**Web Application** (`apps/web/src/`):
- `app/api/summarize/route.ts` - Core AI summarization endpoint
- `app/api/fhir/upload/route.ts` - FHIR bundle validation and storage
- `app/api/compose/route.ts` - FHIR Composition generation
- `lib/fhir-composition.ts` - Converts summaries to FHIR-compliant resources
- `components/` - React components for upload, configuration, and display

### API Architecture
Next.js API routes handle healthcare-specific workflows:

- `/api/fhir/upload` - FHIR bundle validation and optional storage
- `/api/summarize` - Core AI summarization with configurable options
- `/api/compose` - FHIR resource generation (Composition, DocumentReference, List)
- `/api/templates` - Template CRUD operations
- `/api/tts` - Text-to-speech conversion
- `/api/share/create` - Create shareable summary links
- `/api/share/[token]` - Retrieve shared summaries

### FHIR Resource Handling
The application processes these FHIR R4 resources:
- Patient (demographics and identifiers)
- Observation (lab results, vital signs, assessments)
- Condition (diagnoses and health conditions)
- MedicationRequest (prescribed medications)
- Encounter (healthcare visits and interactions)

Custom type system in `fhir-utils` extends base FHIR specification with healthcare-specific interfaces.

## Healthcare-Specific Considerations

### FHIR Compliance
- All data structures follow FHIR R4 specification
- Resource validation occurs at multiple layers (upload, processing, output)
- HAPI FHIR server provides optional standards-compliant storage
- Composition generation includes proper XHTML narrative formatting

### AI Prompt Engineering
The summarizer uses three distinct persona types:
- **Patient**: Simple language, avoids jargon, focuses on actionable information
- **Provider**: Medical terminology, clinical details, structured format with recommendations
- **Payer**: Cost-effectiveness, quality metrics, care gaps, risk stratification

Templates support dynamic customization:
- Focus areas for specific medical conditions
- Recommendation inclusion/exclusion
- Multiple output formats (narrative, structured, composition)

### Security Model
- POC designed for test data only (no PHI handling)
- API keys managed through environment variables
- Local processing with optional external FHIR server integration
- Share tokens use in-memory storage (not production-ready)

## Key Development Patterns

### FHIR Bundle Processing Workflow
When working with FHIR data:
1. Validate bundle structure using `validateFHIRBundle()` from fhir-utils
2. Extract patient summary data with `createPatientSummaryData()`
3. Process through appropriate prompt templates in summarizer
4. Generate compliant output resources using `FHIRCompositionGenerator`

### Package Dependencies
Always respect the dependency hierarchy:
- fhir-utils → (no internal deps)
- summarizer → fhir-utils
- web → fhir-utils + summarizer

When making changes, consider impact on dependent packages.

### Error Handling
Healthcare-appropriate error handling is critical:
- FHIR validation errors return specific FHIR-compliant error responses
- Claude API failures gracefully degrade with meaningful healthcare context
- Upload failures distinguish between validation and storage issues
- All API routes include try-catch with descriptive error messages

### Testing Strategy
- Unit tests: Jest for packages (fhir-utils, summarizer, evaluator)
- E2E tests: Playwright for web application
- Clinical tests: Custom evaluation suite in evaluator package
- Performance tests: Timing analysis for summarization pipeline

## Turborepo Configuration

The `turbo.json` defines the build pipeline:
- `build` tasks have `^build` dependency (build packages before apps)
- `dev` is persistent and not cached
- `typecheck` depends on builds to ensure types are available
- Test tasks produce outputs in coverage directories

When adding new packages, update `turbo.json` accordingly.

## Testing with Sample Data

Use sample FHIR bundles in `sample-data/` for testing - they contain realistic patient scenarios with diabetes and hypertension including relevant observations, medications, and encounters.

## Component Architecture

### Key React Components
- `FHIRUpload` - Bundle upload with drag-and-drop validation
- `PersonaTemplateSelector` - Template and persona selection
- `SummaryRenderer` - Display AI-generated summaries with section parsing
- `LabTrendChart` / `MedicationTimeline` - Data visualizations using Recharts
- `ReviewItemsCard` - Clinical review item extraction and display
- `ShareButton` - Generate shareable summary links
- `AudioPlayer` - Text-to-speech playback

### State Management
Uses Zustand for lightweight global state (avoid prop drilling for summary data).

## Docker and FHIR Server

The HAPI FHIR server runs in Docker with:
- Port 8080 exposed for FHIR API
- Persistent volume for data storage
- Healthcheck endpoint at `/fhir/metadata`
- Relaxed referential integrity for POC usage

Access FHIR server at `http://localhost:8080/fhir` after running `npm run fhir:start`.