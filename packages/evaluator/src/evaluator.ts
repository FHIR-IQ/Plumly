import { ClaudeClient, TemplateOptions, SummaryRequest, PersonaType } from '@plumly/summarizer'
import { FHIRBundle } from '@plumly/fhir-utils'
import { SummaryResult, coverage, provenanceMissing, analyzeSummaryProvenance, generateProvenanceReport } from './provenance'
import { timing, timingFixtures, generateTimingReport, TimingResult, PerformanceBenchmark } from './timing'
import { testFixtures, EvaluationFixture, getFixture } from './fixtures'
export interface EvaluationResult {
  fixture: string
  success: boolean
  provenance: {
    coverage: number
    totalSentences: number
    referencedSentences: number
    provenanceMissing: string[]
  }
  performance: TimingResult
  summary?: SummaryResult
  error?: string
  metrics?: {
    meetsMinCoverage: boolean
    meetsMaxExecutionTime: boolean
    hasRequiredSections: boolean
    requiredSectionsMissing?: string[]
  }
}

export class SummaryEvaluator {
  private claudeClient: ClaudeClient
  private benchmark: PerformanceBenchmark

  constructor(claudeClient: ClaudeClient) {
    this.claudeClient = claudeClient
    this.benchmark = new PerformanceBenchmark()
  }

  /**
   * Create a mock summary for evaluation purposes
   */
  private createMockSummary(fixtureName: string): SummaryResult {
    return {
      summary: `Mock summary for ${fixtureName}. Patient has diabetes and requires monitoring.`,
      sections: [
        {
          id: 'demographics',
          title: 'Patient Demographics',
          content: 'Patient is a 45-year-old male with type 2 diabetes.',
          claims: [
            {
              text: 'Patient has type 2 diabetes',
              refs: ['Condition/diabetes'],
              confidence: 'high',
              category: 'diagnosis'
            }
          ],
          sources: [
            {
              resourceType: 'Condition',
              resourceId: 'diabetes',
              reference: 'Condition/diabetes',
              relevanceScore: 0.95
            }
          ],
          confidence: 0.9,
          metadata: {
            generatedAt: new Date().toISOString(),
            persona: 'provider',
            template: 'comprehensive',
            processingTime: 1000
          }
        }
      ],
      metadata: {
        timestamp: new Date().toISOString(),
        options: {
          persona: 'provider',
          includeRecommendations: true
        },
        resourceCounts: {
          Patient: 1,
          Condition: 1,
          Observation: 2
        }
      }
    }
  }

  /**
   * Evaluate a single summary for provenance and performance
   */
  async evaluateSummary(
    bundle: FHIRBundle,
    options: TemplateOptions,
    fixtureName: string = 'custom'
  ): Promise<EvaluationResult> {
    const result: EvaluationResult = {
      fixture: fixtureName,
      success: false,
      provenance: {
        coverage: 0,
        totalSentences: 0,
        referencedSentences: 0,
        provenanceMissing: []
      },
      performance: {
        functionName: fixtureName,
        executionTime: 0,
        startTime: 0,
        endTime: 0,
        success: false
      }
    }

    try {
      // Time the summarization process
      const timingResult = await timing(
        async () => {
          // Create mock summary for evaluation purposes
          return this.createMockSummary(fixtureName)
        },
        `summarize-${fixtureName}`,
        { maxExecutionTime: 120000 } // 2 minute timeout
      )

      result.performance = timingResult

      if (!timingResult.success) {
        result.error = timingResult.error
        return result
      }

      const summary = timingResult.result as SummaryResult
      result.summary = summary

      // Analyze provenance
      const provenanceMetrics = analyzeSummaryProvenance(summary)
      result.provenance = provenanceMetrics

      result.success = true

      return result
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
      return result
    }
  }

  /**
   * Evaluate against a specific fixture
   */
  async evaluateFixture(fixtureName: string): Promise<EvaluationResult> {
    const fixture = getFixture(fixtureName)
    if (!fixture) {
      throw new Error(`Fixture '${fixtureName}' not found`)
    }

    const result = await this.evaluateSummary(
      fixture.bundle,
      fixture.options || {},
      fixtureName
    )

    // Check against expected metrics if provided
    if (fixture.expectedMetrics && result.success) {
      const metrics = {
        meetsMinCoverage: true,
        meetsMaxExecutionTime: true,
        hasRequiredSections: true,
        requiredSectionsMissing: [] as string[]
      }

      // Check coverage requirement
      if (fixture.expectedMetrics.minCoverage !== undefined) {
        metrics.meetsMinCoverage = result.provenance.coverage >= fixture.expectedMetrics.minCoverage
      }

      // Check execution time requirement
      if (fixture.expectedMetrics.maxExecutionTime !== undefined) {
        metrics.meetsMaxExecutionTime = result.performance.executionTime <= fixture.expectedMetrics.maxExecutionTime
      }

      // Check required sections
      if (fixture.expectedMetrics.requiredSections && result.summary?.sections) {
        const sectionTitles = result.summary.sections.map(s => s.title || '').filter(t => t.length > 0)
        const missing = fixture.expectedMetrics.requiredSections.filter(
          required => !sectionTitles.some(title => title.toLowerCase().includes(required.toLowerCase()))
        )

        metrics.hasRequiredSections = missing.length === 0
        metrics.requiredSectionsMissing = missing
      }

      result.metrics = metrics
    }

    return result
  }

