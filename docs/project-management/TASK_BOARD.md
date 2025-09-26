# Plumly vNext Task Board

**Status**: Active Development
**Sprint Duration**: 2 weeks
**Total Estimated Duration**: 12 weeks
**Team Size**: 4-6 developers

## Task Board Overview

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   TODO (24)     │ IN PROGRESS (6) │   REVIEW (4)    │    DONE (0)     │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 🏗️ Foundations  │                 │                 │                 │
│ 🧠 Summarization│                 │                 │                 │
│ 🔍 Provenance   │                 │                 │                 │
│ 📊 Visualizations│                │                 │                 │
│ 🔗 Sharing      │                 │                 │                 │
│ ✅ QA & Testing │                 │                 │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## WS1 — Foundations 🏗️

### T1.1: Next.js 14 Project Scaffold
**Priority**: P0 | **Effort**: 3 days | **Sprint**: 1 | **Owner**: Frontend Lead

**Description**:
Set up the complete project foundation with Next.js 14, modern tooling, and CI/CD pipeline.

**Tasks**:
- [ ] Initialize Next.js 14 with App Router and TypeScript
- [ ] Configure Tailwind CSS with design system
- [ ] Install and configure shadcn/ui components
- [ ] Set up monorepo structure with packages
- [ ] Configure ESLint, Prettier, and Husky hooks
- [ ] Create GitHub Actions CI/CD pipeline
- [ ] Set up Vercel deployment configuration

**Acceptance Criteria**:
- [ ] ✅ Application boots successfully on `npm run dev`
- [ ] ✅ CI pipeline runs lint, test, build without errors
- [ ] ✅ shadcn/ui components are installed and themed
- [ ] ✅ TypeScript strict mode enabled and configured
- [ ] ✅ Auto-deploy to staging on main branch push
- [ ] ✅ Development environment documented in README

**Dependencies**: None
**Blockers**: None

---

### T1.2: FHIR Upload & Parse Pathway
**Priority**: P0 | **Effort**: 5 days | **Sprint**: 1-2 | **Owner**: Backend Developer

**Description**:
Implement file upload system for FHIR Bundles with validation and basic resource counting.

**Tasks**:
- [ ] Create drag-and-drop file upload component
- [ ] Implement FHIR Bundle validation logic
- [ ] Add single resource detection and handling
- [ ] Create resource type counting and display
- [ ] Add file size limits and error handling
- [ ] Implement progress indicators for large files
- [ ] Add MIME type validation and security checks

**Acceptance Criteria**:
- [ ] ✅ Drag-drop interface accepts JSON files up to 10MB
- [ ] ✅ Detects Bundle vs individual Resource types
- [ ] ✅ Displays resource counts by type (Patient: 1, Observation: 45, etc.)
- [ ] ✅ Shows meaningful error messages for invalid files
- [ ] ✅ Handles malformed JSON gracefully
- [ ] ✅ File processing completes in <2s for 5MB bundles

**Dependencies**: T1.1 (Project scaffold)
**Blockers**: None

---

### T1.3: Sandbox FHIR Server Integration
**Priority**: P1 | **Effort**: 4 days | **Sprint**: 2 | **Owner**: Backend Developer

**Description**:
Implement read-only connection to FHIR servers for live patient data fetching.

**Tasks**:
- [ ] Create FHIR server connection interface
- [ ] Implement $everything endpoint integration
- [ ] Add server capability validation
- [ ] Create in-memory caching system
- [ ] Add connection error handling
- [ ] Implement server URL validation
- [ ] Add authentication support for SMART servers

**Acceptance Criteria**:
- [ ] ✅ UI form accepts server URL and patient ID
- [ ] ✅ Successfully fetches Bundle via Patient/$everything
- [ ] ✅ Caches responses in memory for session duration
- [ ] ✅ Validates server capabilities before fetching
- [ ] ✅ Displays helpful errors for connection failures
- [ ] ✅ Supports HAPI FHIR and SMART-enabled servers

**Dependencies**: T1.2 (Upload pathway for result processing)
**Blockers**: Access to test FHIR servers

---

## WS2 — Summarization Engine 🧠

### T2.1: Deterministic Resource Selection
**Priority**: P0 | **Effort**: 6 days | **Sprint**: 2-3 | **Owner**: Backend Developer + Clinical Advisor

**Description**:
Create algorithms to intelligently filter and select relevant clinical resources.

