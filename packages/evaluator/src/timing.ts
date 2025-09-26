export interface TimingResult {
  functionName: string
  executionTime: number  // in milliseconds
  startTime: number
  endTime: number
  success: boolean
  error?: string
  result?: any
}

export interface TimingOptions {
  maxExecutionTime?: number  // timeout in milliseconds
  retries?: number
  onProgress?: (elapsed: number) => void
}

/**
 * Measure end-to-end execution time of a function
 * @param fn Function to measure
 * @param functionName Name for reporting
 * @param options Timing options
 * @returns Promise with timing results
 */
export async function timing<T>(
  fn: () => Promise<T> | T,
  functionName: string = 'anonymous',
  options: TimingOptions = {}
): Promise<TimingResult> {
  const { maxExecutionTime = 300000, retries = 0 } = options // 5 minute default timeout

  let attempt = 0
  let lastError: Error | undefined

  while (attempt <= retries) {
    const startTime = Date.now()

    try {
      // Set up timeout if specified
      const timeoutPromise = maxExecutionTime > 0
        ? new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Function ${functionName} timed out after ${maxExecutionTime}ms`)), maxExecutionTime)
          })
        : new Promise<never>(() => {}) // Never-resolving promise if no timeout

      // Set up progress monitoring if callback provided
      let progressInterval: NodeJS.Timeout | undefined
      if (options.onProgress) {
        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          options.onProgress!(elapsed)
        }, 1000)
      }

      try {
        // Execute the function with potential timeout
        const result = await Promise.race([
          Promise.resolve(fn()),
          timeoutPromise
        ])

        const endTime = Date.now()

        if (progressInterval) {
          clearInterval(progressInterval)
        }

        return {
          functionName,
          executionTime: endTime - startTime,
          startTime,
          endTime,
          success: true,
          result
        }
      } finally {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
      }
    } catch (error) {
      const endTime = Date.now()
      lastError = error instanceof Error ? error : new Error(String(error))

      // If we have retries left, try again
      if (attempt < retries) {
        attempt++
        console.warn(`Attempt ${attempt} failed for ${functionName}, retrying... (${lastError.message})`)
        continue
      }

      // Final attempt failed
      return {
        functionName,
        executionTime: endTime - startTime,
        startTime,
        endTime,
        success: false,
        error: lastError.message
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected end of timing function')
}

/**
 * Run timing tests on a set of fixtures
 * @param fixtures Array of test cases with input data
 * @param testFn Function to test that takes fixture data
 * @param options Timing options
 * @returns Array of timing results
 */
export async function timingFixtures<TFixture, TResult>(
  fixtures: TFixture[],
  testFn: (fixture: TFixture, index: number) => Promise<TResult> | TResult,
  options: TimingOptions & { fixtureTimeout?: number } = {}
): Promise<TimingResult[]> {
  const results: TimingResult[] = []
  const { fixtureTimeout = 60000 } = options // 1 minute per fixture default

  for (let i = 0; i < fixtures.length; i++) {
    const fixture = fixtures[i]
    const fixtureName = `fixture-${i}`

    console.log(`Running timing test for ${fixtureName}...`)

    const result = await timing(
      async () => testFn(fixture, i),
      fixtureName,
      { ...options, maxExecutionTime: fixtureTimeout }
    )

    results.push(result)

    // Log progress
    if (result.success) {
      console.log(`✅ ${fixtureName} completed in ${result.executionTime}ms`)
    } else {
      console.log(`❌ ${fixtureName} failed after ${result.executionTime}ms: ${result.error}`)
    }
  }

  return results
}

/**
 * Generate a performance report from timing results
 */
export function generateTimingReport(results: TimingResult[]): string {
  if (results.length === 0) {
    return '# Timing Report\n\nNo timing results available.'
  }

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0)
  const avgTime = totalTime / results.length
  const minTime = Math.min(...results.map(r => r.executionTime))
  const maxTime = Math.max(...results.map(r => r.executionTime))

  const report = [
    '# Performance Timing Report',
    '',
    '## Summary',
    `**Total Tests:** ${results.length}`,
    `**Successful:** ${successful.length}`,
    `**Failed:** ${failed.length}`,
    `**Success Rate:** ${((successful.length / results.length) * 100).toFixed(1)}%`,
    '',
    '## Execution Times',
    `**Total Time:** ${totalTime.toLocaleString()}ms (${(totalTime / 1000).toFixed(2)}s)`,
    `**Average Time:** ${avgTime.toFixed(2)}ms`,
    `**Min Time:** ${minTime}ms`,
    `**Max Time:** ${maxTime.toLocaleString()}ms`,
    ''
  ]

  if (successful.length > 0) {
    const successfulTimes = successful.map(r => r.executionTime)
    const avgSuccessTime = successfulTimes.reduce((sum, t) => sum + t, 0) / successfulTimes.length

    report.push('## Successful Executions')
    report.push(`**Count:** ${successful.length}`)
    report.push(`**Average Time:** ${avgSuccessTime.toFixed(2)}ms`)
    report.push('')
  }

  if (failed.length > 0) {
    report.push('## Failed Executions')
    report.push('')
    failed.forEach((result, index) => {
      report.push(`${index + 1}. **${result.functionName}** - ${result.executionTime}ms`)
      report.push(`   Error: ${result.error}`)
    })
    report.push('')
  }

  // Detailed results table
  report.push('## Detailed Results')
  report.push('')
  report.push('| Test | Status | Time (ms) | Error |')
  report.push('|------|--------|-----------|-------|')

  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    const error = result.error || '-'
    report.push(`| ${result.functionName} | ${status} | ${result.executionTime.toLocaleString()} | ${error} |`)
  })

  report.push('')
  report.push('---')
  report.push(`*Generated at ${new Date().toISOString()}*`)

  return report.join('\n')
}

/**
 * Performance benchmarking utilities
 */
export class PerformanceBenchmark {
  private results: TimingResult[] = []

  async add<T>(
    fn: () => Promise<T> | T,
    name: string,
    options?: TimingOptions
  ): Promise<T> {
    const result = await timing(fn, name, options)
    this.results.push(result)

    if (!result.success) {
      throw new Error(`Benchmark ${name} failed: ${result.error}`)
    }

    return result.result as T
  }

  getResults(): TimingResult[] {
    return [...this.results]
  }

  generateReport(): string {
    return generateTimingReport(this.results)
  }

  clear(): void {
    this.results = []
  }
}