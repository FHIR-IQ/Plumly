# ADR-002: Prompt Template Architecture

**Status:** Accepted
**Date:** 2024-01-23
**Authors:** Claude Code AI
**Reviewers:** TBD

## Context

The Plumly application needs a flexible prompt template system that can generate different types of summaries for various healthcare audiences (patients, providers, payers) while maintaining clinical accuracy and allowing for customization.

## Decision

We will implement a structured prompt template system with the following characteristics:

### Template Structure
- **Pre-built Templates:** Curated templates for common use cases
- **Audience-Specific:** Separate templates for patient, provider, and payer audiences
- **Configurable Parameters:** Focus areas, recommendations, and output format options
- **Template Inheritance:** Base template patterns with audience-specific overrides

### Template Management
- **In-Memory Storage:** Templates stored in application code for POC
- **Runtime Customization:** Users can modify focus areas and options
- **Template Validation:** Ensure templates produce valid outputs
- **Version Control:** Template changes tracked in code repository

### Prompt Engineering Strategy
- **Structured Prompts:** Clear sections with specific instructions
- **Context Injection:** Dynamic patient data integration
- **Output Format Control:** Specify narrative, structured, or FHIR formats
- **Safety Guidelines:** Built-in safeguards for healthcare content

## Implementation Details

### Template Schema
```typescript
interface PromptTemplate {
  id: string
  name: string
  description: string
  targetAudience: 'patient' | 'provider' | 'payer'
  outputFormat: 'narrative' | 'structured' | 'composition'
  template: string
}
```

### Core Templates

#### Patient-Friendly Template
- **Focus:** Simple language, avoid medical jargon
- **Sections:** Current health, conditions, medications, next steps
- **Tone:** Encouraging and informative
- **Format:** Narrative with clear headings

#### Provider Clinical Template
- **Focus:** Medical terminology, clinical details
- **Sections:** Chief complaints, active conditions, medications, diagnostics, care plan
- **Tone:** Professional and comprehensive
- **Format:** Structured with clinical formatting

#### Payer Utilization Template
- **Focus:** Cost-effectiveness, quality metrics
- **Sections:** High-cost conditions, utilization patterns, preventive care, risk stratification
- **Tone:** Analytical and data-driven
- **Format:** Structured with metrics and bullet points

### Dynamic Prompt Building
```typescript
class PromptBuilder {
  buildPrompt(template: PromptTemplate, patientData: PatientData, options: SummarizationOptions): string
  injectPatientData(template: string, data: PatientData): string
  applyCustomizations(prompt: string, options: SummarizationOptions): string
}
```

## Rationale

### Template-Based Approach
- **Consistency:** Ensures reliable output quality across different use cases
- **Maintainability:** Centralized prompt management and version control
- **Customization:** Allows users to focus on specific areas of interest
- **Scalability:** Easy to add new templates for additional use cases

### Audience Segmentation
- **Patient Templates:** Prioritize comprehension and actionability
- **Provider Templates:** Focus on clinical accuracy and completeness
- **Payer Templates:** Emphasize utilization patterns and cost considerations

### In-Memory Storage Decision
- **POC Simplicity:** Reduces infrastructure complexity for demonstration
- **Performance:** Eliminates database queries for template retrieval
- **Version Control:** Templates are code-managed and reviewable
- **Migration Path:** Easy to move to database storage for production

### Structured Prompt Engineering
- **Predictable Outputs:** Well-defined sections improve AI response quality
- **Context Preservation:** Clear instructions help maintain clinical accuracy
- **Format Control:** Explicit output format specifications
- **Safety Measures:** Built-in guidelines prevent inappropriate medical advice

## Alternatives Considered

### Database-Stored Templates
- **Pros:** Dynamic template creation, user-specific customization
- **Cons:** Additional infrastructure, complexity for POC
- **Decision:** Rejected in favor of code-based templates for simplicity

### Single Universal Template
- **Pros:** Simpler implementation, single prompt to maintain
- **Cons:** Difficulty optimizing for different audiences, reduced effectiveness
- **Decision:** Rejected due to conflicting audience requirements

### External Template Service
- **Pros:** Shared templates across applications, professional curation
- **Cons:** External dependency, additional complexity, cost
- **Decision:** Rejected for POC scope and independence requirements