**Tasks**:
- [ ] Implement "recent labs" selection (last 2 years)
- [ ] Create "active medications" filtering logic
- [ ] Build "chronic conditions" identification
- [ ] Add unit normalization for lab values
- [ ] Create resource relevance scoring
- [ ] Implement date-based filtering utilities
- [ ] Add clinical code system lookups

**Acceptance Criteria**:
- [ ] ✅ Returns most recent lab values for each LOINC code
- [ ] ✅ Identifies active medications from MedicationRequest status
- [ ] ✅ Filters chronic conditions (diabetes, hypertension, etc.)
- [ ] ✅ Normalizes units (mg/dL vs mmol/L) with conversion factors
- [ ] ✅ Includes relevance scores for resource selection
- [ ] ✅ Handles missing or invalid dates gracefully

**Dependencies**: T1.2 (FHIR parsing infrastructure)
**Blockers**: Clinical validation of selection criteria

---

### T2.2: Persona Template System
**Priority**: P0 | **Effort**: 5 days | **Sprint**: 3 | **Owner**: AI/Prompt Engineer + UX Designer

**Description**:
Design and implement persona-specific prompt templates with section configuration.

**Tasks**:
- [ ] Create Patient persona template (plain language)
- [ ] Design Provider persona template (clinical terminology)
- [ ] Build Caregiver persona template (practical focus)
- [ ] Implement section manifest system
- [ ] Create template inheritance and overrides
- [ ] Add tone and terminology configuration
- [ ] Design template testing framework

**Acceptance Criteria**:
- [ ] ✅ Three distinct templates with different sections
- [ ] ✅ Patient template uses 8th-grade reading level
- [ ] ✅ Provider template includes clinical assessment sections
- [ ] ✅ Caregiver template focuses on practical care tasks
- [ ] ✅ Section manifests define what content appears when
- [ ] ✅ Templates can be A/B tested with different approaches

**Dependencies**: T2.1 (Resource selection for prompt content)
**Blockers**: Clinical review of template content

---

### T2.3: LLM Orchestration
**Priority**: P0 | **Effort**: 7 days | **Sprint**: 3-4 | **Owner**: AI/Backend Developer

**Description**:
Build robust Claude API integration with structured output parsing and error handling.

**Tasks**:
- [ ] Create Claude API client with authentication
- [ ] Implement structured JSON output parsing
- [ ] Add retry logic with exponential backoff
- [ ] Create prompt assembly pipeline
- [ ] Implement response validation and sanitization
- [ ] Add rate limiting and quota management
- [ ] Create summarization result caching

**Acceptance Criteria**:
- [ ] ✅ `/api/summarize` endpoint accepts normalized Bundle + persona
- [ ] ✅ Returns structured JSON with sections and claims
- [ ] ✅ Implements 3x retry with backoff for API failures
- [ ] ✅ Validates all LLM responses against expected schema
- [ ] ✅ Handles API rate limits gracefully
- [ ] ✅ Processes 5MB bundle in <6 seconds end-to-end

**Dependencies**: T2.1, T2.2 (Resource selection and templates)
**Blockers**: Claude API rate limits and access

---

## WS3 — Provenance & Explainability 🔍

### T3.1: Claim Schema & Provenance Chips
**Priority**: P0 | **Effort**: 4 days | **Sprint**: 4 | **Owner**: Frontend Developer

**Description**:
Implement the core provenance system linking every AI claim to source FHIR resources.

**Tasks**:
- [ ] Design Claim data structure with FHIR references
- [ ] Create ProvenanceChip React component
- [ ] Implement hover highlighting for source references
- [ ] Add keyboard accessibility for chip navigation
- [ ] Create chip styling variants (confidence levels)
- [ ] Implement click handling for detailed inspection
- [ ] Add batch chip rendering optimization

**Acceptance Criteria**:
- [ ] ✅ Every AI-generated sentence includes traceable references
- [ ] ✅ Hovering chip highlights corresponding source data
- [ ] ✅ Chips are keyboard accessible (tab navigation, enter/space)
- [ ] ✅ Visual distinction between high/medium/low confidence
- [ ] ✅ Chips render without performance impact (<50ms)
- [ ] ✅ Works correctly with screen readers

**Dependencies**: T2.3 (Structured LLM output with references)
**Blockers**: None

---

### T3.2: Right-Pane Resource Inspector
**Priority**: P0 | **Effort**: 5 days | **Sprint**: 4-5 | **Owner**: Frontend Developer

**Description**:
Build detailed resource inspection panel for FHIR data exploration.

