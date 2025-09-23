# Contributing to Plumly

Thank you for your interest in contributing to Plumly! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to healthcare technology ethics and responsible AI development principles:

- **Patient Safety First:** All contributions must prioritize patient safety and healthcare data accuracy
- **Privacy by Design:** Respect healthcare data privacy and security requirements
- **Inclusive Development:** Welcome contributors from diverse backgrounds and expertise levels
- **Collaborative Spirit:** Foster constructive feedback and knowledge sharing
- **Professional Standards:** Maintain high standards appropriate for healthcare technology

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git version control
- VS Code (recommended) with TypeScript extensions
- Basic understanding of FHIR R4 specification
- Familiarity with healthcare data concepts

### First Contribution Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/plumly.git
   cd plumly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.local.example .env.local
   # Add your Anthropic API key to .env.local
   ```

4. **Start development services**
   ```bash
   npm run fhir:start  # Start HAPI FHIR server
   npm run dev         # Start Next.js development server
   ```

5. **Verify setup**
   - Visit http://localhost:3000 to see the application
   - Upload sample data from `sample-data/sample-patient-bundle.json`
   - Generate a test summary to confirm everything works

## Development Setup

### Environment Configuration

Create `.env.local` with required variables:
```bash
ANTHROPIC_API_KEY=your_api_key_here
FHIR_SERVER_URL=http://localhost:8080/fhir
NEXT_PUBLIC_FHIR_SERVER_URL=http://localhost:8080/fhir
```

### Docker Services

The project uses Docker for the HAPI FHIR server:
```bash
# Start services
npm run fhir:start

# View logs
npm run fhir:logs

# Stop services
npm run fhir:stop
```

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
```

## Project Structure

```
plumly/
├── docs/                    # Project documentation
│   ├── specs/              # Technical specifications
│   ├── adr/                # Architecture Decision Records
│   └── architecture/       # System architecture docs
├── src/
│   ├── app/                # Next.js app router
│   │   ├── api/           # API route handlers
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout component
│   │   └── page.tsx       # Home page component
│   ├── components/        # React components
│   │   ├── FileUpload.tsx
│   │   ├── PromptConfiguration.tsx
│   │   └── SummaryOutput.tsx
│   ├── lib/              # Utility libraries
│   │   ├── claude-client.ts
│   │   ├── fhir-client.ts
│   │   ├── fhir-validator.ts
│   │   ├── fhir-composition.ts
│   │   └── prompt-templates.ts
│   └── types/            # TypeScript type definitions
│       └── fhir.ts
├── sample-data/          # Test FHIR bundles
├── docker/              # Docker configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── docker-compose.yml
```

## Development Workflow

### Branch Strategy

- **main:** Stable, production-ready code
- **develop:** Integration branch for features
- **feature/\*:** Individual feature development
- **bugfix/\*:** Bug fixes
- **docs/\*:** Documentation updates

### Feature Development Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop with tests**
   - Write failing tests first (TDD approach)
   - Implement feature code
   - Ensure all tests pass
   - Add documentation

3. **Commit with clear messages**
   ```bash
   git commit -m "feat: add patient summary customization options"
   ```

4. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Follow conventional commits specification:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(templates): add medication reconciliation template
fix(upload): handle malformed FHIR bundle validation
docs(api): update endpoint documentation
test(summarize): add integration tests for Claude API
```

## Coding Standards

### TypeScript Guidelines

- **Strict Mode:** Enable all TypeScript strict checks
- **Type Safety:** Avoid `any` types, use proper type definitions
- **FHIR Types:** Use `@types/fhir` for FHIR resource typing
- **Error Handling:** Proper error types and handling patterns

### Code Style

- **Formatting:** Use Prettier for consistent code formatting
- **Linting:** Follow ESLint rules with TypeScript extensions
- **Naming:** Use descriptive names for variables and functions
- **Comments:** JSDoc comments for public APIs and complex logic

### React/Next.js Patterns

- **Components:** Functional components with TypeScript
- **Hooks:** Use React hooks for state management
- **API Routes:** RESTful design with proper HTTP status codes
- **Error Boundaries:** Implement error handling for user experience

### FHIR Best Practices

- **Resource Validation:** Always validate FHIR resources
- **Reference Handling:** Proper handling of resource references
- **Standard Compliance:** Follow FHIR R4 specification
- **Data Privacy:** Never log PHI or sensitive data

## Testing Guidelines

### Testing Strategy

- **Unit Tests:** Test individual functions and components
- **Integration Tests:** Test API endpoints and external integrations
- **E2E Tests:** Test complete user workflows
- **Performance Tests:** Validate response time requirements

### Testing Tools

- **Jest:** JavaScript testing framework
- **React Testing Library:** Component testing utilities
- **MSW:** Mock Service Worker for API mocking
- **Playwright:** End-to-end testing (future consideration)

### Test Structure

```typescript
// Example test structure
describe('FHIRClient', () => {
  describe('uploadBundle', () => {
    it('should upload valid FHIR bundle successfully', async () => {
      // Arrange
      const validBundle = createTestBundle()

      // Act
      const result = await fhirClient.uploadBundle(validBundle)

      // Assert
      expect(result.success).toBe(true)
      expect(result.bundleId).toBeDefined()
    })

    it('should reject invalid FHIR bundle', async () => {
      // Arrange
      const invalidBundle = { resourceType: 'Invalid' }

      // Act & Assert
      await expect(fhirClient.uploadBundle(invalidBundle))
        .rejects.toThrow('Invalid FHIR Bundle format')
    })
  })
})
```

### Healthcare-Specific Testing

- **Clinical Accuracy:** Validate medical terminology and relationships
- **Data Privacy:** Ensure no PHI leakage in logs or outputs
- **Error Handling:** Test graceful failure with malformed medical data
- **Compliance:** Verify FHIR specification compliance

## Documentation

### Code Documentation

- **README Updates:** Keep main README current with setup instructions
- **API Documentation:** Document all API endpoints with examples
- **Type Documentation:** JSDoc comments for TypeScript interfaces
- **Architecture Decisions:** Update ADRs for significant changes

### Healthcare Documentation

- **Clinical Context:** Explain medical concepts for non-clinical developers
- **FHIR Resources:** Document supported resource types and relationships
- **Prompt Templates:** Explain template design and clinical reasoning
- **Use Cases:** Document target user workflows and scenarios

### Documentation Standards

- **Markdown:** Use GitHub-flavored Markdown
- **Diagrams:** Mermaid for architecture and flow diagrams
- **Examples:** Include code examples and sample data
- **Links:** Reference external standards and specifications

## Pull Request Process

### Before Submitting

1. **Self Review**
   - Code follows project standards
   - Tests pass locally
   - Documentation updated
   - No PHI or secrets in code

2. **Health Checks**
   ```bash
   npm run typecheck  # TypeScript compilation
   npm run lint       # Code linting
   npm test          # Run test suite
   npm run build     # Production build
   ```

### Pull Request Template

```markdown
## Summary
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Healthcare data accuracy verified

## Documentation
- [ ] README updated
- [ ] API documentation updated
- [ ] Code comments added
- [ ] Architecture docs updated

## Healthcare Considerations
- [ ] Clinical accuracy verified
- [ ] No PHI in code or logs
- [ ] FHIR compliance maintained
- [ ] Patient safety considered

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] No merge conflicts
```

### Review Process

1. **Automated Checks:** CI/CD pipeline validation
2. **Code Review:** Peer review for code quality and standards
3. **Healthcare Review:** Clinical accuracy and safety validation
4. **Security Review:** Privacy and security considerations
5. **Final Approval:** Maintainer approval and merge

## Issue Reporting

### Bug Reports

Use the bug report template:
```markdown
**Bug Description**
Clear description of the bug and expected behavior.

**Reproduction Steps**
1. Step one
2. Step two
3. Step three

**Environment**
- OS: [e.g., Windows 11, macOS 13]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome 118]

**Healthcare Context**
- FHIR resources involved
- Clinical scenario if applicable
- Data privacy implications

**Additional Context**
Screenshots, logs, or other relevant information.
```

### Feature Requests

Use the feature request template:
```markdown
**Feature Description**
Clear description of the proposed feature.

**Clinical Use Case**
Healthcare scenario that motivates this feature.

**Target Users**
- [ ] Patients
- [ ] Healthcare Providers
- [ ] Payers/Health Systems
- [ ] Developers

**Implementation Ideas**
Suggestions for technical approach.

**Alternatives Considered**
Other approaches that were considered.
```

### Security Issues

For security-related issues:
- **Private Reporting:** Use GitHub private vulnerability reporting
- **No Public Disclosure:** Do not create public issues for security vulnerabilities
- **Healthcare Data:** Special consideration for PHI-related security issues

## Getting Help

### Community Support

- **GitHub Discussions:** General questions and community support
- **Issue Tracker:** Bug reports and feature requests
- **Documentation:** Check docs/ directory for detailed information

### Development Support

- **Architecture Questions:** Refer to ADRs and architecture documentation
- **FHIR Questions:** Consult FHIR R4 specification and community resources
- **Healthcare Context:** Seek clinical expert input for medical accuracy

### Maintainer Contact

For project-level questions or sensitive issues:
- Create GitHub issue with `@maintainer` mention
- Use GitHub discussions for broader questions
- Follow security reporting process for vulnerabilities

---

**Thank you for contributing to Plumly!** Your contributions help advance the intersection of AI and healthcare technology while maintaining the highest standards of patient safety and data privacy.