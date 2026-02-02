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

// Input schema with additional context field
const SolvePhysicsProblemInputSchema = z.object({
  problemText: z.string().optional().describe('Textul problemei de fizică (opțional dacă se furnizează imaginea problemei).'),
  problemPhotoDataUri: z.string().optional().describe(
    "O fotografie a enunțului problemei, ca data URI (opțional dacă se furnizează textul problemei). Format așteptat: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  additionalContext: z.string().optional().describe('Context adițional sau instrucțiuni specifice pentru rezolvare (opțional).'),
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

const SYSTEM_PROMPT = `Ești un expert în rezolvarea problemelor de fizică. Răspunde exclusiv în limba română și oferă soluții FOARTE DETALIATE pas cu pas.

REGULI IMPORTANTE:
1. Dacă vezi mai multe exerciții în imagine și utilizatorul specifică care exercițiu vrea rezolvat (ex: "ex. 17", "exercițiul 17", "problema 17"), rezolvă DOAR acel exercițiu specificat
2. Dacă vezi mai multe exerciții dar nu este clar care să fie rezolvat, întreabă: "Văd mai multe exerciții în imagine. Te rog specifică care exercițiu vrei să rezolv (ex: exercițiul 16, exercițiul 17, etc.)"
3. Fiecare explicație trebuie să fie EXTREM DE DETALIATĂ - explică fiecare pas, de ce folosești acea formulă, cum faci calculele
4. Nu da doar răspunsul final - arată tot procesul de gândire
5. Interzis să scrii placeholder-e de tipul „Explicații detaliate pentru fiecare pas al problemei.”, „Vom detalia pașii” sau texte generice fără conținut. Oferă conținut real în fiecare câmp.
6. OBLIGATORIU: Returnează întotdeauna un răspuns valid în format JSON, chiar dacă nu poți rezolva problema (de ex., explică motivul în câmpul solution/explanation).

STRUCTURA RĂSPUNSULUI:
- solution: Pașii detaliați cu toate calculele intermediare
- explanation: Explicații detaliate pentru fiecare pas (de ce faci așa, ce principii fizice aplici)
- formulas: Toate formulele folosite cu explicații
- finalAnswer: Răspunsul final clar cu unități

Folosește un limbaj care să nu facă referință la tine ca AI. Spune "vom calcula" în loc de "voi calcula"."`;

async function callGroqSolve(input: SolvePhysicsProblemInput): Promise<SolvePhysicsProblemOutput> {
  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [
    { type: 'text', text: `Textul Problemei:${input.problemText ? `\n${input.problemText}` : ' (nu este furnizat text)'}` },
  ];

  if (input.problemPhotoDataUri) {
    content.push({ type: 'image_url', image_url: { url: input.problemPhotoDataUri } });
  }

  if (input.additionalContext) {
    content.push({ type: 'text', text: `Context Adițional/Exercițiul dorit: ${input.additionalContext}` });
  }

  content.push({ type: 'text', text: `INSTRUCȚIUNI IMPORTANTE:
1. Dacă vezi mai multe exerciții în imagine, verifică contextul adițional pentru a vedea care exercițiu trebuie rezolvat
2. Dacă contextul specifică "ex. 17" sau "exercițiul 17", caută și rezolvă DOAR exercițiul cu numărul 17 din imagine
3. Dacă nu este clar care exercițiu să rezolvi, întreabă în câmpul "solution"
4. Oferă explicații FOARTE detaliate pentru fiecare pas - nu doar calculele, ci și raționamentul
5. OBLIGATORIU: Returnează întotdeauna un răspuns valid în format JSON
6. Returnează un JSON cu cheile: solution (pași detaliați), explanation (explicații detaliate), formulas (array cu formule), finalAnswer (răspuns final cu unități)` });

  const messages: GroqChatMessage[] = [
    { role: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
    { role: 'user', content },
  ];

  const responseContent: string = await runThrottled(() => groqChat(messages, { max_tokens: 4000 }));

  // Debug logging
  console.log('AI Response content:', responseContent);
  console.log('Content length:', responseContent?.length || 0);

  // Handle empty or null content
  if (!responseContent || responseContent.trim().length === 0) {
    return {
      solution: 'Nu am putut genera un răspuns. Te rog încearcă din nou sau reformulează cererea.',
      explanation: 'A apărut o problemă în procesarea cererii. Verifică dacă imaginea este clară și textul este lizibil.',
      formulas: [],
      finalAnswer: 'Răspuns indisponibil - te rog încearcă din nou.'
    };
  }

  let solution = '';
  let explanation = '';
  let formulas: string[] = [];
  let finalAnswer = '';
  try {
    // Try multiple strategies to robustly extract JSON from LLM output
    const tryParsers: Array<() => unknown> = [
      // 1) ```json ... ``` fenced block
      () => {
        const fenced = responseContent.match(/```json\s*([\s\S]*?)\s*```/i);
        return fenced ? JSON.parse(fenced[1]) : undefined;
      },
      // 2) Any fenced block without language
      () => {
        const fenced = responseContent.match(/```\s*([\s\S]*?)\s*```/);
        return fenced ? JSON.parse(fenced[1]) : undefined;
      },
      // 3) First {...} block (greedy enough to include nested braces)
      () => {
        const brace = responseContent.match(/\{[\s\S]*?\}/);
        return brace ? JSON.parse(brace[0]) : undefined;
      },
      // 4) Raw content (last resort)
      () => JSON.parse(responseContent),
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

    // Helper to detect placeholder-y generic text
    const isPlaceholder = (text: unknown): boolean => {
      if (typeof text !== 'string') return false;
      const t = text.trim().toLowerCase();
      if (!t) return true;
      return (
        t === 'placeholder' ||
        t.includes('explicații detaliate pentru fiecare pas') ||
        t.includes('explicații detaliate') && t.length < 120 ||
        t.startsWith('explicații:') && t.length < 40
      );
    };

    // Helper to normalize final answer into a readable string
    const normalizeFinalAnswer = (value: unknown): string => {
      try {
        if (value == null) return '';
        if (Array.isArray(value)) {
          return value.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join('; ');
        }
        if (typeof value === 'object') {
          const entries = Object.entries(value as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
          return entries.join('; ');
        }
        if (typeof value === 'string') {
          const s = value.trim();
          if (!s) return '';
          // Try to parse if it's JSON-like
          if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
            const parsedJson = JSON.parse(s);
            return normalizeFinalAnswer(parsedJson);
          }
          return s;
        }
        return String(value);
      } catch {
        return String(value ?? '');
      }
    };

    // Helper to safely convert any value to string (handles objects properly)
    const safeToString = (value: unknown): string => {
      try {
        if (value == null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object') {
          // For objects, try to create a readable string representation
          return JSON.stringify(value, null, 2);
        }
        return String(value);
      } catch {
        return String(value ?? '');
      }
    };

    solution = safeToString(json.solution ?? '');
    explanation = safeToString(json.explanation ?? '');
    finalAnswer = normalizeFinalAnswer(json.finalAnswer);
    
    const f = json.formulas;
    formulas = Array.isArray(f) ? f.map((s: unknown) => safeToString(s)) : [];
  } catch (error) {
    console.log('JSON parsing failed, using raw content:', error);
    solution = responseContent || 'Conținut indisponibil';
    explanation = 'Explicațiile sunt incluse în textul de mai sus.';
    finalAnswer = 'Verifică soluția de mai sus pentru răspunsul final.';
    formulas = [];
  }

  // Final validation - ensure we have at least some content
  if (!solution && !explanation && !finalAnswer) {
    return {
      solution: 'A apărut o problemă în generarea răspunsului. Conținutul primit de la AI este gol sau invalid.',
      explanation: 'Te rog încearcă din nou. Dacă problema persistă, verifică dacă imaginea este clară și textul cererii este corect.',
      formulas: [],
      finalAnswer: 'Răspuns indisponibil - te rog încearcă din nou.'
    };
  }

  // Post-processing: replace placeholder explanations with actual steps when possible
  const looksLikePlaceholder = (txt: string) => {
    const t = txt.trim().toLowerCase();
    return !t || t === 'placeholder' || t.includes('explicații detaliate pentru fiecare pas') || t === 'explicații detaliate';
  };
  if (looksLikePlaceholder(explanation) && solution) {
    explanation = solution;
  }

  // Ensure finalAnswer is a clean single-line summary (no newlines unless intentional)
  finalAnswer = finalAnswer.replace(/\s*\n\s*/g, '; ').replace(/\s{2,}/g, ' ').trim();

  return { solution, explanation, formulas, finalAnswer };
}

export async function solvePhysicsProblem(input: SolvePhysicsProblemInput): Promise<SolvePhysicsProblemOutput> {
  return callGroqSolve(input);
}