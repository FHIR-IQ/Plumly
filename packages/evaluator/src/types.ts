// Evaluator type definitions
export interface EvaluationResult {
  score: number;
  metrics: Record<string, number>;
}

export interface TestCase {
  id: string;
  description: string;
  input: any;
  expected: any;
}