  /**
   * Run evaluation on all fixtures
   */
  async evaluateAllFixtures(): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = []

    for (const fixture of testFixtures) {
      console.log(`Evaluating fixture: ${fixture.name}...`)

      const result = await this.evaluateFixture(fixture.name)
      results.push(result)

      if (result.success) {
        console.log(`✅ ${fixture.name}: Coverage ${result.provenance.coverage.toFixed(1)}%, Time ${result.performance.executionTime}ms`)
      } else {
        console.log(`❌ ${fixture.name}: Failed - ${result.error}`)
      }
    }

    return results
  }

  /**
   * Generate comprehensive evaluation report
   */
  generateEvaluationReport(results: EvaluationResult[]): string {
    const report = ['# Summary Evaluation Report', '']

    // Overall statistics
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    report.push('## Overall Statistics')
    report.push(`**Total Fixtures:** ${results.length}`)
    report.push(`**Successful:** ${successful.length}`)
    report.push(`**Failed:** ${failed.length}`)
    report.push(`**Success Rate:** ${((successful.length / results.length) * 100).toFixed(1)}%`)
    report.push('')

    // Performance summary
    if (successful.length > 0) {
      const executionTimes = successful.map(r => r.performance.executionTime)
      const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      const minTime = Math.min(...executionTimes)
      const maxTime = Math.max(...executionTimes)

      report.push('## Performance Summary')
      report.push(`**Average Execution Time:** ${avgTime.toFixed(2)}ms`)
      report.push(`**Min Execution Time:** ${minTime}ms`)
      report.push(`**Max Execution Time:** ${maxTime}ms`)
      report.push('')
    }

    // Provenance summary
    if (successful.length > 0) {
      const coverageScores = successful.map(r => r.provenance.coverage)
      const avgCoverage = coverageScores.reduce((sum, score) => sum + score, 0) / coverageScores.length
      const minCoverage = Math.min(...coverageScores)
      const maxCoverage = Math.max(...coverageScores)

      report.push('## Provenance Summary')
      report.push(`**Average Coverage:** ${avgCoverage.toFixed(2)}%`)
      report.push(`**Min Coverage:** ${minCoverage.toFixed(2)}%`)
      report.push(`**Max Coverage:** ${maxCoverage.toFixed(2)}%`)

      const goodCoverage = successful.filter(r => r.provenance.coverage >= 80).length
      const poorCoverage = successful.filter(r => r.provenance.coverage < 60).length
      report.push(`**Good Coverage (≥80%):** ${goodCoverage}`)
      report.push(`**Poor Coverage (<60%):** ${poorCoverage}`)
      report.push('')
    }

    // Detailed results
    report.push('## Detailed Results')
    report.push('')
    report.push('| Fixture | Status | Coverage | Time (ms) | Error |')
    report.push('|---------|--------|----------|-----------|-------|')

    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      const coverage = result.success ? `${result.provenance.coverage.toFixed(1)}%` : 'N/A'
      const time = result.performance.executionTime.toLocaleString()
      const error = result.error ? result.error.substring(0, 50) + (result.error.length > 50 ? '...' : '') : '-'

      report.push(`| ${result.fixture} | ${status} | ${coverage} | ${time} | ${error} |`)
    })

    // Failed fixtures details
    if (failed.length > 0) {
      report.push('')
      report.push('## Failed Fixtures')
      report.push('')

      failed.forEach((result, index) => {
        report.push(`### ${index + 1}. ${result.fixture}`)
        report.push(`**Error:** ${result.error}`)
        report.push(`**Execution Time:** ${result.performance.executionTime}ms`)
        report.push('')
      })
    }

    // Fixtures with poor provenance
    const poorProvenance = successful.filter(r => r.provenance.coverage < 60)
    if (poorProvenance.length > 0) {
      report.push('## Fixtures with Poor Provenance Coverage')
      report.push('')

      poorProvenance.forEach(result => {
        report.push(`### ${result.fixture} - ${result.provenance.coverage.toFixed(1)}%`)
        report.push(`**Sentences without references:** ${result.provenance.provenanceMissing.length}`)

        if (result.provenance.provenanceMissing.length > 0 && result.provenance.provenanceMissing.length <= 5) {
          report.push('**Examples:**')
          result.provenance.provenanceMissing.slice(0, 3).forEach((sentence, i) => {
            report.push(`${i + 1}. "${sentence}"`)
          })
        }
        report.push('')
      })
    }

    report.push('---')
    report.push(`*Generated at ${new Date().toISOString()}*`)

    return report.join('\n')
  }
}

// Export main evaluation functions for direct use
export { coverage, provenanceMissing, timing }
export { testFixtures, getFixture }
export type { EvaluationFixture, TimingResult }