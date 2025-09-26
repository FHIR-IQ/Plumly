#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { ClaudeClient } from '@plumly/summarizer'
import { SummaryEvaluator, getFixture, testFixtures } from './evaluator'
import { FHIRBundle } from '@plumly/fhir-utils'

interface CliOptions {
  fixture?: string
  bundle?: string
  output?: string
  apiKey?: string
  verbose?: boolean
  timeout?: number
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]

    switch (arg) {
      case '--fixture':
      case '-f':
        options.fixture = next
        i++
        break
      case '--bundle':
      case '-b':
        options.bundle = next
        i++
        break
      case '--output':
      case '-o':
        options.output = next
        i++
        break
      case '--api-key':
      case '-k':
        options.apiKey = next
        i++
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--timeout':
      case '-t':
        options.timeout = parseInt(next, 10)
        i++
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`)
          process.exit(1)
        }
        break
    }
  }

  return options
}

function printHelp() {
  console.log(`
Plumly Evaluator CLI

Usage: evaluator-cli [options]

Options:
  -f, --fixture <name>    Run evaluation on specific fixture
  -b, --bundle <path>     Evaluate custom FHIR bundle from file
  -o, --output <path>     Output report to file (default: stdout)
  -k, --api-key <key>     Claude API key (or use ANTHROPIC_API_KEY env var)
  -t, --timeout <ms>      Timeout in milliseconds (default: 120000)
  -v, --verbose           Verbose output
  -h, --help             Show this help message

Examples:
  evaluator-cli                           # Run all fixtures
  evaluator-cli -f simple-patient        # Run specific fixture
  evaluator-cli -b ./my-bundle.json      # Evaluate custom bundle
  evaluator-cli -o report.md             # Save report to file

Available fixtures: ${testFixtures.map(f => f.name).join(', ')}
`)
}

async function loadBundle(bundlePath: string): Promise<FHIRBundle> {
  try {
    const content = fs.readFileSync(bundlePath, 'utf-8')
    return JSON.parse(content) as FHIRBundle
  } catch (error) {
    throw new Error(`Failed to load bundle from ${bundlePath}: ${error}`)
  }
}

async function main() {
  try {
    const options = parseArgs()

    // Get API key
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('Error: Claude API key required. Set ANTHROPIC_API_KEY environment variable or use --api-key option.')
      process.exit(1)
    }

    // Initialize Claude client and evaluator
    const claudeClient = new ClaudeClient(apiKey)
    const evaluator = new SummaryEvaluator(claudeClient)

    let report: string

    if (options.bundle) {
      // Evaluate custom bundle
      console.log(`Loading bundle from ${options.bundle}...`)
      const bundle = await loadBundle(options.bundle)

      const result = await evaluator.evaluateSummary(
        bundle,
        {},
        path.basename(options.bundle, '.json')
      )

      if (result.success) {
        report = `# Custom Bundle Evaluation\n\n**File:** ${options.bundle}\n**Coverage:** ${result.provenance.coverage.toFixed(2)}%\n**Execution Time:** ${result.performance.executionTime}ms\n\n## Provenance Analysis\n\n**Total Sentences:** ${result.provenance.totalSentences}\n**Referenced Sentences:** ${result.provenance.referencedSentences}\n\n${result.provenance.provenanceMissing.length > 0 ? '## Sentences Missing References\n\n' + result.provenance.provenanceMissing.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'All sentences have references!'}\n`
      } else {
        report = `# Custom Bundle Evaluation\n\n**File:** ${options.bundle}\n**Status:** FAILED\n**Error:** ${result.error}\n**Execution Time:** ${result.performance.executionTime}ms\n`
      }

    } else if (options.fixture) {
      // Evaluate specific fixture
      console.log(`Running evaluation for fixture: ${options.fixture}`)
      const result = await evaluator.evaluateFixture(options.fixture)
      report = evaluator.generateEvaluationReport([result])

    } else {
      // Evaluate all fixtures
      console.log('Running evaluation on all fixtures...')
      const results = await evaluator.evaluateAllFixtures()
      report = evaluator.generateEvaluationReport(results)
    }

    // Output report
    if (options.output) {
      fs.writeFileSync(options.output, report, 'utf-8')
      console.log(`Report written to ${options.output}`)
    } else {
      console.log('\n' + report)
    }

    // Exit with appropriate code
    const hasFailures = report.includes('❌') || report.includes('FAILED')
    process.exit(hasFailures ? 1 : 0)

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error)
}