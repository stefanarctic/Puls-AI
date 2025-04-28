
'use server';
/**
 * @fileOverview Analyzes a physics problem provided as text and a user's solution attempt as one or more images, compares it against a predefined results table concept, provides a rating, and responds in Romanian.
 *
 * - analyzePhysicsProblem - A function that handles the physics problem analysis process.
 * - AnalyzePhysicsProblemInput - The input type for the analyzePhysicsProblem function.
 * - AnalyzePhysicsProblemOutput - The return type for the analyzePhysicsProblem function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema now requires problem text and an array of solution photo URIs
const AnalyzePhysicsProblemInputSchema = z.object({
  problemText: z.string().describe('Textul problemei de fizică.'),
  solutionPhotoDataUris: z.array(
      z.string().describe(
        "A photo of the user's attempt/solution, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      )
    ).describe('O listă (array) de imagini cu soluția utilizatorului, sub formă de data URI.'),
});
export type AnalyzePhysicsProblemInput = z.infer<typeof AnalyzePhysicsProblemInputSchema>;

// Output schema remains the same
const AnalyzePhysicsProblemOutputSchema = z.object({
  solution: z.string().describe('Soluția corectă a problemei de fizică, în limba română.'),
  errorAnalysis: z.string().describe('O analiză a eventualelor erori făcute în soluția prezentată în imagini, în limba română. Dacă nu sunt erori, se specifică acest lucru.'),
  rating: z.string().describe('Punctajul obținut (ex: "7/10 puncte") bazat pe corectitudinea soluției din imagini în comparație cu baremul intern, în limba română.'),
});
export type AnalyzePhysicsProblemOutput = z.infer<typeof AnalyzePhysicsProblemOutputSchema>;

export async function analyzePhysicsProblem(input: AnalyzePhysicsProblemInput): Promise<AnalyzePhysicsProblemOutput> {
  // Basic validation: Ensure at least one image URI is provided
  if (!input.solutionPhotoDataUris || input.solutionPhotoDataUris.length === 0) {
    throw new Error("Este necesară cel puțin o imagine cu soluția.");
  }
  return analyzePhysicsProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhysicsProblemPromptRomanianV4', // Increment version due to prompt change
  input: {
    schema: z.object({
      problemText: z.string().describe('Textul problemei de fizică.'),
      solutionPhotoDataUris: z.array(
        z.string().describe(
          "A photo of the user's attempt/solution, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
      ).describe('O listă (array) de imagini cu soluția utilizatorului, sub formă de data URI.'),
    }),
  },
  output: {
    schema: z.object({
      solution: z.string().describe('Soluția corectă a problemei de fizică, în limba română.'),
      errorAnalysis: z.string().describe('O analiză a eventualelor erori făcute în soluția prezentată în imagini, în limba română. Dacă nu sunt erori, se specifică acest lucru.'),
      rating: z.string().describe('Punctajul obținut (ex: "7/10 puncte") bazat pe corectitudinea soluției din imagini în comparație cu baremul intern, în limba română.'),
    }),
  },
  // Updated prompt to use problemText and loop through solutionPhotoDataUris, removing the 'add' helper
  prompt: `Ești un expert în rezolvarea problemelor de fizică și un evaluator corect. Analizează problema de fizică descrisă mai jos și soluția încercată de utilizator, prezentată în imaginile următoare.

Textul Problemei:
{{{problemText}}}

Imagini cu Soluția Utilizatorului:
{{#each solutionPhotoDataUris}}
Imagine (Index {{@index}}):
{{media url=this}}
{{/each}}

Compară soluția utilizatorului din imagini cu un barem de corectare intern standard pentru problema dată. Baremul presupune un total de 10 puncte, distribuite logic pe pașii rezolvării (ex: identificare date corecte, aplicare formulă corectă, calcul numeric corect, unitate de măsură corectă etc.). Analizează toate imaginile furnizate pentru a înțelege complet soluția utilizatorului.

Răspunde exclusiv în limba română.

Oferă următoarele informații:
1.  **Soluția corectă:** Prezintă pașii detaliați și rezultatul final corect al problemei descrise în text.
2.  **Analiza erorilor:** Evidențiază orice greșeală făcută în soluția din imagini. Explică de ce este o greșeală. Dacă soluția din imagini este complet corectă, menționează explicit: "Soluția prezentată în imagini este corectă. Nu au fost detectate erori."
3.  **Punctaj:** Calculează și returnează un punctaj sub formă de "X/10 puncte", unde X este numărul de puncte acordate pe baza corectitudinii soluției din imagini, conform baremului intern descris mai sus.`,
  // Removed the custom helper as it caused errors and is not strictly necessary
  // custom: {
  //   handlebarsHelpers: {
  //     add: (a: number, b: number) => a + b,
  //   }
  // }
});

const analyzePhysicsProblemFlow = ai.defineFlow<
  typeof AnalyzePhysicsProblemInputSchema,
  typeof AnalyzePhysicsProblemOutputSchema
>(
  {
    name: 'analyzePhysicsProblemFlowV3', // Increment version due to prompt change
    inputSchema: AnalyzePhysicsProblemInputSchema,
    outputSchema: AnalyzePhysicsProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

