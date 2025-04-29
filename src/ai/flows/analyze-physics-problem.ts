
'use server';
/**
 * @fileOverview Analyzes a physics problem provided as text and/or an image, and a user's solution attempt as one or more images, compares it against a predefined results table concept, provides a rating, and responds in Romanian. Includes tolerance for numerical approximations.
 *
 * - analyzePhysicsProblem - A function that handles the physics problem analysis process.
 * - AnalyzePhysicsProblemInput - The input type for the analyzePhysicsProblem function.
 * - AnalyzePhysicsProblemOutput - The return type for the analyzePhysicsProblem function.
 */

import {ai} from '@/ai/ai-instance';
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
  return analyzePhysicsProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhysicsProblemPromptRomanianV6', // Increment version due to approximation logic
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
        errorAnalysis: z.string().describe('O analiză a eventualelor erori făcute în soluția prezentată în imagini, în limba română. Dacă nu sunt erori, se specifică acest lucru. Menționează dacă s-a aplicat toleranță numerică.'),
        rating: z.string().describe('Punctajul obținut (ex: "7/10 puncte") bazat pe corectitudinea soluției din imagini în comparație cu baremul intern (cu toleranță la aproximări), în limba română.'),
      }),
  },
  // Updated prompt to handle approximation
  prompt: `Ești un expert în rezolvarea problemelor de fizică și un evaluator corect și flexibil. Analizează problema de fizică descrisă mai jos (fie prin text, fie prin imagine, fie ambele) și soluția încercată de utilizator, prezentată în imaginile următoare.

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

**Important**: La evaluarea calculelor numerice, aplică o toleranță rezonabilă. Acceptă rezultatele utilizatorului dacă sunt **aproximativ egale** cu valoarea corectă (de exemplu, diferențe mici datorate rotunjirilor intermediare sau folosirii unui număr ușor diferit de cifre semnificative). Nu penaliza pentru diferențe numerice minore dacă metoda, formula și unitățile de măsură sunt corecte. Penalizează doar erorile conceptuale, formulele greșite, unitățile de măsură incorecte sau calculele care deviază semnificativ de la rezultatul corect.

Răspunde exclusiv în limba română.

Oferă următoarele informații:
1.  **Soluția corectă:** Prezintă pașii detaliați și rezultatul final corect al problemei identificate din text și/sau imagine.
2.  **Analiza erorilor:** Evidențiază orice greșeală conceptuală, de formulă sau unitate de măsură făcută în soluția din imagini. Explică de ce este o greșeală. Menționează explicit dacă soluția numerică a fost acceptată datorită toleranței la aproximare, chiar dacă diferă ușor de valoarea exactă din barem. Dacă soluția din imagini este complet corectă (inclusiv în limitele toleranței numerice), menționează: "Soluția prezentată în imagini este corectă. Nu au fost detectate erori semnificative (aplicând toleranța pentru aproximări numerice)."
3.  **Punctaj:** Calculează și returnează un punctaj sub formă de "X/10 puncte", unde X este numărul de puncte acordate pe baza corectitudinii soluției din imagini, conform baremului intern și **aplicând toleranța pentru aproximările numerice descrisă mai sus**.`,
});

const analyzePhysicsProblemFlow = ai.defineFlow<
  typeof AnalyzePhysicsProblemInputSchema,
  typeof AnalyzePhysicsProblemOutputSchema
>(
  {
    name: 'analyzePhysicsProblemFlowV5', // Increment version due to approximation logic
    inputSchema: AnalyzePhysicsProblemInputSchema,
    outputSchema: AnalyzePhysicsProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

```</content>
  </change>
  <change>
    <file>src/ai/dev.ts</file>
    <description>Update import statement to reflect the new flow version (analyze-physics-problem.ts).</description>
    <content><![CDATA[
import '@/ai/flows/analyze-physics-problem.ts'; // Keep this import, updated for V5 logic
import '@/ai/flows/detect-error-and-provide-feedback.ts'; // Keep this import as well, even if unused

```