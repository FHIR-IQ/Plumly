# Specification 005: Plumly vNext Implementation Plan

**Status**: Planning
**Version**: 1.0.0
**Date**: 2025-01-26
**Authors**: Development Team
**Related**: [Spec 004 - vNext Requirements](004-plumly-vnext-specification.md), [ADR-003 - Architecture](../adr/003-plumly-vnext-architecture.md)

## Technical Architecture Implementation

### Project Structure
```
apps/
├── web/                          # Next.js 14 App Router + TypeScript
│   ├── app/
│   │   ├── api/                  # API routes (serverless)
│   │   ├── components/           # UI components with shadcn/ui
│   │   └── (dashboard)/          # App router groups
│   ├── lib/
│   │   ├── hooks/                # React hooks
│   │   └── stores/               # Zustand stores
│   └── types/                    # TypeScript definitions

packages/
├── summarizer/                   # Core summarization logic
│   ├── src/
│   │   ├── engines/              # LLM integration
│   │   ├── templates/            # Persona prompt templates
│   │   └── provenance/           # Provenance tracking
│   └── tests/
├── fhir-utils/                   # FHIR processing utilities
│   ├── src/
│   │   ├── validation/           # Bundle validation
│   │   ├── normalization/        # US Core mapping
│   │   └── lookups/              # Code system lookups
│   └── tests/
└── evaluator/                    # Metrics and testing harness
    ├── src/
    │   ├── accuracy/             # Clinical accuracy testing
    │   ├── performance/          # Speed/memory benchmarks
    │   └── snapshots/            # Golden sample comparisons
    └── fixtures/
```

## Phase 1: Foundation (Weeks 1-4)

### Week 1: Project Setup & Core Architecture

#### Task 1.1: Monorepo Setup
```bash
# Setup commands
pnpm create next-app@latest apps/web --typescript --tailwind --app
cd packages/summarizer && pnpm init
cd packages/fhir-utils && pnpm init
cd packages/evaluator && pnpm init

# Add workspace configuration to root package.json
```

**Deliverables:**
- [ ] Turborepo or pnpm workspace configuration
- [ ] Next.js 14 with App Router enabled
- [ ] TypeScript strict mode configuration
- [ ] Tailwind CSS with shadcn/ui setup
- [ ] Development scripts and tooling

**Acceptance Criteria:**
- All packages can be built and tested independently
- Hot reload works for both app and packages
- ESLint and Prettier configured consistently

#### Task 1.2: Basic FHIR Processing (`packages/fhir-utils`)
```typescript
// Core types
export interface NormalizedBundle {
  patient: USCorePatient
  observations: USCoreObservation[]
  conditions: USCoreCondition[]
  medications: USCoreMedicationRequest[]
  encounters: USCoreEncounter[]
  metadata: BundleMetadata
}

// Validation pipeline
export class FHIRValidator {
  validateBundle(bundle: Bundle): ValidationResult
  validateResource(resource: Resource): ResourceValidation
  checkUSCoreCompliance(resource: Resource): ComplianceCheck
}

// Normalization engine
export class FHIRNormalizer {
  normalizeBundle(bundle: Bundle): NormalizedBundle
  indexByCodes(): CodeIndex
  extractTimelineData(): TimelineData
}
```

**Deliverables:**
- [ ] FHIR Bundle validation with error details
- [ ] US Core resource type definitions
- [ ] Normalization pipeline for core resources
- [ ] Code system lookups (LOINC, SNOMED, RxNorm)
- [ ] Unit tests with 90%+ coverage

**Acceptance Criteria:**
- Validates synthetic patient bundles correctly
- Gracefully handles malformed bundles
- Extracts key clinical data accurately
- Performance: <500ms for 5MB bundles

