import { NextResponse, type NextRequest } from 'next/server';
import { handleSolveProblem } from '@/app/actions';
import type { SolvePhysicsProblemInput } from '../../../ai/flows/solve-physics-problem';

// Handler for OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(request: NextRequest) {
  let apiResponse: NextResponse;

  try {
    const body = await request.json() as SolvePhysicsProblemInput;

    if (!body || (!body.problemText && !body.problemPhotoDataUri)) {
      apiResponse = NextResponse.json({ error: 'Invalid request body: problemText or problemPhotoDataUri is required.' }, { status: 400 });
    } else {
      const result = await handleSolveProblem({
        problemText: body.problemText,
        problemPhotoDataUri: body.problemPhotoDataUri,
      });

      if (result.error) {
        apiResponse = NextResponse.json({ error: result.error }, { status: 400 });
      } else {
        apiResponse = NextResponse.json(result.data, { status: 200 });
      }
    }
  } catch (error) {
    console.error('[API /api/solve Error]', error);
    let errorMessage = 'An unexpected error occurred.';
    let status = 500;
    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON in request body.';
      status = 400;
    }
    apiResponse = NextResponse.json({ error: errorMessage }, { status });
  }

  apiResponse.headers.set('Access-Control-Allow-Origin', '*');
  apiResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return apiResponse;
} 