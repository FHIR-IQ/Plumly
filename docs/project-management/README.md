# Plumly vNext Project Management

This directory contains all project management artifacts for the Plumly vNext development initiative - a comprehensive FHIR summarization platform with multi-persona support and strong provenance tracking.

## Overview

**Project Duration**: 12 weeks (6 sprints of 2 weeks each)
**Total Tasks**: 18 tasks across 6 workstreams
**Estimated Effort**: 82 developer days
**Team Size**: 4-6 developers
**Success Metrics**: <6s summary generation, >95% provenance coverage, >90% clinical accuracy

## Files in this Directory

### Task Management Artifacts
- **[TASK_BOARD.md](TASK_BOARD.md)** - Human-readable task board with full specifications
- **[kanban-board.json](kanban-board.json)** - Machine-readable Kanban board data
- **[github-issues.yml](github-issues.yml)** - GitHub Issues import format
- **[linear-import.csv](linear-import.csv)** - Linear project management import

### Process Documentation
- **[README.md](README.md)** - This file with runbooks and procedures
- **[sprint-templates/](sprint-templates/)** - Sprint planning templates
- **[reporting/](reporting/)** - Progress tracking and metrics

## Workstreams Overview

### 🏗️ WS1: Foundations (3 tasks, 12 days)
Core infrastructure, FHIR processing, and development environment setup.

**Critical Path Tasks**:
- T1.1: Next.js 14 scaffold with CI/CD
- T1.2: FHIR upload and parsing
- T1.3: FHIR server integration

### 🧠 WS2: Summarization Engine (3 tasks, 18 days)
AI-powered summarization with persona templates and Claude API integration.

**Critical Path Tasks**:
- T2.1: Resource selection algorithms
- T2.2: Persona template system
- T2.3: LLM orchestration

### 🔍 WS3: Provenance & Explainability (3 tasks, 12 days)
Complete traceability system linking AI outputs to source data.

**Key Features**:
- Interactive provenance chips
- Resource inspection panels
- Confidence scoring and uncertainty flagging

### 📊 WS4: Visualizations (3 tasks, 15 days)
Interactive charts for clinical data and actionable insights.

**Deliverables**:
- Time-series charts for labs and vitals
- Medication timeline visualization
- "What to review" action panel

### 🔗 WS5: Sharing & Export (2 tasks, 9 days)
Secure sharing and PDF export capabilities.

**Security Focus**:
- Time-limited secure links (7-day expiration)
- Watermarked PDF exports for demo mode

### ✅ WS6: Evaluation & QA (3 tasks, 15 days)
Comprehensive testing and quality assurance framework.

**Quality Gates**:
- Clinical accuracy validation
- Performance benchmarking
- End-to-end test automation

---

# Development Runbooks

## Sprint Planning Runbook

### Pre-Sprint Planning (1 week before)

#### 1. Stakeholder Preparation
- [ ] **Product Owner**: Review and prioritize backlog items
- [ ] **Clinical Advisor**: Validate medical accuracy requirements
- [ ] **Technical Lead**: Assess technical feasibility and dependencies
- [ ] **Team**: Review previous sprint retrospective actions

#### 2. Capacity Planning
```bash
# Calculate team capacity for upcoming sprint
SPRINT_DAYS=10  # 2 weeks = 10 working days
TEAM_SIZE=5
CAPACITY_FACTOR=0.8  # Account for meetings, code review, etc.

TOTAL_CAPACITY=$((SPRINT_DAYS * TEAM_SIZE * CAPACITY_FACTOR))
echo "Sprint capacity: $TOTAL_CAPACITY developer days"
```

#### 3. Dependency Review
- [ ] Check external blockers (FHIR server access, Claude API limits)
- [ ] Validate clinical review availability for templates/golden samples
- [ ] Confirm infrastructure readiness (CI/CD, testing environments)

### Sprint Planning Meeting (4 hours)

#### Part 1: Sprint Goal Definition (1 hour)
- **Objective**: Define clear, measurable sprint goals
- **Outcome**: 1-2 sentence sprint goal statement
- **Example**: "Complete FHIR processing foundation and begin AI summarization engine development"

