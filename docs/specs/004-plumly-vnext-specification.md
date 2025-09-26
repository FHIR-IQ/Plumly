# Specification 004: Plumly vNext - Comprehensive FHIR Summarization Platform

**Status**: Draft
**Version**: 1.0.0
**Date**: 2025-01-26
**Authors**: Development Team
**Reviewers**: TBD

## Executive Summary

Plumly vNext is a web application that transforms FHIR Bundles (US Core R4-aligned) into audience-specific clinical summaries with strong provenance, visual insights, and actionable highlights. The system serves three primary personas (Patient, Provider, Caregiver) with tailored content, tone, and emphasis while maintaining clinical safety and explainability as core principles.

## 1. Overview

### 1.1 Project Vision
Build a comprehensive FHIR summarization platform that enables rapid clinical comprehension while maintaining complete transparency about data sources and AI reasoning processes.

### 1.2 Core Principles (from Project Constitution)
- **Clinical Safety First**: Every statement traceable to source FHIR resources
- **Privacy by Default**: Synthetic data for demos, encryption for PHI
- **Explainability**: Clear provenance for all AI-generated content
- **Audience-Aware**: Persona-specific rendering and language
- **Progressive Disclosure**: Structured information hierarchy
- **Performance**: Sub-6s summaries, sub-200ms visualizations

## 2. Goals and Requirements

### 2.1 Primary Goals (Ranked by Priority)

#### Goal 1: Persona Toggle System
**Priority**: P0 (Critical)
- **Requirement**: Three distinct personas with same data, different presentation
- **Patient View**: Plain language, explanatory tone, "what it means" focus
- **Provider View**: Clinical terminology, situation awareness, safety flags
- **Caregiver View**: Practical context, tasks, appointment preparation
- **Acceptance Criteria**:
  - Single toggle switches between all three views instantly
  - Content adapts appropriately for vocabulary, tone, and emphasis
  - All views maintain same underlying data integrity

#### Goal 2: Actionable Highlights Panel
**Priority**: P0 (Critical)
- **Requirement**: "What to review" panel surfacing clinical risks
- **Risk Categories**:
  - Out-of-range laboratory values
  - Drug-drug interactions
  - Drug-condition contraindications
  - Missed screening opportunities (care gaps)
- **Acceptance Criteria**:
  - Highlights appear within 6 seconds of bundle processing
  - Each highlight links to specific FHIR resources
  - False positive rate <5% on synthetic test cases

#### Goal 3: Visual Insight Charts
**Priority**: P1 (High)
- **Requirement**: Interactive charts for trends and timelines
- **Chart Types**:
  - Lab/Vitals trends (HbA1c, LDL, BP, BMI)
  - Medication timeline (start/stop/changes)
  - Encounter frequency visualization
- **Acceptance Criteria**:
  - Charts render in <200ms after data parsing
  - Interactive tooltips show exact values and dates
  - Responsive design for mobile and desktop

#### Goal 4: Provenance & Auditability
**Priority**: P0 (Critical)
- **Requirement**: Inline "source chips" linking claims to FHIR entries
- **Implementation**: Every AI-generated sentence includes clickable chips
- **Resource Types**: Observation, MedicationStatement, Condition, Encounter
- **Acceptance Criteria**:
  - >95% of summary sentences have provenance chips
  - Chips open detailed resource view with original FHIR data
  - Confidence markers for uncertain or low-quality inferences

#### Goal 5: Reasoning Trail Explanation
**Priority**: P1 (High)
- **Requirement**: Expandable "reasoning trail" for AI transparency
- **Components**:
  - Prompt engineering steps used
  - Resource selection and filtering logic
  - Confidence scoring methodology
- **Acceptance Criteria**:
  - Available for every AI-generated section
  - Technical details appropriate for clinical users
  - Performance impact <100ms per explanation

#### Goal 6: Sharing & Export Capabilities
**Priority**: P2 (Medium)
- **Requirement**: Secure sharing and export functionality
- **Features**:
  - Read-only secure links with expiration
  - PDF export with formatting preservation
  - Identifier redaction in demo mode
- **Acceptance Criteria**:
  - Links expire within configurable timeframe
  - PDF maintains visual fidelity
  - No PHI leakage in shared content

#### Goal 7: FHIR Connectivity
**Priority**: P2 (Medium)
- **Requirement**: Live FHIR server integration beyond file upload
- **Capabilities**:
  - Connect to sandbox FHIR servers (HAPI/SMART)
  - Patient ID-based fetching
  - Real-time bundle retrieval
