'use server';
/**
 * @fileOverview Solves a physics problem provided as text and/or an image, and provides a detailed solution in Romanian.
 *
 * - solvePhysicsProblem - A function that handles the physics problem solving process.
 * - SolvePhysicsProblemInput - The input type for the solvePhysicsProblem function.
 * - SolvePhysicsProblemOutput - The return type for the solvePhysicsProblem function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema
const SolvePhysicsProblemInputSchema = z.object({
  problemText: z.string().optional().describe('Textul problemei de fizică (opțional dacă se furnizează imaginea problemei).'),
  problemPhotoDataUri: z.string().optional().describe(
    "O fotografie a enunțului problemei, ca data URI (opțional dacă se furnizează textul problemei). Format așteptat: 'data:<mimetype>;base64,<encoded_data>'."
  ),
}).refine(data => data.problemText || data.problemPhotoDataUri, {
  message: "Trebuie furnizat cel puțin textul problemei sau o imagine a problemei.",
  path: ["problemText", "problemPhotoDataUri"],
});

export type SolvePhysicsProblemInput = z.infer<typeof SolvePhysicsProblemInputSchema>;

// Output schema
const SolvePhysicsProblemOutputSchema = z.object({
  solution: z.string().describe('Soluția detaliată a problemei de fizică, în limba română.'),
  explanation: z.string().describe('Explicații detaliate pentru fiecare pas al rezolvării, în limba română.'),
  formulas: z.array(z.string()).describe('Formulele folosite în rezolvare, cu explicații.'),
  finalAnswer: z.string().describe('Răspunsul final al problemei, cu unitățile de măsură corecte.'),
});

export type SolvePhysicsProblemOutput = z.infer<typeof SolvePhysicsProblemOutputSchema>;

const prompt = ai.definePrompt({
  name: 'solvePhysicsProblemPromptRomanian',
  input: {
    schema: z.object({
      problemText: z.string().optional().describe('Textul problemei de fizică.'),
      problemPhotoDataUri: z.string().optional().describe(
        "O fotografie a enunțului problemei, ca data URI. Format așteptat: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    }),
  },
  output: {
    schema: SolvePhysicsProblemOutputSchema,
  },
  prompt: `Ești un expert în rezolvarea problemelor de fizică. Analizează problema de fizică descrisă mai jos (fie prin text, fie prin imagine, fie ambele) și oferă o soluție detaliată.

{{#if problemText}}
Textul Problemei:
{{{problemText}}}
{{/if}}

{{#if problemPhotoDataUri}}
Imaginea Problemei:
{{media url=problemPhotoDataUri}}
{{/if}}

Răspunde exclusiv în limba română și oferă următoarele informații:
1. **Soluția detaliată:** Prezintă pașii detaliați ai rezolvării, cu explicații pentru fiecare pas.
2. **Explicații:** Oferă explicații clare pentru fiecare pas al rezolvării, inclusiv de ce se folosesc anumite formule sau metode.
3. **Formule:** Listează toate formulele folosite în rezolvare, cu explicații despre când și de ce se folosesc.
4. **Răspuns final:** Prezintă răspunsul final al problemei, cu unitățile de măsură corecte.`,
});

const solvePhysicsProblemFlow = ai.defineFlow<
  typeof SolvePhysicsProblemInputSchema,
  typeof SolvePhysicsProblemOutputSchema
>({
  name: 'solvePhysicsProblemFlow',
  inputSchema: SolvePhysicsProblemInputSchema,
  outputSchema: SolvePhysicsProblemOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});

export async function solvePhysicsProblem(input: SolvePhysicsProblemInput): Promise<SolvePhysicsProblemOutput> {
  return solvePhysicsProblemFlow(input);
} 