#### Task 1.3: Summarization Engine Foundation (`packages/summarizer`)
```typescript
// Persona templates
export interface PersonaTemplate {
  id: PersonaType
  sections: SectionConfig[]
  tone: ToneConfig
  terminology: TerminologyLevel
}

// Summarization pipeline
export class SummarizationEngine {
  constructor(
    private claudeClient: ClaudeClient,
    private templates: PersonaTemplateManager
  ) {}

  async generateSummary(
    bundle: NormalizedBundle,
    persona: PersonaType
  ): Promise<StructuredSummary>

  private selectRelevantResources(): ResourceSelection
  private assemblePrompt(): PromptAssembly
  private parseResponse(): StructuredOutput
}

// Output schema
export interface StructuredSummary {
  sections: SummarySection[]
  metadata: {
    persona: PersonaType
    timestamp: string
    processingTime: number
  }
}

export interface SummarySection {
  id: string
  title: string
  content: string
  claims: Claim[]
}

export interface Claim {
  text: string
  refs: FHIRReference[]
  confidence: number
  reasoning?: string
}
```

**Deliverables:**
- [ ] Persona template system (Patient/Provider/Caregiver)
- [ ] Claude API integration with retry logic
- [ ] Resource selection algorithms
- [ ] Provenance tracking implementation
- [ ] JSON-safe output parsing

**Acceptance Criteria:**
- Generates different outputs for each persona
- All claims have traceable FHIR references
- Handles API failures gracefully
- Output validates against schema

### Week 2: Frontend Core & State Management

#### Task 2.1: UI Foundation with shadcn/ui
```typescript
// Core layout components
const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-6">
      {children}
    </main>
  </div>
)

// Persona toggle component
const PersonaToggle = () => {
  const { persona, setPersona } = usePersonaStore()
  return (
    <ToggleGroup type="single" value={persona} onValueChange={setPersona}>
      <ToggleGroupItem value="patient">Patient</ToggleGroupItem>
      <ToggleGroupItem value="provider">Provider</ToggleGroupItem>
      <ToggleGroupItem value="caregiver">Caregiver</ToggleGroupItem>
    </ToggleGroup>
  )
}
```

**Deliverables:**
- [ ] shadcn/ui component library setup
- [ ] Core layout components (Header, Sidebar, Main)
- [ ] Persona toggle interface
- [ ] File upload component with drag & drop
- [ ] Loading states and error boundaries

**Acceptance Criteria:**
- Responsive design works on mobile/desktop
- Persona switching is instant and smooth
- File upload handles large files (10MB+)
- Accessible keyboard navigation

#### Task 2.2: State Management with Zustand
```typescript
// Persona store
interface PersonaStore {
  persona: PersonaType
  setPersona: (persona: PersonaType) => void
  preferences: PersonaPreferences
  updatePreferences: (prefs: Partial<PersonaPreferences>) => void
}

// Bundle store
interface BundleStore {
  currentBundle: NormalizedBundle | null
  summary: StructuredSummary | null
  isProcessing: boolean
  error: string | null

  uploadBundle: (file: File) => Promise<void>
  fetchFromServer: (serverUrl: string, patientId: string) => Promise<void>
  generateSummary: () => Promise<void>
  clearState: () => void
}

// UI store
interface UIStore {
  sidebarOpen: boolean
  activeTab: string
  selectedProvenance: FHIRReference | null

  toggleSidebar: () => void
  setActiveTab: (tab: string) => void
  showProvenance: (ref: FHIRReference) => void
  hideProvenance: () => void
}
```

**Deliverables:**
- [ ] Zustand stores for persona, bundle, and UI state
- [ ] Persistence layer for user preferences
- [ ] State hydration and error handling
- [ ] TypeScript integration with stores

**Acceptance Criteria:**
- State persists across browser refreshes
- No unnecessary re-renders on state changes
- Error states are handled gracefully
- DevTools integration for debugging