- **Acceptance Criteria**:
  - Support for standard FHIR endpoints
  - OAuth 2.0 authentication where required
  - Graceful handling of connection failures

#### Goal 8: Multi-Patient Demo Dashboard
**Priority**: P3 (Low)
- **Requirement**: Investor demonstration capabilities
- **Features**:
  - Panel of 10 synthetic patients
  - Risk-based sorting and filtering
  - Quick patient switching
- **Acceptance Criteria**:
  - Dashboard loads in <3 seconds
  - Risk stratification algorithms clearly documented
  - Compelling "wow" moments for demonstrations

### 2.2 Out-of-Scope Items
- Prescriptive clinical recommendations or CDS hooks
- Write-back capabilities to EHR systems
- Storage or processing of real PHI
- Integration with specific EHR vendors
- Mobile native applications (web-responsive only)

## 3. User Personas and Stories

### 3.1 Primary User Personas

#### Provider Persona
**Context**: Busy clinician needing rapid situational awareness
**Needs**:
- Fast comprehension of patient status
- Safety flag identification
- Source data verification
- Clinical decision support preparation

**Key User Stories**:
- "As a provider, I can upload a patient bundle and immediately see a 5-line summary with the most critical information"
- "As a provider, I can identify safety concerns within 60 seconds of opening a patient record"
- "As a provider, I can trace every AI-generated statement back to its source FHIR resource"

#### Patient Persona
**Context**: Individual seeking to understand their own health data
**Needs**:
- Plain-language explanations
- Context for medical terminology
- Actionable next steps
- Trend visualization

**Key User Stories**:
- "As a patient, I can understand what my test results mean in everyday language"
- "As a patient, I can see how my health metrics have changed over time"
- "As a patient, I can prepare questions to ask my doctor based on my health summary"

#### Caregiver Persona
**Context**: Family member or professional caregiver
**Needs**:
- Practical care information
- Medication management
- Appointment preparation
- Health maintenance tasks

**Key User Stories**:
- "As a caregiver, I can understand medication schedules and potential interactions"
- "As a caregiver, I can prepare for medical appointments with relevant questions"
- "As a caregiver, I can identify when health metrics require attention"

## 4. Technical Requirements

### 4.1 Performance Requirements
- **Summary Generation**: <6 seconds P95 for 7MB bundles (cold run)
- **Chart Rendering**: <200ms after data parsing complete
- **UI Responsiveness**: <100ms for persona switching
- **Dashboard Loading**: <3 seconds for multi-patient view
- **Memory Usage**: <512MB for typical bundle processing

### 4.2 Quality Requirements
- **Provenance Coverage**: >95% of statements with source attribution
- **Accuracy Agreement**: ≥90% clinician approval on synthetic cases
- **Error Handling**: Zero hard crashes on malformed bundles
- **Confidence Marking**: Low-confidence statements clearly flagged
- **Data Integrity**: Perfect preservation of source FHIR data

### 4.3 Security Requirements
- **Data in Transit**: TLS 1.3 encryption required
- **Synthetic Data**: Clearly marked and separated from PHI workflows
- **Access Logging**: Complete audit trail for all data access
- **Link Security**: Secure, time-limited sharing tokens
- **Identifier Redaction**: Automated scrubbing in demo mode

### 4.4 Compatibility Requirements
- **FHIR Standard**: US Core R4 compliance preferred
- **Browser Support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Mobile Responsive**: Functional on tablets and phones
- **FHIR Server**: Compatible with HAPI FHIR and SMART-enabled endpoints
- **File Formats**: JSON FHIR bundles up to 10MB

## 5. System Architecture

### 5.1 High-Level Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Engine     │
│   React/Next.js │◄──►│   API Gateway   │◄──►│   Claude API    │
│   - Persona UI  │    │   - Processing  │    │   - Summary     │
│   - Charts      │    │   - Validation  │    │   - Analysis    │
│   - Provenance  │    │   - Storage     │    │   - Provenance  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FHIR Validator│    │   Data Storage  │    │   External APIs │
│   - Bundle Check│    │   - Processed   │    │   - FHIR Servers│
│   - Resource    │    │   - Cache       │    │   - Drug DBs    │
│   - Validation  │    │   - Session     │    │   - Guidelines  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 5.2 Data Flow Architecture
1. **Input**: FHIR Bundle (file upload or server fetch)
2. **Validation**: US Core R4 compliance checking
3. **Processing**: Resource extraction and normalization
4. **Analysis**: AI-powered summarization with provenance tracking
5. **Rendering**: Persona-specific presentation layer
6. **Output**: Interactive summary with visual components

