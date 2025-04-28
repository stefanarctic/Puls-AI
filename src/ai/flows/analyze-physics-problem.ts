'use server';
/**
 * @fileOverview Analyzes a physics problem provided as an image, compares it against a predefined results table concept, provides a rating, and responds in Romanian.
 *
 * - analyzePhysicsProblem - A function that handles the physics problem analysis process.
 * - AnalyzePhysicsProblemInput - The input type for the analyzePhysicsProblem function.
 * - AnalyzePhysicsProblemOutput - The return type for the analyzePhysicsProblem function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema now only requires the problem photo
const AnalyzePhysicsProblemInputSchema = z.object({
  problemPhotoDataUri: z
    .string()
    .describe(
      "A photo of the physics problem and the user's attempt/solution, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePhysicsProblemInput = z.infer<typeof AnalyzePhysicsProblemInputSchema>;

// Output schema now includes a rating and specifies Romanian language
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
  name: 'analyzePhysicsProblemPromptRomanian',
  input: {
    schema: z.object({
      problemPhotoDataUri: z
        .string()
        .describe(
          "A photo of the physics problem and the user's attempt/solution, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
  // Updated prompt for Romanian output, internal results table concept, and rating
  prompt: `Ești un expert în rezolvarea problemelor de fizică și un evaluator corect. Analizează problema de fizică și soluția încercată de utilizator, prezentate în imaginea următoare.

Imagine cu Problema și Soluția Utilizatorului: {{media url=problemPhotoDataUri}}

Compară soluția utilizatorului cu un barem de corectare intern standard. Baremul presupune un total de 10 puncte, distribuite logic pe pașii rezolvării (ex: identificare date corecte, aplicare formulă corectă, calcul numeric corect, unitate de măsură corectă etc.).

Răspunde exclusiv în limba română.

Oferă următoarele informații:
1.  **Soluția corectă:** Prezintă pașii detaliați și rezultatul final corect al problemei.
2.  **Analiza erorilor:** Evidențiază orice greșeală făcută în soluția din imagine. Explică de ce este o greșeală. Dacă soluția este complet corectă, menționează explicit: "Soluția prezentată este corectă. Nu au fost detectate erori."
3.  **Punctaj:** Calculează și returnează un punctaj sub formă de "X/10 puncte", unde X este numărul de puncte acordate pe baza corectitudinii soluției din imagine, conform baremului intern descris mai sus.`,
});

const analyzePhysicsProblemFlow = ai.defineFlow<
  typeof AnalyzePhysicsProblemInputSchema,
  typeof AnalyzePhysicsProblemOutputSchema
>(
  {
    name: 'analyzePhysicsProblemFlow',
    inputSchema: AnalyzePhysicsProblemInputSchema, // Updated input schema
    outputSchema: AnalyzePhysicsProblemOutputSchema, // Updated output schema
  },
  async input => {
    // No need to handle resultsTableDataUri here anymore
    const {output} = await prompt(input);
    return output!;
  }
);