#### Task 2.3: API Route Implementation
```typescript
// apps/web/app/api/bundles/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('bundle') as File

  // Validate file
  if (!file || file.type !== 'application/json') {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
  }

  try {
    const content = await file.text()
    const bundle = JSON.parse(content)

    // Process with FHIR utils
    const validator = new FHIRValidator()
    const validation = await validator.validateBundle(bundle)

    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Invalid FHIR Bundle',
        details: validation.errors
      }, { status: 400 })
    }

    const normalizer = new FHIRNormalizer()
    const normalized = await normalizer.normalizeBundle(bundle)

    return NextResponse.json({
      success: true,
      bundle: normalized
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Processing failed',
      message: error.message
    }, { status: 500 })
  }
}

// apps/web/app/api/summarize/route.ts
export async function POST(request: Request) {
  const { bundle, persona } = await request.json()

  try {
    const engine = new SummarizationEngine(claudeClient, templates)
    const summary = await engine.generateSummary(bundle, persona)

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    return NextResponse.json({
      error: 'Summarization failed',
      message: error.message
    }, { status: 500 })
  }
}
```

**Deliverables:**
- [ ] Bundle upload API route with validation
- [ ] FHIR server fetch API route
- [ ] Summarization API route
- [ ] Error handling and status codes
- [ ] Request/response logging

**Acceptance Criteria:**
- API routes handle edge cases gracefully
- Validation errors provide helpful details
- Processing times logged for monitoring
- Security headers configured properly

### Week 3: Provenance System & UI Components

#### Task 3.1: Provenance Chip Component
```typescript
interface ProvenanceChipProps {
  resourceRef: FHIRReference
  text?: string
  variant?: 'default' | 'high-confidence' | 'low-confidence'
  className?: string
}

const ProvenanceChip = ({
  resourceRef,
  text,
  variant = 'default',
  className
}: ProvenanceChipProps) => {
  const { showProvenance } = useUIStore()
  const resourceData = useResourceData(resourceRef)

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-6 px-2 text-xs font-medium",
        "border border-muted-foreground/20",
        "hover:bg-muted hover:border-muted-foreground/40",
        variant === 'high-confidence' && "border-green-200 bg-green-50",
        variant === 'low-confidence' && "border-amber-200 bg-amber-50",
        className
      )}
      onClick={() => showProvenance(resourceRef)}
    >
      {text || resourceData?.type || 'Source'}
      <ExternalLink className="ml-1 h-3 w-3" />
    </Button>
  )
}

// Resource inspector panel
const ProvenancePanel = () => {
  const { selectedProvenance, hideProvenance } = useUIStore()
  const resourceData = useResourceData(selectedProvenance)

  return (
    <Sheet open={!!selectedProvenance} onOpenChange={() => hideProvenance()}>
      <SheetContent side="right" className="w-[600px] sm:w-[800px]">
        <SheetHeader>
          <SheetTitle>Resource Details</SheetTitle>
          <SheetDescription>
            {resourceData?.resourceType}/{resourceData?.id}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <Tabs defaultValue="formatted">
            <TabsList>
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="formatted">
              <FormattedResourceView resource={resourceData} />
            </TabsContent>
            <TabsContent value="raw">
              <JsonView data={resourceData} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Deliverables:**
- [ ] Reusable ProvenanceChip component
- [ ] Resource inspector side panel
- [ ] Formatted resource display
- [ ] Raw JSON viewer with syntax highlighting
- [ ] Hover highlighting for cross-references

**Acceptance Criteria:**
- Chips are accessible and keyboard navigable
- Panel opens smoothly with resource data
- JSON viewer handles large resources well
- Cross-references work bidirectionally

#### Task 3.2: Summary Display Components
```typescript
interface SummarySectionProps {
  section: SummarySection
  persona: PersonaType
}

const SummarySection = ({ section, persona }: SummarySectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {section.title}
          <Badge variant="outline" className="text-xs">
            {persona}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <EnhancedText
            content={section.content}
            claims={section.claims}
          />
        </div>
      </CardContent>
    </Card>
  )
}

const EnhancedText = ({ content, claims }: {
  content: string
  claims: Claim[]
}) => {
  // Parse content and inject provenance chips
  const enhancedContent = useMemo(() => {
    return parseContentWithClaims(content, claims)
  }, [content, claims])

  return <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
}
```

**Deliverables:**
- [ ] Summary section display component
- [ ] Enhanced text with inline provenance
- [ ] Claim parsing and chip injection
- [ ] Persona-specific styling
- [ ] Content sanitization for safety

**Acceptance Criteria:**
- Content renders with proper formatting
- Provenance chips integrate seamlessly
- Different personas show appropriate styling
- No XSS vulnerabilities in content display

#### Task 3.3: Basic Chart Components (Recharts)
```typescript
interface LabTrendChartProps {
  observations: USCoreObservation[]
  labCode: string
  title: string
  unit?: string
}