#### Part 2: Backlog Refinement (1.5 hours)
- **Review Task Priorities**: Validate P0/P1/P2 classifications
- **Break Down Large Tasks**: Split any task >5 days into smaller chunks
- **Update Acceptance Criteria**: Ensure all criteria are testable
- **Estimate Effort**: Use planning poker for relative sizing

#### Part 3: Sprint Commitment (1.5 hours)
- **Select Sprint Tasks**: Based on team capacity and priorities
- **Assign Initial Owners**: Not final assignments, just planning
- **Identify Sprint Risks**: Document potential blockers
- **Define Done Criteria**: Confirm Definition of Done for each task

### Daily Sprint Management

#### Daily Standup Format (15 minutes max)
```
For each team member:
1. What did you complete yesterday?
2. What will you work on today?
3. What blockers do you have?

For the Scrum Master:
4. Sprint burn-down status
5. Blocker resolution updates
6. Upcoming sprint events
```

#### Sprint Metrics Tracking
```bash
# Daily metrics calculation
COMPLETED_TASKS=$(grep -c "status.*done" kanban-board.json)
TOTAL_TASKS=$(jq '.tasks | length' kanban-board.json)
SPRINT_PROGRESS=$((COMPLETED_TASKS * 100 / TOTAL_TASKS))

echo "Sprint Progress: $SPRINT_PROGRESS% ($COMPLETED_TASKS/$TOTAL_TASKS tasks)"
```

### Sprint Review & Retrospective

#### Sprint Review (2 hours)
- **Demo Preparation**: 30 minutes for demo setup
- **Stakeholder Demo**: 60 minutes showing completed features
- **Feedback Collection**: 30 minutes for stakeholder input

#### Sprint Retrospective (1.5 hours)
- **What Went Well**: Celebrate successes and good practices
- **What Could Improve**: Identify bottlenecks and friction points
- **Action Items**: 1-3 concrete improvements for next sprint

---

## Task Management Runbook

### Task Creation Process

#### 1. Task Definition Template
```yaml
title: "[WS#.#] Task Name"
workstream: "WS# - Workstream Name"
priority: "P0|P1|P2"
effort: "X days"
sprint: "Sprint number"
owner: "Role (not person initially)"

description: |
  Clear, concise description of what needs to be accomplished

acceptance_criteria:
  - Specific, testable criteria
  - Performance requirements where applicable
  - User experience requirements

tasks:
  - Concrete implementation steps
  - Technical requirements
  - Testing requirements

dependencies: ["T#.#", "T#.#"]
blockers: ["Description of external blockers"]
tags: ["category", "technology", "feature"]
```

#### 2. Task Validation Checklist
- [ ] **SMART Criteria**: Specific, Measurable, Achievable, Relevant, Time-bound
- [ ] **Acceptance Criteria**: All criteria are independently testable
- [ ] **Dependencies**: All prerequisite tasks identified
- [ ] **Effort Estimation**: Realistic timeline with buffer for unknowns
- [ ] **Owner Assignment**: Clear role responsibility defined

### Task Lifecycle Management

#### States and Transitions
```
TODO → IN PROGRESS → REVIEW → DONE
  ↑        ↓           ↓       ↓
  ←────────────────────────────┘
           (BLOCKED)
```

#### State Definitions
- **TODO**: Task is ready to start, all dependencies met
- **IN PROGRESS**: Active development, assigned developer working
- **REVIEW**: Code complete, undergoing peer review
- **DONE**: All acceptance criteria met, merged to main
- **BLOCKED**: Cannot progress due to external dependency

#### Daily Task Updates
```bash
# Update task status
./scripts/update-task.sh T2.1 "in_progress" "Backend Developer"

# Check for blockers
./scripts/check-blockers.sh

# Generate daily report
./scripts/daily-report.sh
```

### Quality Gates

#### Pre-Development Checklist
- [ ] All acceptance criteria clearly defined
- [ ] Technical approach reviewed by senior developer
- [ ] UI/UX mockups approved (for frontend tasks)
- [ ] Clinical requirements validated (for medical tasks)
- [ ] Performance requirements specified