## 6. Success Metrics

### 6.1 Primary Success Metrics
- **Time-to-Comprehension**: Provider identifies top 3 facts in <60s
- **Clinical Accuracy**: ≥90% statement approval by clinician reviewers
- **User Engagement**: Persona switching used in >50% of sessions
- **Performance**: 95th percentile response times meet targets
- **Error Rate**: <1% of sessions result in system errors

### 6.2 Demo Success Metrics
- **Investor Engagement**: 3+ "wow" moments per demo session
- **Feature Discovery**: Users explore >4 features per session
- **Comprehension**: Non-technical users understand summaries
- **Technical Interest**: Developers explore provenance features
- **Business Value**: Clear ROI proposition demonstrated

## 7. Implementation Phases

### 7.1 Phase 1: Core Platform (MVP)
**Duration**: 6-8 weeks
**Deliverables**:
- Basic persona toggle functionality
- File upload and processing pipeline
- Simple summary generation with provenance
- Essential performance optimizations

### 7.2 Phase 2: Enhanced Features
**Duration**: 4-6 weeks
**Deliverables**:
- Actionable highlights panel
- Visual insight charts
- Reasoning trail explanation
- Advanced provenance features

### 7.3 Phase 3: Advanced Capabilities
**Duration**: 4-6 weeks
**Deliverables**:
- Sharing and export functionality
- FHIR server connectivity
- Multi-patient dashboard
- Demo optimization features

## 8. Risk Assessment

### 8.1 Technical Risks
- **AI Model Performance**: Potential accuracy or speed issues
  - *Mitigation*: Extensive testing with synthetic data, fallback strategies
- **FHIR Complexity**: Variability in real-world implementations
  - *Mitigation*: Robust validation, graceful degradation patterns
- **Performance Scaling**: Large bundle processing challenges
  - *Mitigation*: Progressive loading, chunked processing, caching

### 8.2 Business Risks
- **Regulatory Concerns**: Unclear clinical decision support boundaries
  - *Mitigation*: Clear disclaimers, informational-only language
- **Market Readiness**: Provider adoption challenges
  - *Mitigation*: Extensive user testing, iterative improvement
- **Competition**: Established EHR vendor solutions
  - *Mitigation*: Focus on interoperability, superior UX

## 9. Testing Strategy

### 9.1 Test Categories
- **Unit Tests**: Individual component functionality
- **Integration Tests**: FHIR processing pipeline
- **Performance Tests**: Load testing with large bundles
- **Accuracy Tests**: Clinical reviewer validation
- **Usability Tests**: Persona-specific user experience
- **Security Tests**: Data handling and privacy protection

### 9.2 Test Data Requirements
- **Synthetic Patients**: 50+ diverse test cases
- **Edge Cases**: Malformed bundles, missing data
- **Performance Cases**: 1MB, 5MB, 10MB bundle sizes
- **Clinical Scenarios**: Common conditions and medications
- **Error Conditions**: Network failures, API timeouts

## 10. Definition of Done

Each feature delivery must include:
- **Specification Excerpt**: Relevant portion of this document
- **Acceptance Tests**: Automated verification of requirements
- **Provenance UI**: User interface for data source transparency
- **Evaluator Harness**: Metrics for accuracy and coverage
- **Performance Benchmarks**: Quantified speed measurements
- **Security Review**: Privacy and data handling verification

## 11. Appendices

### 11.1 FHIR Resource Priorities
**Critical Resources** (MVP):
- Patient, Observation, Condition, MedicationStatement, Encounter

**Important Resources** (Phase 2):
- DiagnosticReport, Procedure, AllergyIntolerance, Immunization

**Optional Resources** (Phase 3):
- CarePlan, Goal, DocumentReference, Media

### 11.2 Clinical Highlight Rules
**Lab Value Ranges**: Standard reference ranges with age/gender adjustments
**Drug Interactions**: Major interaction databases (e.g., RxNorm)
**Care Gaps**: USPSTF guidelines and quality measures
**Risk Stratification**: Evidence-based clinical algorithms

### 11.3 Performance Benchmarking
**Test Environment**: Cloud-hosted, representative of production
**Measurement Tools**: APM integration, custom metrics collection
**Baseline Data**: Current system performance for comparison
**Target SLAs**: Specific numeric thresholds for each metric

---

**Document Control**
- **Next Review**: 2025-02-15
- **Approval Required**: Technical Lead, Product Owner, Clinical Advisor
- **Related Documents**: Project Constitution, ADR-001 Technology Stack
- **Version History**: Track major changes and decision rationale