const LabTrendChart = ({ observations, labCode, title, unit }: LabTrendChartProps) => {
  const chartData = useMemo(() => {
    return observations
      .filter(obs => obs.code?.coding?.[0]?.code === labCode)
      .map(obs => ({
        date: obs.effectiveDateTime,
        value: obs.valueQuantity?.value,
        unit: obs.valueQuantity?.unit || unit,
        referenceHigh: obs.referenceRange?.[0]?.high?.value,
        referenceLow: obs.referenceRange?.[0]?.low?.value,
        resourceId: obs.id
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [observations, labCode])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM yyyy')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), 'PPP')}
              formatter={(value, name) => [`${value} ${chartData[0]?.unit}`, name]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            {/* Reference range bands */}
            <ReferenceLine
              y={chartData[0]?.referenceHigh}
              stroke="red"
              strokeDasharray="5 5"
            />
            <ReferenceLine
              y={chartData[0]?.referenceLow}
              stroke="red"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

**Deliverables:**
- [ ] Lab trend chart component
- [ ] Medication timeline visualization
- [ ] Reference range indicators
- [ ] Interactive tooltips with provenance
- [ ] Out-of-range highlighting

**Acceptance Criteria:**
- Charts render within 200ms performance target
- Interactive elements provide useful information
- Reference ranges display accurately
- Mobile responsive design

### Week 4: Integration & Testing

#### Task 4.1: End-to-End Integration
```typescript
// Integration flow
const PatientDashboard = () => {
  const { currentBundle, summary, isProcessing } = useBundleStore()
  const { persona } = usePersonaStore()

  if (!currentBundle) {
    return <BundleUpload />
  }

  if (isProcessing) {
    return <ProcessingSpinner />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <PersonaToggle className="mb-6" />
        {summary && (
          <div className="space-y-6">
            {summary.sections.map(section => (
              <SummarySection
                key={section.id}
                section={section}
                persona={persona}
              />
            ))}
          </div>
        )}
      </div>
      <div className="space-y-6">
        <HighlightsPanel />
        <ChartsPanel />
      </div>
    </div>
  )
}
```

**Deliverables:**
- [ ] Complete dashboard layout
- [ ] File upload to summary flow
- [ ] Persona switching integration
- [ ] Error state handling
- [ ] Loading state management

**Acceptance Criteria:**
- Complete user flow works end-to-end
- All components integrate properly
- Performance targets met (<6s summary)
- Error states provide recovery options

#### Task 4.2: Testing Infrastructure
```typescript
// Unit tests
describe('FHIRValidator', () => {
  it('should validate well-formed bundles', () => {
    const bundle = fixtures.validBundle
    const result = validator.validateBundle(bundle)
    expect(result.isValid).toBe(true)
  })

  it('should reject malformed bundles', () => {
    const bundle = fixtures.malformedBundle
    const result = validator.validateBundle(bundle)
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })
})

// Integration tests
describe('Summarization API', () => {
  it('should generate persona-specific summaries', async () => {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      body: JSON.stringify({
        bundle: fixtures.normalizedBundle,
        persona: 'patient'
      })
    })

    const result = await response.json()
    expect(result.summary.sections).toBeDefined()
    expect(result.summary.sections[0].claims).toBeDefined()
  })
})

// E2E tests with Playwright
test('complete patient flow', async ({ page }) => {
  await page.goto('/')

  // Upload bundle
  await page.setInputFiles('[data-testid="file-input"]', 'fixtures/patient-bundle.json')
  await page.waitForSelector('[data-testid="summary-content"]')

  // Switch persona
  await page.click('[data-testid="persona-provider"]')
  await expect(page.locator('[data-testid="summary-content"]')).toContainText('Clinical')

  // Open provenance
  await page.click('[data-testid="provenance-chip"]:first-of-type')
  await expect(page.locator('[data-testid="resource-panel"]')).toBeVisible()
})
```

**Deliverables:**
- [ ] Unit test suite with 90%+ coverage
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Performance benchmarking tests
- [ ] Snapshot tests for persona outputs

**Acceptance Criteria:**
- All tests pass consistently
- Performance tests validate timing requirements
- E2E tests cover complete user journeys
- Test data covers edge cases

## Phase 2: Enhancement (Weeks 5-8)

### Week 5: Advanced Visualization & Highlights

#### Task 5.1: Enhanced Chart Components
```typescript
const MedicationTimelineChart = ({ medications }: {
  medications: USCoreMedicationRequest[]
}) => {
  const timelineData = useMemo(() => {
    return medications.map(med => ({
      name: med.medicationCodeableConcept?.coding?.[0]?.display,
      start: new Date(med.authoredOn),
      end: med.dispenseRequest?.validityPeriod?.end
        ? new Date(med.dispenseRequest.validityPeriod.end)
        : null,
      status: med.status,
      resourceId: med.id
    }))
  }, [medications])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medication Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <GanttChart data={timelineData} />
      </CardContent>
    </Card>
  )
}

const HighlightsPanel = () => {
  const { highlights } = useHighlightsStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Action Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {highlights.map(highlight => (
          <Alert key={highlight.id} variant={highlight.severity}>
            <AlertDescription>
              {highlight.message}
              <div className="mt-2 flex gap-1">
                {highlight.sources.map(ref => (
                  <ProvenanceChip key={ref.reference} resourceRef={ref} />
                ))}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
```

**Deliverables:**
- [ ] Medication timeline (Gantt-style) visualization
- [ ] Enhanced highlights panel with severity levels
- [ ] Out-of-range lab value detection
- [ ] Drug interaction warnings
- [ ] Care gap identification

#### Task 5.2: Reasoning Trail Implementation
```typescript
const ReasoningTrail = ({ claim }: { claim: Claim }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          isExpanded && "rotate-90"
        )} />
        How was this derived?
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 p-3 bg-muted/30 rounded-md">
        <div className="space-y-2 text-sm">
          <div>
            <strong>Resources considered:</strong>
            <ul className="ml-4 mt-1 list-disc">
              {claim.refs.map(ref => (
                <li key={ref.reference}>
                  <ProvenanceChip resourceRef={ref} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Reasoning:</strong>
            <p className="mt-1 text-muted-foreground">
              {claim.reasoning || "AI analysis based on clinical patterns in the data"}
            </p>
          </div>
          <div>
            <strong>Confidence:</strong>
            <Badge variant={claim.confidence > 0.8 ? "default" : "secondary"}>
              {Math.round(claim.confidence * 100)}%
            </Badge>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Week 6: Performance Optimization & Caching

#### Task 6.1: Bundle Processing Optimization
```typescript
// Streaming JSON processing for large bundles
export class StreamingBundleProcessor {
  async processLargeBundle(file: File): Promise<NormalizedBundle> {
    const stream = file.stream()
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    let jsonBuffer = ''
    let resources: Resource[] = []

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      jsonBuffer += decoder.decode(value, { stream: true })

      // Process complete resources as they arrive
      const processedResources = this.extractCompleteResources(jsonBuffer)
      resources.push(...processedResources.resources)
      jsonBuffer = processedResources.remainder
    }

    return this.normalizeResources(resources)
  }
}

// Response caching
export class SummaryCache {
  private cache = new Map<string, CachedSummary>()

  getCacheKey(bundle: NormalizedBundle, persona: PersonaType): string {
    const bundleHash = this.hashBundle(bundle)
    return `${bundleHash}-${persona}`
  }

  async getSummary(
    bundle: NormalizedBundle,
    persona: PersonaType
  ): Promise<StructuredSummary | null> {
    const key = this.getCacheKey(bundle, persona)
    const cached = this.cache.get(key)

    if (cached && !this.isExpired(cached)) {
      return cached.summary
    }

    return null
  }
}
```

#### Task 6.2: Chart Rendering Performance
```typescript
// Virtualized chart rendering for large datasets
const VirtualizedLabChart = ({ observations }: {
  observations: USCoreObservation[]
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 })

  const visibleData = useMemo(() => {
    return observations.slice(visibleRange.start, visibleRange.end)
  }, [observations, visibleRange])

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={visibleData}>
          {/* Chart components */}
        </LineChart>
      </ResponsiveContainer>
      <ChartNavigator
        totalPoints={observations.length}
        visibleRange={visibleRange}
        onRangeChange={setVisibleRange}
      />
    </div>
  )
}
```

### Week 7-8: FHIR Server Integration & Export Features

#### Task 7.1: FHIR Server Connectivity
```typescript
// FHIR server client
export class FHIRServerClient {
  constructor(private baseUrl: string, private auth?: AuthConfig) {}

  async getPatientEverything(patientId: string): Promise<Bundle> {
    const url = `${this.baseUrl}/Patient/${patientId}/$everything`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/fhir+json',
        'Authorization': this.auth ? `Bearer ${this.auth.token}` : undefined
      }
    })

    if (!response.ok) {
      throw new FHIRServerError(
        `Failed to fetch patient data: ${response.statusText}`,
        response.status
      )
    }

    return response.json()
  }

  async testConnection(): Promise<CapabilityStatement> {
    const response = await fetch(`${this.baseUrl}/metadata`)
    return response.json()
  }
}