#### Code Review Checklist
- [ ] **Functionality**: All acceptance criteria demonstrated
- [ ] **Code Quality**: Follows project conventions and standards
- [ ] **Testing**: Unit tests written and passing (>90% coverage)
- [ ] **Performance**: Meets specified performance requirements
- [ ] **Security**: No security vulnerabilities introduced
- [ ] **Documentation**: Code documented, API docs updated

#### Definition of Done Validation
- [ ] **Feature Complete**: All acceptance criteria met
- [ ] **Tests Pass**: Unit, integration, and E2E tests passing
- [ ] **Code Reviewed**: Peer review completed and approved
- [ ] **Documentation Updated**: README, API docs, and ADRs current
- [ ] **Deployed**: Successfully deployed to staging environment
- [ ] **Stakeholder Approved**: Product owner sign-off completed

---

## Risk Management Runbook

### Risk Categories and Mitigation

#### High-Risk Items

##### T2.3 LLM Orchestration
**Risk**: Claude API reliability and rate limits could block development
**Impact**: High (critical path item)
**Probability**: Medium
**Mitigation**:
```bash
# Implement robust retry logic
MAX_RETRIES=3
BACKOFF_FACTOR=2
RATE_LIMIT_BUFFER=20  # Stay 20% below API limits

# Create fallback responses
FALLBACK_ENABLED=true
MOCK_MODE_AVAILABLE=true
```

##### T6.1 Golden Sample Creation
**Risk**: Clinical expert availability for review and validation
**Impact**: High (quality validation)
**Probability**: Medium
**Mitigation**:
- Schedule clinical review sessions 2 sprints in advance
- Create interim validation with medical literature
- Develop automated consistency checking tools

##### T4.3 Action Panel Clinical Rules
**Risk**: Complex clinical rule validation and accuracy
**Impact**: Medium (affects clinical utility)
**Probability**: Medium
**Mitigation**:
- Start with simple, well-established rules (e.g., out-of-range labs)
- Implement rule configuration system for easy updates
- Create rule testing framework with known cases

#### Medium-Risk Items

##### External FHIR Server Dependencies
**Risk**: Test server availability and reliability
**Impact**: Medium (affects development velocity)
**Probability**: Low
**Mitigation**:
- Set up local HAPI FHIR server for development
- Create comprehensive mock server with edge cases
- Document fallback procedures for server outages

##### Performance Optimization Complexity
**Risk**: Meeting <6s/<200ms performance requirements
**Impact**: Medium (user experience)
**Probability**: Medium
**Mitigation**:
- Start performance optimization early (Sprint 2)
- Implement performance monitoring from day 1
- Create performance regression testing

### Risk Monitoring

#### Weekly Risk Review
```bash
# Risk assessment script
./scripts/assess-risks.sh

# Key metrics to monitor
echo "Current risks status:"
echo "- API rate limit usage: $(curl -s api.claude.ai/usage)"
echo "- Average processing time: $(./scripts/perf-metrics.sh)"
echo "- Test coverage: $(npm run test:coverage | grep -o '[0-9]*%')"
echo "- Clinical review backlog: $(./scripts/clinical-backlog.sh)"
```

#### Escalation Procedures
- **Low Impact**: Team handles internally, document in next retrospective
- **Medium Impact**: Notify product owner, adjust sprint plan if needed
- **High Impact**: Immediate escalation to project stakeholders, risk mitigation meeting within 24 hours

---

## Quality Assurance Runbook

### Testing Strategy

#### Test Pyramid Implementation
```bash
# Run test suite at different levels
npm run test:unit          # 70% - Fast, isolated tests
npm run test:integration   # 20% - API and service tests
npm run test:e2e          # 10% - Full user workflow tests
```

#### Performance Testing
```bash
# Bundle processing performance
./scripts/perf-test.sh --bundle-size 5MB --target-time 6s

# Chart rendering performance
./scripts/chart-perf-test.sh --target-time 200ms

# Load testing
./scripts/load-test.sh --concurrent-users 10 --duration 5m
```

#### Clinical Accuracy Validation
```bash
# Golden sample comparison
./scripts/accuracy-test.sh --golden-samples fixtures/golden/ --threshold 0.9

# Provenance coverage check
./scripts/provenance-check.sh --min-coverage 0.95

# Clinical safety validation
./scripts/safety-check.sh --validate-claims --check-uncertainty
```

