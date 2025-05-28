
import { NextResponse, type NextRequest } from 'next/server';
import { handleAnalyzeProblem } from '@/app/actions';
import type { AnalyzePhysicsProblemInput } from '@/ai/flows/analyze-physics-problem';

// Handler for OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 }); // 204 No Content is common for OPTIONS
  response.headers.set('Access-Control-Allow-Origin', '*'); // Allow any origin
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Specify allowed methods
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Specify allowed headers (add Authorization if you plan to use it)
  return response;
}

export async function POST(request: NextRequest) {
  let apiResponse: NextResponse; // Renamed to avoid conflict with the outer scope variable if any

  try {
    const body = await request.json() as AnalyzePhysicsProblemInput;

    if (!body || (typeof body.solutionPhotoDataUris === 'undefined' || !Array.isArray(body.solutionPhotoDataUris))) {
      apiResponse = NextResponse.json({ error: 'Invalid request body: solutionPhotoDataUris (array) is required.' }, { status: 400 });
    } else if (!body.problemText && !body.problemPhotoDataUri) {
      apiResponse = NextResponse.json({ error: 'Invalid request body: problemText or problemPhotoDataUri is required.' }, { status: 400 });
    } else if (body.solutionPhotoDataUris.length === 0) {
      apiResponse = NextResponse.json({ error: 'Invalid request body: At least one solutionPhotoDataUri is required.' }, { status: 400 });
    } else {
      const result = await handleAnalyzeProblem({
        problemText: body.problemText,
        problemPhotoDataUri: body.problemPhotoDataUri,
        solutionPhotoDataUris: body.solutionPhotoDataUris,
      });

      if (result.error) {
        apiResponse = NextResponse.json({ error: result.error }, { status: 400 });
      } else {
        apiResponse = NextResponse.json(result.data, { status: 200 });
      }
    }
  } catch (error) {
    console.error('[API /api/analyze Error]', error);
    let errorMessage = 'An unexpected error occurred.';
    let status = 500;
    if (error instanceof SyntaxError) { // Handles JSON.parse errors
        errorMessage = 'Invalid JSON in request body.';
        status = 400;
    }
    // Ensure apiResponse is initialized even in this catch block
    apiResponse = NextResponse.json({ error: errorMessage }, { status });
  }

  // Set CORS headers for all POST responses
  apiResponse.headers.set('Access-Control-Allow-Origin', '*');
  apiResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  apiResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return apiResponse;
}