// API route for server integration
export async function POST(request: Request) {
  const { serverUrl, patientId } = await request.json()

  try {
    const client = new FHIRServerClient(serverUrl)
    await client.testConnection() // Validate server

    const bundle = await client.getPatientEverything(patientId)
    const normalized = await new FHIRNormalizer().normalizeBundle(bundle)

    return NextResponse.json({ success: true, bundle: normalized })
  } catch (error) {
    if (error instanceof FHIRServerError) {
      return NextResponse.json({
        error: 'FHIR server error',
        message: error.message,
        statusCode: error.statusCode
      }, { status: error.statusCode >= 500 ? 502 : 400 })
    }

    return NextResponse.json({
      error: 'Connection failed',
      message: error.message
    }, { status: 500 })
  }
}
```

#### Task 7.2: Export & Sharing Features
```typescript
// PDF export with Puppeteer
export class PDFExporter {
  async generatePDF(summary: StructuredSummary, persona: PersonaType): Promise<Buffer> {
    const html = this.renderSummaryHTML(summary, persona)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.setContent(html)
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    })

    await browser.close()
    return pdf
  }

  private renderSummaryHTML(summary: StructuredSummary, persona: PersonaType): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${this.getStyles()}</style>
        </head>
        <body>
          <div class="watermark">Demo - Not for clinical use</div>
          <h1>Health Summary - ${persona}</h1>
          ${summary.sections.map(section => `
            <section>
              <h2>${section.title}</h2>
              <div class="content">${section.content}</div>
            </section>
          `).join('')}
        </body>
      </html>
    `
  }
}

// Secure sharing links
export class ShareManager {
  async createSecureLink(summaryId: string): Promise<ShareLink> {
    const token = await this.generateSecureToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const shareLink = {
      id: generateId(),
      summaryId,
      token,
      expiresAt,
      createdAt: new Date()
    }

    await this.storeShareLink(shareLink)

    return {
      url: `${process.env.BASE_URL}/shared/${token}`,
      expiresAt
    }
  }
}
```