### AI-Generated Templates
- **Pros:** Dynamic template creation, self-improving system
- **Cons:** Unpredictable quality, safety concerns, complexity
- **Decision:** Rejected due to safety and reliability requirements

## Implementation Plan

### Phase 1: Core Templates
- Implement base template structure and schema
- Create initial templates for three audiences
- Build prompt builder with basic customization

### Phase 2: Enhanced Customization
- Add focus area specification
- Implement recommendation inclusion/exclusion
- Support custom instructions injection

### Phase 3: Template Management
- Build template CRUD API endpoints
- Add template validation and testing
- Implement template versioning

### Phase 4: Advanced Features
- Template performance analytics
- A/B testing framework for template optimization
- User feedback integration

## Template Examples

### Patient Template Structure
```
You are a healthcare AI assistant creating a patient-friendly summary.

Instructions:
- Use simple, easy-to-understand language
- Avoid medical jargon when possible
- Focus on actionable information
- Be encouraging and supportive

Patient Data:
{PATIENT_DEMOGRAPHICS}
{CONDITIONS_SUMMARY}
{MEDICATIONS_LIST}
{RECENT_OBSERVATIONS}

Please provide a comprehensive but understandable summary.
```

### Provider Template Structure
```
You are a clinical AI assistant creating a provider summary.

Instructions:
- Use appropriate medical terminology
- Include relevant clinical details
- Focus on diagnostic and treatment information
- Provide actionable clinical recommendations

Clinical Data:
{PATIENT_DEMOGRAPHICS}
{ACTIVE_CONDITIONS}
{CURRENT_MEDICATIONS}
{DIAGNOSTIC_RESULTS}
{ENCOUNTERS_HISTORY}

Generate a structured clinical summary.
```

## Consequences

### Positive
- **Quality Control:** Curated templates ensure consistent output quality
- **User Experience:** Audience-specific templates improve relevance
- **Maintainability:** Centralized template management
- **Performance:** In-memory storage provides fast template access
- **Safety:** Structured prompts reduce risk of inappropriate outputs

### Negative
- **Rigidity:** Fixed templates may not cover all edge cases
- **Maintenance Overhead:** Templates require ongoing curation and updates
- **Limited Customization:** Users cannot create completely custom templates
- **Code Coupling:** Template changes require code deployment

### Mitigation Strategies
- **Template Flexibility:** Support for custom focus areas and instructions
- **Feedback Loop:** Collect user feedback for template improvements
- **Gradual Enhancement:** Iterative template refinement based on usage
- **Migration Path:** Design for future database-backed template storage

## Monitoring and Success Metrics

### Template Effectiveness
- **User Satisfaction:** Ratings for generated summaries by audience type
- **Clinical Accuracy:** Review by healthcare professionals
- **Completion Rate:** Percentage of successful summary generations
- **Error Rate:** Frequency of template-related failures

### Performance Metrics
- **Response Time:** Template processing and prompt generation speed
- **Memory Usage:** Template storage and processing overhead
- **Cache Hit Rate:** Template retrieval performance

### Usage Analytics
- **Template Popularity:** Most frequently used templates by audience
- **Customization Patterns:** Common focus areas and options
- **Error Patterns:** Most common template-related issues

## Review and Evolution

### Regular Review Cycle
- **Weekly:** Monitor template performance and user feedback
- **Monthly:** Analyze usage patterns and effectiveness metrics
- **Quarterly:** Review template architecture and consider enhancements

### Evolution Triggers
- **Performance Issues:** If template processing becomes bottleneck
- **User Feedback:** Requests for new template types or modifications
- **Clinical Review:** Healthcare professional recommendations
- **Scale Requirements:** Need for user-generated or dynamic templates

## References

- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Healthcare AI Ethics Guidelines](https://www.who.int/publications/i/item/ethics-and-governance-of-artificial-intelligence-for-health)
- [FHIR Implementation Guide](https://hl7.org/fhir/R4/implementation.html)
- [Clinical Decision Support Systems](https://www.himss.org/resources/clinical-decision-support)

---

**Last Updated:** 2024-01-23
**Next Review:** 2024-02-06