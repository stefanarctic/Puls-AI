
'use server';
/**
 * @fileOverview Analyzes a physics problem provided as text and/or an image, and a user's solution attempt as one or more images, compares it against a predefined results table concept, provides a rating, and responds in Romanian.
 *
 * - analyzePhysicsProblem - A function that handles the physics problem analysis process.
 * - AnalyzePhysicsProblemInput - The input type for the analyzePhysicsProblem function.
 * - AnalyzePhysicsProblemOutput - The return type for the analyzePhysicsProblem function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema now includes an optional problem image URI
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
  errorAnalysis: z.string().describe('O analiză a eventualelor erori făcute în soluția prezentată în imagini, în limba română. Dacă nu sunt erori, se specifică acest lucru.'),
  rating: z.string().describe('Punctajul obținut (ex: "7/10 puncte") bazat pe corectitudinea soluției din imagini în comparație cu baremul intern, în limba română.'),
});
export type AnalyzePhysicsProblemOutput = z.infer<typeof AnalyzePhysicsProblemOutputSchema>;

export async function analyzePhysicsProblem(input: AnalyzePhysicsProblemInput): Promise<AnalyzePhysicsProblemOutput> {
  // Validation is now handled by Zod schema refinement
  return analyzePhysicsProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhysicsProblemPromptRomanianV5', // Increment version due to prompt change
  input: {
    schema: z.object({
       problemText: z.string().optional().describe('Textul problemei de fizică.'),
       problemPhotoDataUri: z.string().optional().describe(
        "O fotografie a enunțului problemei, ca data URI (opțional dacă se furnizează textul problemei). Format așteptat: 'data:<mimetype>;base64,<encoded_data>'."
      ),
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
  // Updated prompt to handle both problem text and optional problem image
  prompt: `Ești un expert în rezolvarea problemelor de fizică și un evaluator corect. Analizează problema de fizică descrisă mai jos (fie prin text, fie prin imagine, fie ambele) și soluția încercată de utilizator, prezentată în imaginile următoare.

{{#if problemText}}
Textul Problemei:
{{{problemText}}}
{{/if}}

{{#if problemPhotoDataUri}}
Imaginea Problemei:
{{media url=problemPhotoDataUri}}
{{/if}}

Imagini cu Soluția Utilizatorului:
{{#each solutionPhotoDataUris}}
Imagine Soluție (Index {{@index}}):
{{media url=this}}
{{/each}}

Compară soluția utilizatorului din imagini cu un barem de corectare intern standard pentru problema dată (identificată din text și/sau imagine). Baremul presupune un total de 10 puncte, distribuite logic pe pașii rezolvării (ex: identificare date corecte, aplicare formulă corectă, calcul numeric corect, unitate de măsură corectă etc.). Analizează toate imaginile furnizate pentru a înțelege complet soluția utilizatorului.

Răspunde exclusiv în limba română.

Oferă următoarele informații:
1.  **Soluția corectă:** Prezintă pașii detaliați și rezultatul final corect al problemei identificate din text și/sau imagine.
2.  **Analiza erorilor:** Evidențiază orice greșeală făcută în soluția din imagini. Explică de ce este o greșeală. Dacă soluția din imagini este complet corectă, menționează explicit: "Soluția prezentată în imagini este corectă. Nu au fost detectate erori."
3.  **Punctaj:** Calculează și returnează un punctaj sub formă de "X/10 puncte", unde X este numărul de puncte acordate pe baza corectitudinii soluției din imagini, conform baremului intern descris mai sus.`,
});

const analyzePhysicsProblemFlow = ai.defineFlow<
  typeof AnalyzePhysicsProblemInputSchema,
  typeof AnalyzePhysicsProblemOutputSchema
>(
  {
    name: 'analyzePhysicsProblemFlowV4', // Increment version due to input/prompt change
    inputSchema: AnalyzePhysicsProblemInputSchema,
    outputSchema: AnalyzePhysicsProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