## Phase 3: Polish & Testing (Weeks 9-12)

### Week 9-10: Comprehensive Testing

#### Task 9.1: Clinical Accuracy Testing (`packages/evaluator`)
```typescript
// Golden sample testing
export class AccuracyEvaluator {
  async evaluateAgainstGoldenSamples(
    summaries: StructuredSummary[],
    goldenSamples: GoldenSample[]
  ): Promise<AccuracyReport> {
    const results = await Promise.all(
      summaries.map(async (summary, index) => {
        const golden = goldenSamples[index]
        return {
          summaryId: summary.metadata.summaryId,
          accuracy: await this.compareWithGolden(summary, golden),
          provenanceAccuracy: this.validateProvenance(summary, golden),
          clinicalSafety: await this.checkClinicalSafety(summary)
        }
      })
    )

    return {
      overallAccuracy: this.calculateOverallAccuracy(results),
      provenanceScore: this.calculateProvenanceScore(results),
      safetyScore: this.calculateSafetyScore(results),
      detailedResults: results
    }
  }
}

// Performance benchmarking
export class PerformanceBenchmark {
  async benchmarkProcessingSpeed(bundles: Bundle[]): Promise<PerformanceReport> {
    const results = []

    for (const bundle of bundles) {
      const startTime = performance.now()

      // Full processing pipeline
      const normalized = await new FHIRNormalizer().normalizeBundle(bundle)
      const summary = await new SummarizationEngine().generateSummary(normalized, 'provider')

      const endTime = performance.now()
      const processingTime = endTime - startTime

      results.push({
        bundleSize: JSON.stringify(bundle).length,
        resourceCount: bundle.entry?.length || 0,
        processingTime,
        meetsTarget: processingTime < 6000 // 6 second target
      })
    }

    return {
      averageTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
      p95Time: this.calculatePercentile(results.map(r => r.processingTime), 95),
      targetMet: results.every(r => r.meetsTarget),
      detailedResults: results
    }
  }
}
```

