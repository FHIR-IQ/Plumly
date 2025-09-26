# Spec-Driven Development (SDD) Guide

This document outlines how the Plumly project follows spec-driven development practices, inspired by GitHub's approach to building software through documentation-first development.

## What is Spec-Driven Development?

Spec-driven development is an approach where specifications, architecture decisions, and design documents are created before implementing features. This ensures:

- Clear understanding of requirements
- Better collaboration between team members
- Reduced implementation errors
- Easier maintenance and knowledge transfer
- Historical record of decision-making

## Documentation Structure

Our documentation follows GitHub's spec-kit standards:

```
docs/
├── README.md                    # Documentation overview
├── adr/                        # Architecture Decision Records
│   ├── 001-technology-stack.md
│   └── 002-prompt-templates.md
├── architecture/               # System architecture docs
│   └── system-overview.md
├── specs/                     # Technical specifications
│   ├── 001-fhir-summarization-poc.md
│   ├── 002-api-specification.md
│   └── 003-security-requirements.md
├── rfcs/                      # Request for Comments
│   └── README.md
├── runbooks/                  # Operational procedures
│   └── README.md
└── templates/                 # Documentation templates
    ├── README.md
    └── adr-template.md
```

## Process Flow

### 1. Specification Phase
- **Purpose**: Define what needs to be built
- **Artifacts**: Technical specifications in `docs/specs/`
- **Review**: Stakeholder review and approval

### 2. Architecture Phase
- **Purpose**: Decide how to build it
- **Artifacts**: Architecture Decision Records in `docs/adr/`
- **Review**: Technical team review

### 3. RFC Phase (for major changes)
- **Purpose**: Propose significant changes or new features
- **Artifacts**: RFC documents in `docs/rfcs/`
- **Review**: Community/team discussion and consensus

### 4. Implementation Phase
- **Purpose**: Build according to specifications
- **Artifacts**: Code, tests, implementation docs
- **Review**: Code review against specifications

### 5. Documentation Updates
- **Purpose**: Keep docs current with implementation
- **Artifacts**: Updated specs, runbooks, architecture docs
- **Review**: Documentation review

## Document Types

### Architecture Decision Records (ADRs)
- **Purpose**: Record important architectural decisions
- **When to use**: Major technology choices, design patterns, trade-offs
- **Location**: `docs/adr/`
- **Template**: `docs/templates/adr-template.md`

### Technical Specifications
- **Purpose**: Define functional and non-functional requirements
- **When to use**: New features, system changes, API designs
- **Location**: `docs/specs/`
- **Template**: Custom per specification type

### Request for Comments (RFCs)
- **Purpose**: Propose major changes for community input
- **When to use**: Breaking changes, new paradigms, significant features
- **Location**: `docs/rfcs/`
- **Template**: RFC template in `docs/rfcs/README.md`

### Runbooks
- **Purpose**: Operational procedures and troubleshooting
- **When to use**: Deployment, monitoring, incident response
- **Location**: `docs/runbooks/`
- **Template**: `docs/templates/runbook-template.md`

## Best Practices

### Writing Guidelines
1. **Be Clear**: Use simple, direct language
2. **Be Complete**: Cover all relevant aspects
3. **Be Current**: Keep documents updated with changes
4. **Be Consistent**: Follow templates and established patterns

### Review Process
1. **Author** creates document using appropriate template
2. **Stakeholders** review for completeness and accuracy
3. **Technical leads** review for feasibility and alignment
4. **Team** discusses and provides feedback
5. **Author** incorporates feedback and finalizes
6. **Document** is approved and becomes authoritative

### Maintenance
- Review documents quarterly for accuracy
- Update documents when implementation changes
- Archive outdated documents with clear deprecation notices
- Link related documents for easy navigation

## Tools and Automation

### Current Tools
- **Markdown**: All documentation in Markdown format
- **Git**: Version control for documentation changes
- **GitHub**: Collaborative review through pull requests
- **specify-cli**: GitHub's spec-kit toolkit (installed)

### Future Enhancements
- Automated spec validation
- Documentation site generation
- Link checking and validation
- Template enforcement

## Getting Started

### For New Features
1. Start with a technical specification in `docs/specs/`
2. Create ADRs for any architectural decisions in `docs/adr/`
3. Get stakeholder review and approval
4. Implement according to specifications
5. Update documentation with any implementation learnings

### For Major Changes
1. Create an RFC in `docs/rfcs/`
2. Gather community feedback
3. Create detailed specifications and ADRs
4. Follow standard implementation process

### For Operational Procedures
1. Document procedures as runbooks in `docs/runbooks/`
2. Test procedures in staging environment
3. Get operational team review
4. Deploy to production with runbook validation

## Examples

See existing documentation for examples:
- [ADR Example](docs/adr/001-technology-stack-selection.md)
- [Spec Example](docs/specs/001-fhir-summarization-poc.md)
- [Architecture Example](docs/architecture/system-overview.md)

## Resources

- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [ADR Community](https://adr.github.io/)
- [RFC Process](https://github.com/rust-lang/rfcs/blob/master/README.md)

---

**Note**: This is a living document. As our spec-driven development practices evolve, this guide will be updated to reflect current best practices and lessons learned.