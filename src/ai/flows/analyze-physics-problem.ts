'use server';
/**
 * @fileOverview Analyzes a physics problem provided as text and/or an image, and a user's solution attempt.
 * Returns structured output per API contract: rating, problemSummary, feedbackSummary, givenData,
 * numericalResults, formulasUsed, explanation, correctSolution, errorAnalysis, finalAnswer.
 */

import {runThrottled} from '@/ai/request-throttle';
import {groqChat, type GroqChatMessage} from '@/ai/groq';
import {z} from 'genkit';
import type {AnalyzeContractOutput} from '@/ai/types/api-contract';
import {
  normalizeFormulasUsed,
  normalizeNumericalArray,
  normalizeRating,
} from '@/ai/types/api-contract';

// Input schema
const AnalyzePhysicsProblemInputSchema = z.object({
  problemText: z.string().optional().describe('Textul problemei de fizică (opțional dacă se furnizează imaginea problemei).'),
  problemPhotoDataUri: z.string().optional().describe(
    "O fotografie a enunțului problemei, ca data URI (opțional dacă se furnizează textul problemei). Format așteptat: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  solutionText: z.string().optional().describe('Textul soluției utilizatorului (opțional dacă se furnizează imagini cu soluția).'),
  solutionPhotoDataUris: z
    .array(z.string().describe("A photo of the user's attempt/solution, as a data URI."))
    .optional()
    .describe('O listă cu imaginile soluției utilizatorului, sub formă de data URI.'),
  additionalContext: z.string().optional().describe('Context adițional sau instrucțiuni specifice pentru analiză (opțional).'),
})
  .refine((data) => data.problemText || data.problemPhotoDataUri, {
    message: 'Trebuie furnizat cel puțin textul problemei sau o imagine a problemei.',
    path: ['problemText', 'problemPhotoDataUri'],
  })
  .refine((data) => data.solutionText || (data.solutionPhotoDataUris && data.solutionPhotoDataUris.length > 0), {
    message: 'Trebuie furnizat cel puțin textul soluției sau cel puțin o imagine cu soluția.',
    path: ['solutionText', 'solutionPhotoDataUris'],
  });

export type AnalyzePhysicsProblemInput = z.infer<typeof AnalyzePhysicsProblemInputSchema>;

/** @deprecated Use AnalyzeContractOutput */
export type AnalyzePhysicsProblemOutput = AnalyzeContractOutput;

export async function analyzePhysicsProblem(input: AnalyzePhysicsProblemInput): Promise<AnalyzeContractOutput> {
  return callGroqAnalyze(input);
}

const SYSTEM_PROMPT = `Ești un expert în rezolvarea problemelor de fizică și un evaluator corect și flexibil. Analizează problema (text și/sau imagine) și soluția utilizatorului. Aplică toleranță rezonabilă la aproximări numerice. Răspunde exclusiv în limba română.

REGULI ANTI-DUPLICARE – Fiecare câmp are un rol DISTINCT:
- explanation: doar concepte fizice, strategia de rezolvare, DE CE folosim formula X. FĂRĂ pași numerici, FĂRĂ calcule.
- correctSolution: pașii concreti ai rezolvării, ecuații rezolvate, calcule numerice. FĂRĂ repetarea explicațiilor.
- errorAnalysis: DOAR greșelile făcute de elev și ce ar fi trebuit corect. FĂRĂ pașii soluției corecte, FĂRĂ explicat concepte.
- givenData: array cu date DIN ENUNȚ (m, v, g, etc.) – NU răspunsuri calculate.
- numericalResults: array cu răspunsurile CALCULATE la subpuncte – NU date din enunț.

Returnează un JSON cu câmpurile: problemSummary, feedbackSummary, givenData (array de {label, value, unit?}), numericalResults (array de {label, value, unit?}), formulasUsed (array de string-uri), explanation, correctSolution, errorAnalysis, finalAnswer, rating (string "X/10 puncte" sau obiect {obtained: number, max: number}).

OBLIGATORIU: finalAnswer și numericalResults trebuie să conțină VALORI NUMERICE REALE – calculează efectiv. INTERZIS placeholders: „Vom calcula”, „Vom detalia” etc.

Dacă analizezi imagini cu soluția elevului, adaugă și câmpul studentWorkReflection: o scurtă reflecție despre lucrarea elevului.

Limbaj: folosește „vom” în explicații (ex: „vom aplica legea”) – nu pune „Vom calcula” în finalAnswer. finalAnswer = doar răspunsul numeric final.`;

const JSON_KEYS_HINT = `Returnează un JSON valid cu cheile: problemSummary, feedbackSummary, givenData, numericalResults, formulasUsed, explanation, correctSolution, errorAnalysis, finalAnswer, rating.`;

async function callGroqAnalyze(input: AnalyzePhysicsProblemInput): Promise<AnalyzeContractOutput> {
  const content: Array<
    | {type: 'text'; text: string}
    | {type: 'image_url'; image_url: {url: string}}
  > = [{type: 'text', text: `Textul Problemei:${input.problemText ? `\n${input.problemText}` : ' (nedatat)'}`}];

  if (input.problemPhotoDataUri) {
    content.push({type: 'image_url', image_url: {url: input.problemPhotoDataUri}});
  }

  if (input.additionalContext) {
    content.push({type: 'text', text: `Context Adițional: ${input.additionalContext}`});
  }

  if (input.solutionText) {
    content.push({type: 'text', text: `Textul Soluției Utilizatorului:\n${input.solutionText}`});
  }

  const hasSolutionImages = input.solutionPhotoDataUris && input.solutionPhotoDataUris.length > 0;
  if (hasSolutionImages) {
    content.push({type: 'text', text: 'Imagini cu Soluția Utilizatorului (urmează una sau mai multe):'});
    for (const url of input.solutionPhotoDataUris!) {
      content.push({type: 'image_url', image_url: {url}});
    }
  }

  content.push({type: 'text', text: JSON_KEYS_HINT});

  const messages: GroqChatMessage[] = [
    {role: 'system', content: [{type: 'text', text: SYSTEM_PROMPT}]},
    {role: 'user', content},
  ];

  const responseContent = await runThrottled(() => groqChat(messages, {max_tokens: 3000}));

  const fallback: AnalyzeContractOutput = {
    problemSummary: '',
    feedbackSummary: '',
    givenData: [],
    numericalResults: [],
    formulasUsed: [],
    explanation: '',
    correctSolution: '',
    errorAnalysis: 'Analiza erorilor este inclusă în textul de mai sus.',
    finalAnswer: '',
    rating: '—/10 puncte',
  };

  try {
    const match = responseContent.match(/\{[\s\S]*\}$/);
    const raw = match ? match[0] : responseContent;
    const json = JSON.parse(raw) as Record<string, unknown>;

    const rating = normalizeRating(json.rating);
    const givenData = normalizeNumericalArray(json.givenData);
    const numericalResults = normalizeNumericalArray(json.numericalResults);
    const formulasUsed = normalizeFormulasUsed(json.formulasUsed);

    const safeStr = (v: unknown): string => (v != null && typeof v === 'string' ? v : '');
    const stripEmbeddedJson = (s: string, field: 'correctSolution' | 'errorAnalysis' | 'explanation'): string => {
      const t = s.trim();
      if (t.startsWith('{') && t.includes('"correctSolution"')) {
        try {
          const parsed = JSON.parse(t) as Record<string, unknown>;
          const val = parsed[field] ?? (field === 'correctSolution' ? parsed.solution : parsed[field]);
          return (val != null && typeof val === 'string' ? val : '').trim() || s;
        } catch {
          return s;
        }
      }
      return s;
    };

    return {
      problemSummary: safeStr(json.problemSummary).trim() || undefined,
      feedbackSummary: safeStr(json.feedbackSummary).trim() || undefined,
      studentWorkReflection: hasSolutionImages ? safeStr(json.studentWorkReflection).trim() || undefined : undefined,
      givenData: givenData.length > 0 ? givenData : undefined,
      numericalResults: numericalResults.length > 0 ? numericalResults : undefined,
      formulasUsed: formulasUsed.length > 0 ? formulasUsed : undefined,
      explanation: stripEmbeddedJson(safeStr(json.explanation).trim(), 'explanation') || undefined,
      correctSolution: stripEmbeddedJson(safeStr(json.correctSolution || json.solution).trim(), 'correctSolution') || fallback.correctSolution,
      errorAnalysis: stripEmbeddedJson(safeStr(json.errorAnalysis).trim(), 'errorAnalysis') || fallback.errorAnalysis,
      finalAnswer: safeStr(json.finalAnswer).trim() || undefined,
      rating,
    };
  } catch {
    fallback.correctSolution = responseContent;
    return fallback;
  }
}