#### Task 9.2: E2E Testing with Playwright
```typescript
// Comprehensive user flow tests
test.describe('Complete user flows', () => {
  test('provider workflow with complex patient', async ({ page }) => {
    // Upload complex patient bundle
    await page.goto('/')
    await page.setInputFiles(
      '[data-testid="file-input"]',
      'fixtures/complex-patient-bundle.json'
    )

    // Wait for processing
    await page.waitForSelector('[data-testid="summary-content"]', {
      timeout: 10000
    })

    // Verify persona toggle
    await page.click('[data-testid="persona-provider"]')
    await expect(page.locator('[data-testid="summary-content"]'))
      .toContainText('Clinical assessment')

    // Test highlights panel
    await expect(page.locator('[data-testid="highlights-panel"]'))
      .toBeVisible()
    const highlightCount = await page.locator('[data-testid="highlight-item"]').count()
    expect(highlightCount).toBeGreaterThan(0)

    // Test provenance interaction
    await page.click('[data-testid="provenance-chip"]:first-of-type')
    await expect(page.locator('[data-testid="resource-panel"]')).toBeVisible()

    // Test chart interaction
    await page.hover('[data-testid="lab-chart"] .recharts-line-dot')
    await expect(page.locator('.recharts-tooltip')).toBeVisible()

    // Test PDF export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-pdf-button"]')
    ])

    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('performance requirements', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.setInputFiles(
      '[data-testid="file-input"]',
      'fixtures/large-bundle-7mb.json'
    )

    // Wait for summary to appear
    await page.waitForSelector('[data-testid="summary-content"]')

    const processingTime = Date.now() - startTime
    expect(processingTime).toBeLessThan(6000) // 6 second requirement

    // Chart rendering performance
    const chartStart = Date.now()
    await page.click('[data-testid="charts-tab"]')
    await page.waitForSelector('[data-testid="lab-chart"]')
    const chartTime = Date.now() - chartStart

    expect(chartTime).toBeLessThan(200) // 200ms requirement
  })
})
```

### Week 11-12: Observability & Production Readiness

#### Task 11.1: Monitoring & Logging
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Redact sensitive data in demo mode
    if (process.env.DEMO_MODE === 'true') {
      return sanitizeEvent(event)
    }
    return event
  }
})

// Custom metrics tracking
export class MetricsCollector {
  trackProcessingTime(bundleSize: number, processingTime: number) {
    // Custom metric for bundle processing performance
    Sentry.addBreadcrumb({
      category: 'performance',
      message: 'Bundle processing completed',
      data: { bundleSize, processingTime },
      level: 'info'
    })
  }