**Tasks**:
- [ ] Create sliding right panel component
- [ ] Implement formatted FHIR resource display
- [ ] Add raw JSON view with syntax highlighting
- [ ] Create human-readable labels for codes
- [ ] Add date formatting and timezone handling
- [ ] Implement search and filtering within resources
- [ ] Add breadcrumb navigation for nested data

**Acceptance Criteria**:
- [ ] ✅ Clicking chip opens right panel with resource details
- [ ] ✅ Panel shows both formatted view and raw JSON
- [ ] ✅ Displays human-readable labels for medical codes
- [ ] ✅ Formats dates and times appropriately
- [ ] ✅ Panel is resizable and responsive on mobile
- [ ] ✅ Search functionality works within large resources

**Dependencies**: T3.1 (Provenance chip system)
**Blockers**: None

---

### T3.3: Uncertainty & Confidence Flagging
**Priority**: P1 | **Effort**: 3 days | **Sprint**: 5 | **Owner**: AI/Frontend Developer

**Description**:
Implement visual indicators for AI confidence levels and uncertainty.

**Tasks**:
- [ ] Design confidence scoring algorithm
- [ ] Create uncertainty badge component
- [ ] Implement tooltip explanations for low confidence
- [ ] Add visual indicators in summary text
- [ ] Create confidence threshold configuration
- [ ] Implement bulk confidence analysis
- [ ] Add confidence reporting dashboard

**Acceptance Criteria**:
- [ ] ✅ Claims below 80% confidence show uncertainty badge
- [ ] ✅ Tooltip explains why confidence is low
- [ ] ✅ Visual hierarchy clearly distinguishes confidence levels
- [ ] ✅ Confidence scores are calibrated against clinical validation
- [ ] ✅ Bulk analysis identifies summary quality issues
- [ ] ✅ Dashboard shows confidence distribution per persona

**Dependencies**: T2.3 (LLM output with confidence scores)
**Blockers**: Clinical validation data for calibration

---

## WS4 — Visualizations 📊

### T4.1: Labs & Vitals Time-Series Charts
**Priority**: P1 | **Effort**: 6 days | **Sprint**: 5-6 | **Owner**: Frontend Developer

**Description**:
Create interactive trend charts for laboratory values and vital signs.

**Tasks**:
- [ ] Implement Recharts time-series components
- [ ] Add reference range visualization (normal bands)
- [ ] Create out-of-range highlighting
- [ ] Implement interactive tooltips with provenance
- [ ] Add chart controls (zoom, pan, date range)
- [ ] Create multi-metric overlay capabilities
- [ ] Optimize performance for large datasets

**Acceptance Criteria**:
- [ ] ✅ Charts display HbA1c, LDL, BP trends over time
- [ ] ✅ Reference range bands clearly visible
- [ ] ✅ Out-of-range values highlighted in red/amber
- [ ] ✅ Tooltips show exact values, dates, and source links
- [ ] ✅ Charts render in <200ms after data load
- [ ] ✅ Responsive design works on mobile devices

**Dependencies**: T2.1 (Resource selection with lab values)
**Blockers**: Reference range data sources

---

### T4.2: Medication Timeline Visualization
**Priority**: P1 | **Effort**: 5 days | **Sprint**: 6 | **Owner**: Frontend Developer

**Description**:
Build Gantt-style medication timeline showing starts, stops, and changes.

**Tasks**:
- [ ] Create horizontal timeline component
- [ ] Implement medication bar rendering
- [ ] Add start/stop/change markers
- [ ] Highlight medication overlaps
- [ ] Create hover interactions for details
- [ ] Add medication grouping by class
- [ ] Implement timeline zoom and navigation

**Acceptance Criteria**:
- [ ] ✅ Timeline shows medication bars with duration
- [ ] ✅ Start/stop/change events clearly marked
- [ ] ✅ Overlapping medications highlighted for interaction review
- [ ] ✅ Hover shows medication details and dosage
- [ ] ✅ Timeline navigable across multiple years
- [ ] ✅ Medications can be grouped by therapeutic class

**Dependencies**: T2.1 (Medication resource processing)
**Blockers**: Medication classification data

---

### T4.3: "What to Review" Action Panel
**Priority**: P1 | **Effort**: 4 days | **Sprint**: 6-7 | **Owner**: Backend + Frontend Developer

**Description**:
Generate actionable clinical insights panel with prioritized review items.

**Tasks**:
- [ ] Implement clinical risk scoring algorithms
- [ ] Create action item prioritization logic
- [ ] Build interactive action panel component
- [ ] Add links to specific chart positions
- [ ] Create resource jump-to functionality
- [ ] Implement care gap detection
- [ ] Add customizable action item types

