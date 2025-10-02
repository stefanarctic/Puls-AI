'use server';
/**
 * @fileOverview Solves a physics problem provided as text and/or an image, and provides a detailed solution in Romanian.
 *
 * - solvePhysicsProblem - A function that handles the physics problem solving process.
 * - SolvePhysicsProblemInput - The input type for the solvePhysicsProblem function.
 * - SolvePhysicsProblemOutput - The return type for the solvePhysicsProblem function.
 */

import {runThrottled} from '@/ai/request-throttle';
import {groqChat, type GroqChatMessage} from '@/ai/groq';
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

const SYSTEM_PROMPT = `Ești un expert în rezolvarea problemelor de fizică. Răspunde exclusiv în limba română și oferă: 1) Soluția detaliată, 2) Explicații pe pași, 3) Formule folosite, 4) Răspuns final cu unități. Foloseste un limbaj care sa nu faca referinta la tine ca si cum ai fi un AI. Nu mai zice ca voi selecta, zi vom selecta, si in celelalte cazuri la fel.`;

async function callGroqSolve(input: SolvePhysicsProblemInput): Promise<SolvePhysicsProblemOutput> {
  const messages: GroqChatMessage[] = [
    { role: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Textul Problemei:${input.problemText ? `\n${input.problemText}` : ' (nedatat)'}` },
        ...(input.problemPhotoDataUri ? [{ type: 'image_url', image_url: { url: input.problemPhotoDataUri } }] as const : []),
        { type: 'text', text: 'Returnează un JSON cu cheile: solution, explanation, formulas, finalAnswer.' },
      ],
    },
  ];

  const content = await runThrottled(() => groqChat(messages, { max_tokens: 2000 }));

  let solution = '';
  let explanation = '';
  let formulas: string[] = [];
  let finalAnswer = '';
  try {
    // Try multiple strategies to robustly extract JSON from LLM output
    const tryParsers: Array<() => unknown> = [
      // 1) ```json ... ``` fenced block
      () => {
        const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i);
        return fenced ? JSON.parse(fenced[1]) : undefined;
      },
      // 2) Any fenced block without language
      () => {
        const fenced = content.match(/```\s*([\s\S]*?)\s*```/);
        return fenced ? JSON.parse(fenced[1]) : undefined;
      },
      // 3) First {...} block (greedy enough to include nested braces)
      () => {
        const brace = content.match(/\{[\s\S]*?\}/);
        return brace ? JSON.parse(brace[0]) : undefined;
      },
      // 4) Raw content (last resort)
      () => JSON.parse(content),
    ];

    let parsed: any | undefined;
    for (const parse of tryParsers) {
      try {
        const res = parse();
        if (res && typeof res === 'object') {
          parsed = res;
          break;
        }
      } catch {
        // Try next strategy
      }
    }

    const json = parsed ?? {};
    solution = String(json.solution ?? '');
    explanation = String(json.explanation ?? '');
    finalAnswer = String(json.finalAnswer ?? '');
    const f = json.formulas;
    formulas = Array.isArray(f) ? f.map((s: unknown) => String(s)) : [];
  } catch {
    solution = content;
    explanation = 'Explicațiile sunt incluse în textul de mai sus.';
    finalAnswer = '';
    formulas = [];
  }

  return { solution, explanation, formulas, finalAnswer };
}

export async function solvePhysicsProblem(input: SolvePhysicsProblemInput): Promise<SolvePhysicsProblemOutput> {
  return callGroqSolve(input);
}