### Continuous Integration

#### GitHub Actions Pipeline
```yaml
# .github/workflows/ci.yml (key steps)
- name: Run Tests
  run: npm run test:ci

- name: Check Performance
  run: npm run test:performance

- name: Validate Clinical Accuracy
  run: npm run test:clinical

- name: Deploy to Staging
  if: branch == 'main'
  run: ./scripts/deploy-staging.sh
```

#### Quality Gates
- **All tests must pass**: No exceptions for merging to main
- **Performance requirements**: Must meet <6s/<200ms targets
- **Clinical accuracy**: Must maintain >90% agreement with golden samples
- **Provenance coverage**: Must maintain >95% coverage of AI claims

### Production Readiness

#### Pre-Production Checklist
- [ ] **Security Review**: Penetration testing completed
- [ ] **Performance Validation**: Load testing at expected scale
- [ ] **Clinical Validation**: Expert review of all persona outputs
- [ ] **Compliance Check**: HIPAA readiness assessment (for future PHI)
- [ ] **Monitoring Setup**: Alerting and dashboards configured
- [ ] **Backup Procedures**: Data recovery processes tested
- [ ] **Documentation**: All runbooks and troubleshooting guides complete

#### Production Monitoring
```bash
# Key metrics dashboard
echo "Production Health Check:"
echo "- Uptime: $(uptime)"
echo "- Response time P95: $(curl -s /metrics | grep response_time_p95)"
echo "- Error rate: $(curl -s /metrics | grep error_rate)"
echo "- AI accuracy: $(curl -s /metrics | grep clinical_accuracy)"
echo "- Provenance coverage: $(curl -s /metrics | grep provenance_coverage)"
```

---

## Troubleshooting Runbooks

### Common Issues and Solutions

#### Development Environment Issues

##### Node.js/npm Problems
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Fix permission issues
sudo chown -R $(whoami) ~/.npm
```

##### Next.js Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Check TypeScript compilation
npm run typecheck

# Debug build process
npm run build -- --debug
```

##### FHIR Validation Errors
```bash
# Check FHIR bundle structure
./scripts/validate-fhir.sh --bundle path/to/bundle.json

# Debug resource parsing
./scripts/debug-fhir.sh --resource-type Observation --bundle path/to/bundle.json

# Test with known good bundle
cp fixtures/valid-bundle.json test-bundle.json
```

#### Claude API Integration Issues

##### Rate Limiting
```bash
# Check current rate limit status
curl -H "Authorization: Bearer $CLAUDE_API_KEY" https://api.anthropic.com/v1/usage

# Implement backoff strategy
RETRY_DELAY=1
for i in {1..3}; do
  if curl -f api.anthropic.com/v1/messages; then
    break
  else
    sleep $((RETRY_DELAY * i))
  fi
done
```

##### Response Parsing Errors
```bash
# Debug Claude API responses
./scripts/debug-claude.sh --log-level debug --save-responses

# Validate JSON schema
./scripts/validate-schema.sh --schema summarization-schema.json --response response.json

# Test with minimal prompt
./scripts/test-minimal-prompt.sh
```

#### Performance Issues

##### Slow Bundle Processing
```bash
# Profile bundle processing
./scripts/profile-processing.sh --bundle large-bundle.json

# Check memory usage
./scripts/memory-check.sh --process-name node

# Optimize large bundles
./scripts/optimize-bundle.sh --input large-bundle.json --output optimized-bundle.json
```

##### Chart Rendering Delays
```bash
# Check chart data size
./scripts/chart-data-size.sh --chart-type lab-trends

# Profile chart rendering
./scripts/profile-charts.sh --chart lab-trends --data-points 1000

# Enable chart virtualization
export ENABLE_CHART_VIRTUALIZATION=true
```

### Emergency Procedures

#### Production Incident Response

##### Severity Levels
- **P0 (Critical)**: Complete service outage, data corruption
- **P1 (High)**: Major feature broken, significant performance degradation
- **P2 (Medium)**: Minor feature issues, moderate performance impact
- **P3 (Low)**: Cosmetic issues, minimal user impact

