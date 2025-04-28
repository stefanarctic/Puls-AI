'use server';
/**
 * @fileOverview Analyzes a physics problem provided as text and a user's solution attempt as an image, compares it against a predefined results table concept, provides a rating, and responds in Romanian.
 *
 * - analyzePhysicsProblem - A function that handles the physics problem analysis process.
 * - AnalyzePhysicsProblemInput - The input type for the analyzePhysicsProblem function.
 * - AnalyzePhysicsProblemOutput - The return type for the analyzePhysicsProblem function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema now requires problem text and solution photo
const AnalyzePhysicsProblemInputSchema = z.object({
  problemText: z.string().describe('Textul problemei de fizică.'),
  solutionPhotoDataUri: z
    .string()
    .describe(
      "A photo of the user's attempt/solution, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePhysicsProblemInput = z.infer<typeof AnalyzePhysicsProblemInputSchema>;

// Output schema remains the same
const AnalyzePhysicsProblemOutputSchema = z.object({
  solution: z.string().describe('Soluția corectă a problemei de fizică, în limba română.'),
  errorAnalysis: z.string().describe('O analiză a eventualelor erori făcute în soluția prezentată în imagine, în limba română. Dacă nu sunt erori, se specifică acest lucru.'),
  rating: z.string().describe('Punctajul obținut (ex: "7/10 puncte") bazat pe corectitudinea soluției din imagine în comparație cu baremul intern, în limba română.'),
});
export type AnalyzePhysicsProblemOutput = z.infer<typeof AnalyzePhysicsProblemOutputSchema>;

export async function analyzePhysicsProblem(input: AnalyzePhysicsProblemInput): Promise<AnalyzePhysicsProblemOutput> {
  return analyzePhysicsProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhysicsProblemPromptRomanianV2',
  input: {
    schema: z.object({
      problemText: z.string().describe('Textul problemei de fizică.'),
      solutionPhotoDataUri: z
        .string()
        .describe(
          "A photo of the user's attempt/solution, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      solution: z.string().describe('Soluția corectă a problemei de fizică, în limba română.'),
      errorAnalysis: z.string().describe('O analiză a eventualelor erori făcute în soluția prezentată în imagine, în limba română. Dacă nu sunt erori, se specifică acest lucru.'),
      rating: z.string().describe('Punctajul obținut (ex: "7/10 puncte") bazat pe corectitudinea soluției din imagine în comparație cu baremul intern, în limba română.'),
    }),
  },
  // Updated prompt to use problemText and solutionPhotoDataUri
  prompt: `Ești un expert în rezolvarea problemelor de fizică și un evaluator corect. Analizează problema de fizică descrisă mai jos și soluția încercată de utilizator, prezentată în imaginea următoare.

Textul Problemei:
{{{problemText}}}

Imagine cu Soluția Utilizatorului:
{{media url=solutionPhotoDataUri}}

Compară soluția utilizatorului din imagine cu un barem de corectare intern standard pentru problema dată. Baremul presupune un total de 10 puncte, distribuite logic pe pașii rezolvării (ex: identificare date corecte, aplicare formulă corectă, calcul numeric corect, unitate de măsură corectă etc.).

Răspunde exclusiv în limba română.

Oferă următoarele informații:
1.  **Soluția corectă:** Prezintă pașii detaliați și rezultatul final corect al problemei descrise în text.
2.  **Analiza erorilor:** Evidențiază orice greșeală făcută în soluția din imagine. Explică de ce este o greșeală. Dacă soluția din imagine este complet corectă, menționează explicit: "Soluția prezentată în imagine este corectă. Nu au fost detectate erori."
3.  **Punctaj:** Calculează și returnează un punctaj sub formă de "X/10 puncte", unde X este numărul de puncte acordate pe baza corectitudinii soluției din imagine, conform baremului intern descris mai sus.`,
});

const analyzePhysicsProblemFlow = ai.defineFlow<
  typeof AnalyzePhysicsProblemInputSchema,
  typeof AnalyzePhysicsProblemOutputSchema
>(
  {
    name: 'analyzePhysicsProblemFlow',
    inputSchema: AnalyzePhysicsProblemInputSchema, // Updated input schema
    outputSchema: AnalyzePhysicsProblemOutputSchema, // Output schema remains the same
  },
  async input => {
    const {output} = await prompt(input); // Pass the new input structure
    return output!;
  }
);
