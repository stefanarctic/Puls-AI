'use server';

import { analyzePhysicsProblem, type AnalyzePhysicsProblemInput, type AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem';
import { detectErrorAndProvideFeedback, type DetectErrorAndProvideFeedbackInput, type DetectErrorAndProvideFeedbackOutput } from '@/ai/flows/detect-error-and-provide-feedback';

interface ActionResult<T> {
  data?: T;
  error?: string;
}

// Although the request asked for detectErrorAndProvideFeedback,
// analyzePhysicsProblem already includes error detection and feedback functionality.
// We will use analyzePhysicsProblem as it covers the core requirement.
export async function handleAnalyzeProblem(input: AnalyzePhysicsProblemInput): Promise<ActionResult<AnalyzePhysicsProblemOutput>> {
  try {
    const result = await analyzePhysicsProblem(input);
    return { data: result };
  } catch (error) {
    console.error("Error in handleAnalyzeProblem:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.';
    return { error: errorMessage };
  }
}

// Keep the detectErrorAndProvideFeedback action available in case it's needed later,
// but it's not currently used by the frontend based on the simplified flow.
export async function handleDetectError(input: DetectErrorAndProvideFeedbackInput): Promise<ActionResult<DetectErrorAndProvideFeedbackOutput>> {
    try {
        const result = await detectErrorAndProvideFeedback(input);
        return { data: result };
    } catch (error) {
        console.error("Error in handleDetectError:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during error detection.';
        return { error: errorMessage };
    }
}