##### P0 Incident Response (15 minutes)
1. **Immediate**: Alert stakeholders via Slack/email
2. **Assess**: Determine scope and impact
3. **Mitigate**: Implement immediate fixes or rollback
4. **Communicate**: Update status page and stakeholders
5. **Document**: Create incident report for post-mortem

#### Rollback Procedures
```bash
# Quick rollback to previous deployment
./scripts/rollback.sh --to-version previous

# Database rollback (if needed)
./scripts/db-rollback.sh --to-timestamp "2024-01-26 10:00:00"

# Verify rollback success
./scripts/health-check.sh --comprehensive
```

---

## Team Communication

### Communication Channels

#### Slack Channels
- **#plumly-dev**: Development updates and technical discussions
- **#plumly-clinical**: Clinical validation and medical questions
- **#plumly-alerts**: Automated alerts and monitoring notifications
- **#plumly-demos**: Demo preparation and stakeholder communications

#### Meeting Cadence
- **Daily Standups**: 9:00 AM EST, 15 minutes
- **Sprint Planning**: Every other Monday, 4 hours
- **Sprint Review**: Every other Friday, 2 hours
- **Sprint Retrospective**: Every other Friday, 1.5 hours
- **Technical Deep Dives**: Wednesday afternoons as needed
- **Clinical Review**: Bi-weekly with clinical advisor

### Documentation Standards

#### Code Documentation
- **README files**: Updated for each major change
- **API Documentation**: OpenAPI specs for all endpoints
- **Component Documentation**: Storybook for UI components
- **Architecture Decision Records**: For all major technical decisions

#### Progress Reporting
- **Weekly Status Reports**: Every Friday to stakeholders
- **Sprint Reports**: End of each sprint with metrics and blockers
- **Monthly Executive Summary**: High-level progress and risks
- **Quarterly Business Review**: Comprehensive project status

---

## Getting Started

### For Project Managers
1. Review [TASK_BOARD.md](TASK_BOARD.md) for complete task specifications
2. Import tasks using [github-issues.yml](github-issues.yml) or [linear-import.csv](linear-import.csv)
3. Set up sprint planning meetings and team communication channels
4. Establish risk monitoring and quality gate procedures

### For Development Team
1. Complete project setup following Sprint 1 tasks
2. Join daily standups and sprint ceremonies
3. Follow task management procedures for status updates
4. Use quality gates and definition of done for all deliverables

### For Stakeholders
1. Attend sprint reviews for progress demonstrations
2. Provide timely feedback on clinical accuracy requirements
3. Participate in risk assessment and mitigation planning
4. Review weekly status reports and escalate concerns promptly

---

## Success Metrics

### Technical Metrics
- **Summary Generation Time**: <6 seconds P95 for 5MB bundles
- **Chart Rendering Time**: <200ms after data parsing
- **Provenance Coverage**: >95% of AI claims with FHIR references
- **Test Coverage**: >90% code coverage with comprehensive E2E tests

### Clinical Metrics
- **Accuracy Agreement**: >90% clinical reviewer approval
- **Confidence Calibration**: Uncertainty flags correlate with actual errors
- **Care Gap Detection**: Validated against clinical guidelines
- **Safety Validation**: Zero false positive clinical alerts

### Business Metrics
- **Demo Effectiveness**: 3+ "wow moments" per investor demonstration
- **User Comprehension**: Provider identifies key facts in <60 seconds
- **Feature Adoption**: Persona switching used in >50% of sessions
- **System Reliability**: >99.5% uptime during demo periods

### Project Management Metrics
- **Velocity**: Sprint commitments met >85% of the time
- **Quality**: <10% task rework rate due to incomplete requirements
- **Risk Management**: All high-risk items have active mitigation plans
- **Team Satisfaction**: >4.0/5.0 in sprint retrospective surveys

---

**Document Maintenance**
- **Owner**: Project Manager
- **Review Frequency**: Weekly during active development
- **Update Triggers**: Sprint planning, retrospectives, risk changes
- **Version Control**: All changes tracked in git with rationale

For questions or issues with these runbooks, contact the project management team or create an issue in the GitHub repository.