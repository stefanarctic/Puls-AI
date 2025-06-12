'use server';

// Import the updated types and function
import { analyzePhysicsProblem, type AnalyzePhysicsProblemInput, type AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem';
// Keep detectErrorAndProvideFeedback import in case it's used elsewhere, but it's not part of the main flow now.
import { detectErrorAndProvideFeedback, type DetectErrorAndProvideFeedbackInput, type DetectErrorAndProvideFeedbackOutput } from '@/ai/flows/detect-error-and-provide-feedback';
import { solvePhysicsProblem } from '@/ai/flows/solve-physics-problem';
import type { SolvePhysicsProblemInput, SolvePhysicsProblemOutput } from '@/ai/flows/solve-physics-problem';

interface ActionResult<T> {
  data?: T;
  error?: string;
}

// Action now uses the updated AnalyzePhysicsProblemInput which includes optional problemPhotoDataUri
export async function handleAnalyzeProblem(input: AnalyzePhysicsProblemInput): Promise<ActionResult<AnalyzePhysicsProblemOutput>> {
  try {
    // Validate input based on the schema's logic (at least text or image for problem)
    if (!input.problemText && !input.problemPhotoDataUri) {
      return { error: 'Trebuie furnizat cel puțin textul problemei sau o imagine a problemei.' };
    }
    if (!input.solutionPhotoDataUris || input.solutionPhotoDataUris.length === 0) {
      return { error: 'Este necesară cel puțin o imagine cu soluția.' };
    }

    // Call the flow with the potentially updated input (problemText, problemPhotoDataUri, solutionPhotoDataUris)
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

export async function handleSolveProblem(input: SolvePhysicsProblemInput): Promise<ActionResult<SolvePhysicsProblemOutput>> {
  try {
    // Validate input based on the schema's logic (at least text or image for problem)
    if (!input.problemText && !input.problemPhotoDataUri) {
      return { error: 'Trebuie furnizat cel puțin textul problemei sau o imagine a problemei.' };
    }

    // Call the flow with the input
    const result = await solvePhysicsProblem(input);
    return { data: result };
  } catch (error) {
    console.error("Error in handleSolveProblem:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during solving.';
    return { error: `A apărut o eroare la rezolvare: ${errorMessage}` };
  }
}
