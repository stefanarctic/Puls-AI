
import { NextResponse, type NextRequest } from 'next/server';
import { handleAnalyzeProblem } from '@/app/actions';
import type { AnalyzePhysicsProblemInput } from '@/ai/flows/analyze-physics-problem';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalyzePhysicsProblemInput;

    // Basic validation to ensure the body structure is somewhat correct
    // More detailed validation is handled by the Zod schema within the Genkit flow
    // and by the handleAnalyzeProblem action.
    if (!body || (typeof body.solutionPhotoDataUris === 'undefined' || !Array.isArray(body.solutionPhotoDataUris))) {
      return NextResponse.json({ error: 'Invalid request body: solutionPhotoDataUris (array) is required.' }, { status: 400 });
    }

    if (!body.problemText && !body.problemPhotoDataUri) {
      return NextResponse.json({ error: 'Invalid request body: problemText or problemPhotoDataUri is required.' }, { status: 400 });
    }
     if (body.solutionPhotoDataUris.length === 0) {
      return NextResponse.json({ error: 'Invalid request body: At least one solutionPhotoDataUri is required.' }, { status: 400 });
    }


    const result = await handleAnalyzeProblem({
      problemText: body.problemText,
      problemPhotoDataUri: body.problemPhotoDataUri,
      solutionPhotoDataUris: body.solutionPhotoDataUris,
    });

    if (result.error) {
      // Determine status code based on typical error types.
      // Zod errors or flow input errors might be client-side (400),
      // while unexpected Genkit errors might be server-side (500).
      // For simplicity, we'll use 400 for errors originating from handleAnalyzeProblem,
      // as it often relates to input validation.
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 200 });

  } catch (error) {
    console.error('[API /api/analyze Error]', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof SyntaxError) { // Handles JSON.parse errors
        errorMessage = 'Invalid JSON in request body.';
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    if (error instanceof Error) {
        // errorMessage = error.message; // Potentially too verbose or revealing
    }
    // For other unexpected errors, return a generic 500.
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
