
'use server';
/**
 * @fileOverview Analyzes a physics problem provided as text and/or an image, and a user's solution attempt as one or more images, compares it against a predefined results table concept, provides a rating, and responds in Romanian. Includes tolerance for numerical approximations.
 *
 * - analyzePhysicsProblem - A function that handles the physics problem analysis process.
 * - AnalyzePhysicsProblemInput - The input type for the analyzePhysicsProblem function.
 * - AnalyzePhysicsProblemOutput - The return type for the analyzePhysicsProblem function.
 */

import {runThrottled} from '@/ai/request-throttle';
import {groqChat, type GroqChatMessage} from '@/ai/groq';
import {z} from 'genkit';

// Input schema remains the same
const AnalyzePhysicsProblemInputSchema = z.object({
  problemText: z.string().optional().describe('Textul problemei de fizică (opțional dacă se furnizează imaginea problemei).'),
  problemPhotoDataUri: z.string().optional().describe(
    "O fotografie a enunțului problemei, ca data URI (opțional dacă se furnizează textul problemei). Format așteptat: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  solutionPhotoDataUris: z.array(
      z.string().describe(
        "A photo of the user's attempt/solution, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      )
    ).min(1, { message: "Este necesară cel puțin o imagine cu soluția." }) // Ensure at least one solution image
     .describe('O listă (array) cu imaginile soluției utilizatorului, sub formă de data URI.'),
}).refine(data => data.problemText || data.problemPhotoDataUri, {
    message: "Trebuie furnizat cel puțin textul problemei sau o imagine a problemei.",
    path: ["problemText", "problemPhotoDataUri"], // Indicate which fields are related to the error
});

export type AnalyzePhysicsProblemInput = z.infer<typeof AnalyzePhysicsProblemInputSchema>;

// Output schema remains the same
const AnalyzePhysicsProblemOutputSchema = z.object({
  solution: z.string().describe('Soluția corectă a problemei de fizică, în limba română.'),
  errorAnalysis: z.string().describe('O analiză a eventualelor erori făcute în soluția prezentată în imagini, în limba română. Dacă nu sunt erori, se specifică acest lucru. Menționează dacă s-a aplicat toleranță numerică.'),
  rating: z.string().describe('Punctajul obținut (ex: "7/10 puncte") bazat pe corectitudinea soluției din imagini în comparație cu baremul intern (cu toleranță la aproximări), în limba română.'),
});
export type AnalyzePhysicsProblemOutput = z.infer<typeof AnalyzePhysicsProblemOutputSchema>;

export async function analyzePhysicsProblem(input: AnalyzePhysicsProblemInput): Promise<AnalyzePhysicsProblemOutput> {
  // Validation is handled by Zod schema refinement
  return callGroqAnalyze(input);
}

const SYSTEM_PROMPT = `Ești un expert în rezolvarea problemelor de fizică și un evaluator corect și flexibil. Analizează problema (text și/sau imagine) și soluția utilizatorului din imagini. Aplică toleranță rezonabilă la aproximări numerice. Răspunde exclusiv în limba română și furnizează: 1) Soluția corectă, 2) Analiza erorilor, 3) Punctaj "X/10 puncte".`;

async function callGroqAnalyze(input: AnalyzePhysicsProblemInput): Promise<AnalyzePhysicsProblemOutput> {
  const messages: GroqChatMessage[] = [
    { role: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Textul Problemei:${input.problemText ? `\n${input.problemText}` : ' (nedatat)'}` },
        ...(input.problemPhotoDataUri ? [{ type: 'image_url', image_url: { url: input.problemPhotoDataUri } }] as const : []),
        { type: 'text', text: 'Imagini cu Soluția Utilizatorului (urmează una sau mai multe):' },
        ...((input.solutionPhotoDataUris ?? []).map(url => ({ type: 'image_url', image_url: { url } }) as const)),
        { type: 'text', text: 'Returnează un JSON cu cheile: solution, errorAnalysis, rating.' },
      ],
    },
  ];

  const content = await runThrottled(() => groqChat(messages, { max_tokens: 2000 }));

  let solution = '';
  let errorAnalysis = '';
  let rating = '';
  try {
    const match = content.match(/\{[\s\S]*\}$/);
    const json = JSON.parse(match ? match[0] : content);
    solution = String(json.solution ?? '');
    errorAnalysis = String(json.errorAnalysis ?? '');
    rating = String(json.rating ?? '');
  } catch {
    solution = content;
    errorAnalysis = 'Analiza erorilor este inclusă în textul de mai sus.';
    rating = '—/10 puncte';
  }

  return { solution, errorAnalysis, rating };
}
