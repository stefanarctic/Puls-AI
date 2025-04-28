'use server';

// Import the updated types and function
import { analyzePhysicsProblem, type AnalyzePhysicsProblemInput, type AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem';
// Keep detectErrorAndProvideFeedback import in case it's used elsewhere, but it's not part of the main flow now.
import { detectErrorAndProvideFeedback, type DetectErrorAndProvideFeedbackInput, type DetectErrorAndProvideFeedbackOutput } from '@/ai/flows/detect-error-and-provide-feedback';

interface ActionResult<T> {
  data?: T;
  error?: string;
}

// Updated action to use the new AnalyzePhysicsProblemInput type (problemText + solutionPhotoDataUri)
export async function handleAnalyzeProblem(input: AnalyzePhysicsProblemInput): Promise<ActionResult<AnalyzePhysicsProblemOutput>> {
  try {
    // The input now contains problemText and solutionPhotoDataUri
    const result = await analyzePhysicsProblem(input);
    return { data: result };
  } catch (error) {
    console.error("Error in handleAnalyzeProblem:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.';
    // Respond with error in Romanian for consistency, although this is a system error
    return { error: `A apărut o eroare la analiză: ${errorMessage}` };
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
        return { error: `A apărut o eroare la detectarea greșelilor: ${errorMessage}` };
    }
}