**Acceptance Criteria**:
- [ ] ✅ Panel shows top N priority items (5-10)
- [ ] ✅ Items link directly to relevant chart positions
- [ ] ✅ Clicking item jumps to specific resource/observation
- [ ] ✅ Risk scoring reflects clinical importance
- [ ] ✅ Care gaps identified from guideline rules
- [ ] ✅ Panel updates dynamically as data changes

**Dependencies**: T4.1, T4.2 (Chart components for linking)
**Blockers**: Clinical risk scoring validation

---

## WS5 — Sharing & Export 🔗

### T5.1: Secure Share Links
**Priority**: P2 | **Effort**: 4 days | **Sprint**: 7 | **Owner**: Backend Developer

**Description**:
Implement secure, time-limited sharing of patient summaries.

**Tasks**:
- [ ] Create signed token generation system
- [ ] Implement share link validation middleware
- [ ] Add 7-day expiration enforcement
- [ ] Create read-only summary view
- [ ] Add share link management dashboard
- [ ] Implement access logging and analytics
- [ ] Add link deactivation functionality

**Acceptance Criteria**:
- [ ] ✅ Generated URLs valid for exactly 7 days
- [ ] ✅ Server verifies token signatures before access
- [ ] ✅ Shared view is completely read-only
- [ ] ✅ All access attempts are logged with timestamps
- [ ] ✅ Links can be manually deactivated by creator
- [ ] ✅ Expired links show helpful error messages

**Dependencies**: None (independent feature)
**Blockers**: Security review and approval

---

### T5.2: PDF Export Functionality
**Priority**: P2 | **Effort**: 5 days | **Sprint**: 7-8 | **Owner**: Backend Developer

**Description**:
Generate high-quality PDF exports of patient summaries.

**Tasks**:
- [ ] Set up server-side PDF rendering (Puppeteer)
- [ ] Create PDF-optimized HTML templates
- [ ] Implement demo mode watermarking
- [ ] Add optional provenance appendix
- [ ] Create PDF styling and layout
- [ ] Add chart embedding in PDF
- [ ] Implement PDF generation queue

**Acceptance Criteria**:
- [ ] ✅ Server renders PDF from HTML with proper styling
- [ ] ✅ Demo mode shows "Not for clinical use" watermark
- [ ] ✅ Optional appendix includes provenance details
- [ ] ✅ Charts and visualizations included in PDF
- [ ] ✅ PDF generation completes in <10 seconds
- [ ] ✅ Generated PDFs are properly formatted and readable

**Dependencies**: Visualization components for chart embedding
**Blockers**: PDF rendering infrastructure setup

---

## WS6 — Evaluation & QA ✅

### T6.1: Golden Sample Test Suite
**Priority**: P0 | **Effort**: 6 days | **Sprint**: 8-9 | **Owner**: Clinical Advisor + QA Engineer

**Description**:
Create comprehensive test suite with clinical validation data.

**Tasks**:
- [ ] Curate 20+ synthetic patient bundles
- [ ] Generate clinician-reviewed "golden" summaries
- [ ] Create snapshot testing framework
- [ ] Add regression testing for summary changes
- [ ] Implement automated accuracy scoring
- [ ] Create test data management system
- [ ] Add edge case test scenarios

**Acceptance Criteria**:
- [ ] ✅ Test fixtures committed to repository
- [ ] ✅ Golden summaries reviewed by clinical experts
- [ ] ✅ Snapshot tests pass for all persona types
- [ ] ✅ Accuracy scoring compares AI vs golden summaries
- [ ] ✅ Test suite covers edge cases and error conditions
- [ ] ✅ Regression tests catch summary quality degradation

**Dependencies**: T2.3 (Working summarization engine)
**Blockers**: Clinical expert availability for reviews

---

### T6.2: Evaluator Harness & Metrics
**Priority**: P0 | **Effort**: 5 days | **Sprint**: 9 | **Owner**: Backend + QA Engineer

**Description**:
Build automated evaluation system for summary quality and performance.

**Tasks**:
- [ ] Create provenance coverage calculator
- [ ] Implement factual accuracy checklist
- [ ] Add performance timing measurements
- [ ] Create quality metrics dashboard
- [ ] Implement batch evaluation pipeline
- [ ] Add A/B testing framework
- [ ] Create evaluation reporting system

