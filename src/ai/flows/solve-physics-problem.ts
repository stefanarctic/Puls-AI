'use server';
/**
 * @fileOverview Solves a physics problem provided as text and/or an image.
 * Returns structured output per API contract: problemSummary, givenData, numericalResults,
 * formulasUsed, explanation, correctSolution, finalAnswer.
 */

import {runThrottled} from '@/ai/request-throttle';
import {groqChat, type GroqChatMessage} from '@/ai/groq';
import {z} from 'genkit';
import type {SolveContractOutput} from '@/ai/types/api-contract';
import {normalizeFormulasUsed, normalizeNumericalArray} from '@/ai/types/api-contract';

// Input schema
const SolvePhysicsProblemInputSchema = z.object({
  problemText: z.string().optional().describe('Textul problemei de fizică (opțional dacă se furnizează imaginea problemei).'),
  problemPhotoDataUri: z
    .string()
    .optional()
    .describe(
      "O fotografie a enunțului problemei, ca data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  additionalContext: z.string().optional().describe('Context adițional sau instrucțiuni specifice pentru rezolvare (opțional).'),
}).refine((data) => data.problemText || data.problemPhotoDataUri, {
  message: 'Trebuie furnizat cel puțin textul problemei sau o imagine a problemei.',
  path: ['problemText', 'problemPhotoDataUri'],
});

export type SolvePhysicsProblemInput = z.infer<typeof SolvePhysicsProblemInputSchema>;

/** @deprecated Use SolveContractOutput */
export type SolvePhysicsProblemOutput = SolveContractOutput;

const SYSTEM_PROMPT = `Ești un expert în rezolvarea problemelor de fizică. Răspunde exclusiv în limba română și oferă soluții FOARTE DETALIATE pas cu pas.

REGULI ANTI-DUPLICARE – Fiecare câmp are un rol DISTINCT:
- explanation: doar concepte fizice, strategia de rezolvare, DE CE folosim formula X. FĂRĂ pași numerici, FĂRĂ calcule.
- correctSolution: pașii concreti ai rezolvării, ecuații rezolvate, calcule numerice. FĂRĂ repetarea explicațiilor.
- givenData: array cu date DIN ENUNȚ (m, v, g, etc.) – NU răspunsuri calculate.
- numericalResults: array cu răspunsurile CALCULATE la subpuncte – NU date din enunț.

REGULI IMPORTANTE:
1. Dacă vezi mai multe exerciții în imagine și utilizatorul specifică care exercițiu vrea rezolvat (ex: "ex. 17"), rezolvă DOAR acel exercițiu.
2. Dacă nu este clar care exercițiu să rezolvi, întreabă în câmpul "correctSolution".
3. Interzis placeholder-e: „Explicații detaliate...”, „Vom detalia pașii”, „Vom calcula” – oferă conținut REAL.
4. OBLIGATORIU: finalAnswer și numericalResults trebuie să conțină VALORI NUMERICE REALE (ex: T = 15 N, μ = 0.25). INTERZIS să pui „Vom calcula” sau alte fraze generice – calculează efectiv și scrie rezultatele.
5. În numericalResults, fiecare obiect {label, value, unit?} trebuie să aibă value populat cu numărul calculat (ex: value: "15" pentru T=15 N).
6. OBLIGATORIU: Returnează un răspuns valid în format JSON.

Returnează JSON cu cheile: problemSummary, givenData (array de {label, value, unit?}), numericalResults (array de {label, value, unit?}), formulasUsed (array de string-uri), explanation, correctSolution, finalAnswer.

Limbaj: folosește „vom” în explicații (ex: „vom aplica legea a doua”) – nu în finalAnswer. finalAnswer = doar răspunsul numeric final.`;

const JSON_KEYS_HINT = `Returnează un JSON valid cu cheile: problemSummary, givenData, numericalResults, formulasUsed, explanation, correctSolution, finalAnswer.`;

async function callGroqSolve(input: SolvePhysicsProblemInput): Promise<SolveContractOutput> {
  const content: Array<
    | {type: 'text'; text: string}
    | {type: 'image_url'; image_url: {url: string}}
  > = [{type: 'text', text: `Textul Problemei:${input.problemText ? `\n${input.problemText}` : ' (nu este furnizat text)'}`}];

  if (input.problemPhotoDataUri) {
    content.push({type: 'image_url', image_url: {url: input.problemPhotoDataUri}});
  }

  if (input.additionalContext) {
    content.push({type: 'text', text: `Context Adițional/Exercițiul dorit: ${input.additionalContext}`});
  }

  content.push({type: 'text', text: JSON_KEYS_HINT});

  const messages: GroqChatMessage[] = [
    {role: 'system', content: [{type: 'text', text: SYSTEM_PROMPT}]},
    {role: 'user', content},
  ];

  const responseContent: string = await runThrottled(() => groqChat(messages, {max_tokens: 4000}));

  const fallback: SolveContractOutput = {
    problemSummary: '',
    givenData: undefined,
    numericalResults: undefined,
    formulasUsed: [],
    explanation: 'A apărut o problemă în procesarea cererii. Verifică dacă imaginea este clară și textul este lizibil.',
    correctSolution: 'Nu am putut genera un răspuns. Te rog încearcă din nou sau reformulează cererea.',
    finalAnswer: 'Răspuns indisponibil - te rog încearcă din nou.',
  };

  if (!responseContent || responseContent.trim().length === 0) {
    return fallback;
  }

  const safeToString = (value: unknown): string => {
    if (value == null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const normalizeFinalAnswer = (value: unknown): string => {
    try {
      if (value == null) return '';
      if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('; ');
      if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).map(
          ([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`
        );
        return entries.join('; ');
      }
      if (typeof value === 'string') {
        const s = value.trim();
        if (!s) return '';
        if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
          return normalizeFinalAnswer(JSON.parse(s));
        }
        return s;
      }
      return String(value);
    } catch {
      return String(value ?? '');
    }
  };

  const tryParsers: Array<() => unknown> = [
    () => {
      const fenced = responseContent.match(/```json\s*([\s\S]*?)\s*```/i);
      return fenced ? JSON.parse(fenced[1]) : undefined;
    },
    () => {
      const fenced = responseContent.match(/```\s*([\s\S]*?)\s*```/);
      return fenced ? JSON.parse(fenced[1]) : undefined;
    },
    () => {
      const brace = responseContent.match(/\{[\s\S]*\}/);
      return brace ? JSON.parse(brace[0]) : undefined;
    },
    () => JSON.parse(responseContent),
  ];

  let parsed: Record<string, unknown> | undefined;
  for (const parse of tryParsers) {
    try {
      const res = parse();
      if (res && typeof res === 'object') {
        parsed = res as Record<string, unknown>;
        break;
      }
    } catch {
      // try next
    }
  }

  const json = parsed ?? {};
  const givenData = normalizeNumericalArray(json.givenData);
  const numericalResults = normalizeNumericalArray(json.numericalResults);
  const formulasUsed = normalizeFormulasUsed(json.formulasUsed ?? json.formulas);

  let correctSolution = safeToString(json.correctSolution ?? json.solution);
  let explanation = safeToString(json.explanation);

  const stripEmbeddedJson = (s: string): string => {
    const t = s.trim();
    if (t.startsWith('{') && (t.includes('"problemSummary"') || t.includes('"correctSolution"') || t.includes('"givenData"'))) {
      try {
        const parsed = JSON.parse(t) as Record<string, unknown>;
        const sol = String(parsed.correctSolution ?? parsed.solution ?? '').trim();
        return sol || t;
      } catch {
        return s;
      }
    }
    return s;
  };
  correctSolution = stripEmbeddedJson(correctSolution);
  explanation = stripEmbeddedJson(explanation);
  let finalAnswer = normalizeFinalAnswer(json.finalAnswer).replace(/\s*\n\s*/g, '; ').replace(/\s{2,}/g, ' ').trim();

  const looksLikePlaceholder = (txt: string) => {
    const t = txt.trim().toLowerCase();
    return !t || t === 'placeholder' || t.includes('explicații detaliate pentru fiecare pas') || t === 'explicații detaliate';
  };
  const looksLikeFinalAnswerPlaceholder = (txt: string) => {
    const t = txt.trim().toLowerCase();
    return !t || t === 'vom calcula.' || t === 'vom calcula' || t.startsWith('vom calcula') ||
      t === 'vom detalia' || t.includes('vom calcula') && t.length < 50;
  };
  if (looksLikePlaceholder(explanation) && correctSolution) {
    explanation = correctSolution;
  }
  if (looksLikeFinalAnswerPlaceholder(finalAnswer) && correctSolution) {
    const resultLines = correctSolution.split('\n').filter((l) => /\d+[.,]?\d*\s*(N|kg|m\/s|°|rad)/i.test(l) || /[TμR]\s*=\s*[\d.,]+/i.test(l));
    finalAnswer = resultLines.length > 0
      ? resultLines.slice(-3).join('; ')
      : 'Verifică pașii rezolvării pentru valorile numerice calculate.';
  }

  if (!correctSolution && !explanation && !finalAnswer) {
    fallback.correctSolution = responseContent || 'Conținut indisponibil';
    return fallback;
  }

  return {
    problemSummary: safeToString(json.problemSummary).trim() || undefined,
    givenData: givenData.length > 0 ? givenData : undefined,
    numericalResults: numericalResults.length > 0 ? numericalResults : undefined,
    formulasUsed: formulasUsed.length > 0 ? formulasUsed : undefined,
    explanation: explanation.trim() || undefined,
    correctSolution: correctSolution.trim() || fallback.correctSolution,
    finalAnswer: finalAnswer || undefined,
  };
}

export async function solvePhysicsProblem(input: SolvePhysicsProblemInput): Promise<SolveContractOutput> {
  return callGroqSolve(input);
}