  trackAccuracy(summaryId: string, accuracyScore: number) {
    Sentry.addBreadcrumb({
      category: 'quality',
      message: 'Summary accuracy measured',
      data: { summaryId, accuracyScore },
      level: accuracyScore > 0.9 ? 'info' : 'warning'
    })
  }

  trackUserFlow(event: string, persona: PersonaType, metadata?: any) {
    Sentry.addBreadcrumb({
      category: 'user-interaction',
      message: event,
      data: { persona, ...metadata },
      level: 'info'
    })
  }
}

// Performance monitoring
export class PerformanceMonitor {
  async monitorAPIRoute<T>(
    routeName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()

    try {
      const result = await operation()
      const duration = performance.now() - startTime

      // Log successful operation
      console.log(`${routeName} completed in ${duration}ms`)

      // Track in monitoring
      this.trackMetric(`api.${routeName}.duration`, duration)
      this.trackMetric(`api.${routeName}.success`, 1)

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      // Log error with context
      console.error(`${routeName} failed after ${duration}ms:`, error)

      // Track in monitoring
      this.trackMetric(`api.${routeName}.duration`, duration)
      this.trackMetric(`api.${routeName}.error`, 1)

      throw error
    }
  }
}
```

#### Task 11.2: Security & Compliance
```typescript
// Input sanitization
export class SecurityValidator {
  sanitizeFHIRBundle(bundle: any): Bundle {
    // Remove any potentially harmful content
    const sanitized = this.deepSanitize(bundle)

    // Validate structure
    if (!this.isValidBundleStructure(sanitized)) {
      throw new SecurityError('Invalid bundle structure detected')
    }

    return sanitized as Bundle
  }

  validateFileUpload(file: File): void {
    // Size limits
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new ValidationError('File too large')
    }

    // Content type validation
    if (file.type !== 'application/json') {
      throw new ValidationError('Invalid file type')
    }

    // File name sanitization
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
    if (sanitizedName !== file.name) {
      throw new ValidationError('Invalid file name')
    }
  }
}

// Demo mode identifier redaction
export class IdentifierRedactor {
  redactForDemo(bundle: NormalizedBundle): NormalizedBundle {
    const redacted = structuredClone(bundle)

    // Redact patient identifiers
    if (redacted.patient) {
      redacted.patient.identifier = []
      redacted.patient.name = redacted.patient.name?.map(name => ({
        ...name,
        family: 'Demo',
        given: ['Patient']
      }))
    }

    // Add demo watermark to all text content
    return this.addDemoWatermarks(redacted)
  }
}
```

## Deliverables Summary

### Core Packages
- [ ] **`apps/web`**: Next.js 14 application with App Router
- [ ] **`packages/summarizer`**: Core summarization engine with persona support
- [ ] **`packages/fhir-utils`**: FHIR validation, normalization, and utilities
- [ ] **`packages/evaluator`**: Testing and metrics collection framework

### Key Features
- [ ] **Multi-persona system**: Patient/Provider/Caregiver with tailored content
- [ ] **Provenance tracking**: Complete traceability with interactive chips
- [ ] **Visual insights**: Charts for labs, vitals, and medication timelines
- [ ] **Actionable highlights**: Risk detection and care gap identification
- [ ] **FHIR connectivity**: File upload and server integration
- [ ] **Export capabilities**: PDF generation and secure sharing
- [ ] **Performance optimization**: Sub-6s processing, sub-200ms charts

### Quality Assurance
- [ ] **Comprehensive testing**: Unit, integration, and E2E test suites
- [ ] **Performance benchmarking**: Automated performance validation
- [ ] **Clinical accuracy**: Golden sample testing and validation
- [ ] **Security measures**: Input sanitization and demo mode safety
- [ ] **Monitoring**: Observability with Sentry and custom metrics

This implementation plan provides a clear roadmap for building Plumly vNext with the specified technical architecture while maintaining focus on clinical safety, performance, and user experience.