**Acceptance Criteria**:
- [ ] ✅ Reports % of claims with valid FHIR references
- [ ] ✅ Factuality checklist validates medical claims
- [ ] ✅ Time-to-summary measured for different bundle sizes
- [ ] ✅ Quality metrics tracked over time
- [ ] ✅ Batch evaluation runs on all test cases
- [ ] ✅ Dashboard shows quality trends and regressions

**Dependencies**: T6.1 (Golden samples for validation)
**Blockers**: None

---

### T6.3: End-to-End Test Automation
**Priority**: P0 | **Effort**: 4 days | **Sprint**: 9-10 | **Owner**: QA Engineer

**Description**:
Create comprehensive Playwright test suite for complete user workflows.

**Tasks**:
- [ ] Set up Playwright testing framework
- [ ] Create upload → summarize → toggle workflow
- [ ] Add provenance chip interaction tests
- [ ] Implement PDF export testing
- [ ] Create performance test scenarios
- [ ] Add cross-browser testing
- [ ] Create CI integration for E2E tests

**Acceptance Criteria**:
- [ ] ✅ Playwright tests cover complete user journey
- [ ] ✅ Upload, summarize, persona toggle flow automated
- [ ] ✅ Provenance chip opening and inspection tested
- [ ] ✅ PDF export download and validation automated
- [ ] ✅ Performance tests validate <6s summarization
- [ ] ✅ Tests run in CI on Chrome, Firefox, Safari

**Dependencies**: All major features (integration testing)
**Blockers**: Test environment stability

---

## Sprint Planning

### Sprint 1 (Weeks 1-2)
**Theme**: Foundation Setup
- T1.1: Project Scaffold ✅
- T1.2: FHIR Upload (partial) 🔄

### Sprint 2 (Weeks 3-4)
**Theme**: Data Processing
- T1.2: Complete FHIR Upload ✅
- T1.3: FHIR Server Integration ✅
- T2.1: Resource Selection (start) 🔄

### Sprint 3 (Weeks 5-6)
**Theme**: AI Integration
- T2.1: Complete Resource Selection ✅
- T2.2: Persona Templates ✅
- T2.3: LLM Orchestration (start) 🔄

### Sprint 4 (Weeks 7-8)
**Theme**: Provenance System
- T2.3: Complete LLM Orchestration ✅
- T3.1: Provenance Chips ✅
- T3.2: Resource Inspector (start) 🔄

### Sprint 5 (Weeks 9-10)
**Theme**: Visualization & UX
- T3.2: Complete Inspector ✅
- T3.3: Confidence Flagging ✅
- T4.1: Time-Series Charts (start) 🔄

### Sprint 6 (Weeks 11-12)
**Theme**: Polish & Testing
- T4.1: Complete Charts ✅
- T4.2: Medication Timeline ✅
- T6.1: Golden Samples (start) 🔄

---

## Risk Assessment

### High Risk Items
- **T2.3 LLM Orchestration**: Claude API reliability and rate limits
- **T6.1 Golden Samples**: Clinical expert availability
- **T4.3 Action Panel**: Complex clinical rule validation

### Medium Risk Items
- **T1.3 FHIR Server**: External server reliability
- **T5.2 PDF Export**: Server-side rendering complexity
- **T6.3 E2E Tests**: Test environment stability

### Mitigation Strategies
- **API Failures**: Implement robust retry logic and fallback responses
- **Clinical Review**: Schedule expert sessions early and create backup plans
- **External Dependencies**: Create mock servers for development/testing
- **Performance**: Start optimization early and measure continuously

---

## Definition of Done

Each task must meet these criteria before moving to "Done":

### Code Quality
- [ ] ✅ All code reviewed by at least one other developer
- [ ] ✅ Unit tests written and passing (>90% coverage)
- [ ] ✅ TypeScript types properly defined
- [ ] ✅ No ESLint errors or warnings
- [ ] ✅ Performance requirements validated

### Functional Quality
- [ ] ✅ All acceptance criteria verified
- [ ] ✅ Manual testing completed by assignee
- [ ] ✅ Edge cases and error conditions handled
- [ ] ✅ Accessibility guidelines followed (WCAG AA)
- [ ] ✅ Mobile responsive design verified

### Documentation
- [ ] ✅ API documentation updated (if applicable)
- [ ] ✅ Component documentation in Storybook
- [ ] ✅ README updated with new functionality
- [ ] ✅ Architecture decisions recorded in ADRs

### Deployment
- [ ] ✅ Feature deployed to staging environment
- [ ] ✅ Stakeholder approval obtained
- [ ] ✅ Production deployment completed
- [ ] ✅ Monitoring and alerting configured