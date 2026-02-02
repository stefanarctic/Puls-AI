'use client';

/**
 * ====================================================================================
 * DOCUMENTAȚIE COMPLETĂ - SISTEMUL DE API PULS-AI
 * ====================================================================================
 * 
 * Acest fișier conține documentația completă a sistemului de API pentru aplicația
 * Puls-AI, care oferă funcționalități de rezolvare și analiză a problemelor de fizică.
 * 
 * 
 * 📋 ENDPOINT-URI DISPONIBILE
 * ====================================================================================
 * 
 * 1. POST /api/solve
 *    - Scop: Rezolvă o problemă de fizică și generează o soluție detaliată
 *    - Metodă: POST
 *    - Content-Type: application/json
 *    - CORS: Permis pentru toate originile (*)
 * 
 * 2. POST /api/analyze
 *    - Scop: Analizează o soluție propusă de utilizator și oferă feedback
 *    - Metodă: POST
 *    - Content-Type: application/json
 *    - CORS: Permis pentru toate originile (*)
 * 
 * 
 * 🔧 CONFIGURARE ȘI VARIABILE DE MEDIU
 * ====================================================================================
 * 
 * Variabile necesare în .env:
 * 
 * 1. GROQ_API_KEY (OBLIGATORIU)
 *    - Cheia API pentru serviciul Groq
 *    - Obținută de la: https://console.groq.com/
 *    - Folosită pentru procesarea AI prin API-ul Groq
 * 
 * 2. GROQ_MODEL (OPȚIONAL)
 *    - Modelul AI folosit pentru procesare
 *    - Valoare implicită: 'meta-llama/llama-4-scout-17b-16e-instruct'
 *    - Poate fi suprascris pentru a folosi alte modele Groq
 * 
 * 3. NEXT_PUBLIC_ELEVENLABS_AGENT_ID (OPȚIONAL - pentru flow-ul ElevenLabs)
 *    - ID-ul agentului ElevenLabs pentru conversații în timp real
 *    - Folosit în componenta SolveProblemForm pentru flow-ul alternativ
 * 
 * 
 * 📥 ENDPOINT: POST /api/solve
 * ====================================================================================
 * 
 * DESCRIERE:
 *   Rezolvă o problemă de fizică furnizată ca text și/sau imagine, generând
 *   o soluție detaliată pas cu pas cu explicații, formule și răspuns final.
 * 
 * REQUEST BODY (JSON):
 *   {
 *     "problemText"?: string,              // Textul problemei (opțional dacă există problemPhotoDataUri)
 *     "problemPhotoDataUri"?: string,       // Imaginea problemei ca Data URI (opțional dacă există problemText)
 *     "additionalContext"?: string          // Context adițional sau instrucțiuni specifice (opțional)
 *   }
 * 
 * VALIDARE:
 *   - Trebuie furnizat cel puțin UNUL dintre: problemText SAU problemPhotoDataUri
 *   - Format Data URI: 'data:<mimetype>;base64,<encoded_data>'
 *   - Exemplu: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
 * 
 * RESPONSE SUCCES (200 OK):
 *   {
 *     "solution": string,        // Pașii detaliați ai rezolvării (markdown permis)
 *     "explanation": string,      // Explicații detaliate pentru fiecare pas (markdown permis)
 *     "formulas": string[],       // Array cu formulele folosite (fiecare în format MathJax)
 *     "finalAnswer": string       // Răspunsul final cu unități de măsură
 *   }
 * 
 * RESPONSE EROARE (400 Bad Request):
 *   {
 *     "error": string            // Mesaj de eroare descriptiv
 *   }
 * 
 * EXEMPLE DE UTILIZARE:
 * 
 *   // Exemplu 1: Problemă cu text
 *   fetch('/api/solve', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       problemText: "Un corp cu masa de 2 kg este lansat vertical în sus cu viteza de 20 m/s. Calculați înălțimea maximă atinsă."
 *     })
 *   });
 * 
 *   // Exemplu 2: Problemă cu imagine
 *   const imageDataUri = await fileToDataUri(imageFile);
 *   fetch('/api/solve', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       problemPhotoDataUri: imageDataUri,
 *       additionalContext: "Rezolvă exercițiul 17"
 *     })
 *   });
 * 
 * 
 * 📊 ENDPOINT: POST /api/analyze
 * ====================================================================================
 * 
 * DESCRIERE:
 *   Analizează o soluție propusă de utilizator (furnizată ca imagini) comparând-o
 *   cu soluția corectă, oferind feedback detaliat despre erori și un punctaj.
 * 
 * REQUEST BODY (JSON):
 *   {
 *     "problemText"?: string,                    // Textul problemei (opțional dacă există problemPhotoDataUri)
 *     "problemPhotoDataUri"?: string,            // Imaginea problemei ca Data URI (opțional dacă există problemText)
 *     "solutionText"?: string,                   // Textul soluției utilizatorului (opțional dacă există solutionPhotoDataUris)
 *     "solutionPhotoDataUris"?: string[],        // Array cu imagini ale soluției utilizatorului (opțional dacă există solutionText)
 *     "additionalContext"?: string               // Context adițional pentru analiză (opțional)
 *   }
 * 
 * VALIDARE:
 *   - Trebuie furnizat cel puțin UNUL dintre: problemText SAU problemPhotoDataUri
 *   - Trebuie furnizat cel puțin UNUL dintre: solutionText SAU solutionPhotoDataUris (cu cel puțin 1 element)
 *   - Fiecare Data URI trebuie să respecte formatul: 'data:<mimetype>;base64,<encoded_data>'
 * 
 * RESPONSE SUCCES (200 OK):
 *   {
 *     "solution": string,        // Soluția corectă a problemei (markdown permis)
 *     "errorAnalysis": string,   // Analiza erorilor din soluția utilizatorului (markdown permis)
 *     "rating": string           // Punctajul obținut (ex: "7/10 puncte")
 *   }
 * 
 * RESPONSE EROARE (400 Bad Request):
 *   {
 *     "error": string            // Mesaj de eroare descriptiv
 *   }
 * 
 * EXEMPLE DE UTILIZARE:
 * 
 *   // Exemplu 1: Analiză cu text pentru soluție
 *   fetch('/api/analyze', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       problemText: "Calculați forța de frecare...",
 *       solutionText: "Am aplicat legea a doua a lui Newton..."
 *     })
 *   });
 * 
 *   // Exemplu 2: Analiză cu imagini multiple pentru soluție
 *   const solutionImages = await Promise.all([
 *     fileToDataUri(file1),
 *     fileToDataUri(file2)
 *   ]);
 *   
 *   fetch('/api/analyze', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       problemText: "Calculați forța de frecare...",
 *       solutionPhotoDataUris: solutionImages
 *     })
 *   });
 * 
 * 
 * 🔄 FLUXUL DE PROCESARE
 * ====================================================================================
 * 
 * 1. CLIENT → API ROUTE (/api/solve sau /api/analyze)
 *    - Clientul trimite request-ul cu datele problemei
 *    - Route-ul validează input-ul și gestionează CORS
 * 
 * 2. API ROUTE → SERVER ACTION (handleSolveProblem / handleAnalyzeProblem)
 *    - Route-ul apelează server action-ul corespunzător
 *    - Server action-ul validează din nou input-ul
 * 
 * 3. SERVER ACTION → AI FLOW (solvePhysicsProblem / analyzePhysicsProblem)
 *    - Flow-ul construiește prompt-ul pentru AI
 *    - Gestionează conversiunea imaginilor în format compatibil
 * 
 * 4. AI FLOW → GROQ API
 *    - Trimite request către Groq API cu prompt-ul și imaginile
 *    - Folosește modelul configurat (implicit: llama-4-scout-17b-16e-instruct)
 *    - Gestionează throttling-ul request-urilor
 * 
 * 5. GROQ API → AI FLOW
 *    - Primește răspunsul de la AI
 *    - Parsează JSON-ul din răspuns (suportă multiple formate)
 *    - Validează și sanitizează datele
 * 
 * 6. AI FLOW → SERVER ACTION → API ROUTE → CLIENT
 *    - Returnează rezultatul procesat către client
 *    - Clientul primește răspunsul structurat
 * 
 * 
 * 🛡️ GESTIONAREA EROARILOR
 * ====================================================================================
 * 
 * TIPURI DE EROARE:
 * 
 * 1. Erori de validare (400 Bad Request):
 *    - Input lipsă sau invalid
 *    - JSON malformat
 *    - Validări de schema eșuate
 * 
 * 2. Erori de procesare (500 Internal Server Error):
 *    - Erori la apelarea Groq API
 *    - Erori de parsing JSON
 *    - Erori neașteptate
 * 
 * 3. Erori de timeout:
 *    - Request-urile pot expira dacă procesarea durează prea mult
 *    - Timeout implicit: 60 secunde pentru flow-ul ElevenLabs
 * 
 * MESAJE DE EROARE:
 *   - Toate mesajele de eroare sunt returnate în limba română
 *   - Format consistent: { "error": "mesaj descriptiv" }
 * 
 * 
 * 🔐 SECURITATE ȘI CORS
 * ====================================================================================
 * 
 * CORS CONFIGURATION:
 *   - Access-Control-Allow-Origin: * (permite toate originile)
 *   - Access-Control-Allow-Methods: POST, OPTIONS
 *   - Access-Control-Allow-Headers: Content-Type, Authorization
 * 
 * NOTĂ: Configurația CORS actuală permite accesul de la orice origine.
 *        Pentru producție, ar trebui să restricționați originile permise.
 * 
 * VALIDARE INPUT:
 *   - Toate input-urile sunt validate folosind Zod schemas
 *   - Validare la nivel de route și server action
 *   - Sanitizare a output-urilor pentru prevenirea XSS
 * 
 * 
 * 📝 FORMATE DE DATE
 * ====================================================================================
 * 
 * DATA URI FORMAT:
 *   Format: data:<mimetype>;base64,<base64_encoded_data>
 *   Exemplu: data:image/png;base64,iVBORw0KGgoAAAANS...
 * 
 *   Conversie File → Data URI (JavaScript):
 *     const fileToDataUri = (file: File): Promise<string> => {
 *       return new Promise((resolve, reject) => {
 *         const reader = new FileReader();
 *         reader.onloadend = () => resolve(reader.result as string);
 *         reader.onerror = reject;
 *         reader.readAsDataURL(file);
 *       });
 *     };
 * 
 * MATHJAX FORMAT:
 *   - Formulele matematice trebuie să fie în format MathJax
 *   - Display math: $$formula$$
 *   - Inline math: $formula$
 *   - Exemplu: $$E = mc^2$$ sau $\Delta x = v \cdot t$
 * 
 * MARKDOWN SUPPORT:
 *   - Câmpurile "solution" și "explanation" suportă markdown
 *   - Poți folosi: **bold**, *italic*, liste, link-uri, etc.
 *   - Formulele matematice pot fi integrate în markdown
 * 
 * 
 * 🚀 OPTIMIZĂRI ȘI BEST PRACTICES
 * ====================================================================================
 * 
 * 1. THROTTLING:
 *    - Request-urile către Groq API sunt throttled pentru a evita rate limiting
 *    - Implementat în: src/ai/request-throttle.ts
 * 
 * 2. PARSING ROBUST:
 *    - Sistemul încearcă multiple strategii de parsing JSON din răspunsul AI
 *    - Suportă: ```json ... ```, ``` ... ```, { ... }, raw JSON
 * 
 * 3. VALIDARE MULTIPLĂ:
 *    - Validare la nivel de route
 *    - Validare la nivel de server action
 *    - Validare la nivel de schema Zod
 * 
 * 4. ERROR HANDLING:
 *    - Try-catch blocks la fiecare nivel
 *    - Logging detaliat pentru debugging
 *    - Mesaje de eroare clare pentru utilizator
 * 
 * 
 * 📚 EXEMPLE COMPLETE DE INTEGRARE
 * ====================================================================================
 * 
 * EXEMPLU 1: Rezolvare problemă cu text
 * ```typescript
 * async function solveProblem(problemText: string) {
 *   const response = await fetch('/api/solve', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ problemText })
 *   });
 *   
 *   if (!response.ok) {
 *     const error = await response.json();
 *     throw new Error(error.error);
 *   }
 *   
 *   return await response.json();
 * }
 * ```
 * 
 * EXEMPLU 2: Analiză soluție cu imagini
 * ```typescript
 * async function analyzeSolution(
 *   problemImage: File,
 *   solutionImages: File[]
 * ) {
 *   const problemDataUri = await fileToDataUri(problemImage);
 *   const solutionDataUris = await Promise.all(
 *     solutionImages.map(fileToDataUri)
 *   );
 *   
 *   const response = await fetch('/api/analyze', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       problemPhotoDataUri: problemDataUri,
 *       solutionPhotoDataUris: solutionDataUris
 *     })
 *   });
 *   
 *   if (!response.ok) {
 *     const error = await response.json();
 *     throw new Error(error.error);
 *   }
 *   
 *   return await response.json();
 * }
 * ```
 * 
 * EXEMPLU 3: Utilizare în React Component
 * ```typescript
 * const [result, setResult] = useState(null);
 * const [loading, setLoading] = useState(false);
 * 
 * const handleSolve = async () => {
 *   setLoading(true);
 *   try {
 *     const data = await solveProblem(problemText);
 *     setResult(data);
 *   } catch (error) {
 *     console.error('Error:', error);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * ```
 * 
 * 
 * 🔗 FIȘIERE RELEVANTE
 * ====================================================================================
 * 
 * Route Handlers:
 *   - src/app/api/solve/route.ts          → Endpoint pentru rezolvare
 *   - src/app/api/analyze/route.ts         → Endpoint pentru analiză
 * 
 * Server Actions:
 *   - src/app/actions.ts                  → handleSolveProblem, handleAnalyzeProblem
 * 
 * AI Flows:
 *   - src/ai/flows/solve-physics-problem.ts    → Logica de rezolvare
 *   - src/ai/flows/analyze-physics-problem.ts → Logica de analiză
 * 
 * AI Client:
 *   - src/ai/groq.ts                      → Client Groq API
 *   - src/ai/request-throttle.ts          → Throttling pentru request-uri
 * 
 * Exemple:
 *   - src/app/api-client-example/page.tsx → Exemplu complet de utilizare
 * 
 * 
 * 📞 SUPPORT ȘI CONTRIBUTII
 * ====================================================================================
 * 
 * Pentru întrebări sau probleme:
 *   - Verifică log-urile serverului pentru detalii despre erori
 *   - Asigură-te că toate variabilele de mediu sunt setate corect
 *   - Verifică că request-urile respectă formatul documentat
 * 
 * 
 * ====================================================================================
 * SFÂRȘIT DOCUMENTAȚIE API
 * ====================================================================================
 */

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DropZone from "@/components/ui/drop-zone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Markdown from "@/components/ui/markdown";
import { Upload, CheckCircle, XCircle, FileText, FileImage, Trash2, ListChecks, ClipboardList } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Conversation } from '@elevenlabs/client';
import { Anybody } from 'next/font/google';

interface SolutionImage {
  file: File;
  previewUrl: string;
}

export type SolveProblemFormVariant = 'standalone' | 'embedded';

interface SolveProblemFormProps {
  variant?: SolveProblemFormVariant;
}

interface ElevenLabsSolveResult {
  problemSummary?: string;
  solutionSummary?: string;
  solution?: string;
  explanation?: string;
  formulas?: string[];
  finalAnswer?: string;
}

const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

const containsMathDelimiters = (value: string): boolean => {
  return /(\$\$?|\\\[|\\\(|\\begin\{)/.test(value);
};

const wrapAsDisplayMath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (containsMathDelimiters(trimmed)) return trimmed;
  return `$$${trimmed}$$`;
};

export default function SolveProblemForm({ variant = 'standalone' }: SolveProblemFormProps) {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<SolutionImage | null>(null);
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [solutionResult, setSolutionResult] = useState<ElevenLabsSolveResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null);
  const solveButtonRef = useRef<HTMLButtonElement>(null);
  const solutionResultRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleProblemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProblemImage({ file, previewUrl: reader.result as string });
        setError(null);
        setTimeout(() => {
          solveButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      };
      reader.onerror = (err) => {
        console.error("Error reading problem file:", err);
        setError("A apărut o eroare la citirea imaginii problemei.");
        toast({
          variant: "destructive",
          title: "Eroare la încărcare",
          description: "Nu s-a putut încărca imaginea problemei.",
        });
      };
      reader.readAsDataURL(file);
      if (problemInputRef.current) {
        problemInputRef.current.value = '';
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProblemText(e.target.value);
    setError(null);
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalContext(e.target.value);
    setError(null);
  };

  const removeProblemImage = () => {
    setProblemImage(null);
  };

  const parseAgentResponse = (raw: string): ElevenLabsSolveResult | null => {
    const attemptParsers: Array<() => unknown> = [
      () => {
        const match = raw.match(/```json\s*([\s\S]*?)```/i);
        return match ? JSON.parse(match[1]) : undefined;
      },
      () => {
        const match = raw.match(/```\s*([\s\S]*?)```/);
        return match ? JSON.parse(match[1]) : undefined;
      },
      () => {
        const match = raw.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : undefined;
      },
      () => JSON.parse(raw),
    ];

    for (const parser of attemptParsers) {
      try {
        const result = parser();
        if (result && typeof result === 'object') {
          return result as ElevenLabsSolveResult;
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const requestSolutionFromElevenLabs = async (): Promise<ElevenLabsSolveResult> => {
    if (!ELEVENLABS_AGENT_ID) {
      throw new Error('Lipsește NEXT_PUBLIC_ELEVENLABS_AGENT_ID în mediul de execuție.');
    }

    const userDetails = [
      problemText.trim() ? `Text problemă:\n${problemText.trim()}` : '',
      problemImage?.previewUrl ? `Imagine problemă (Data URI):\n${problemImage.previewUrl}` : '',
      additionalContext.trim() ? `Context suplimentar:\n${additionalContext.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const instructions = `Ești expert în fizică și răspunzi DOAR în limba română. Primești detaliile unei probleme și trebuie să generezi un răspuns structurat.

OBIECTIV: oferă o soluție clară, riguroasă și verificabilă.

REGULI:
1. Începe prin a reformula foarte pe scurt problema în câmpul "problemSummary" (max 2 fraze).
2. Include o sinteză a abordării în câmpul "solutionSummary" (max 3 fraze).
3. Prezintă pașii compleți ai rezolvării în "solution" (markdown permis).
4. Explică conceptele cheie și justificările în "explanation" (markdown permis).
5. Listează formulele folosite în "formulas" ca array de string-uri.
6. Furnizează răspunsul final clar, cu unități, în "finalAnswer".
7. Respectă formatul JSON: {"problemSummary":"","solutionSummary":"","solution":"","explanation":"","formulas":[""],"finalAnswer":""}
8. Dacă informațiile sunt insuficiente, explică situația în toate câmpurile și sugerează clarificări.

IMPORTANT - FORMATARE MATEMATICĂ:
- Pentru TOATE expresiile matematice în "solution" și "explanation", folosește OBLIGATORIU delimitatori MathJax: $$expresie$$
- Exemplu corect: "Formula $$\\Delta x = \\frac{\\lambda}{2}$$ este valabilă pentru sistemele de interferență."
- Exemplu corect: "Diferența de drum este $$\\Delta d = n\\lambda, \\quad n \\in \\mathbb{Z}$$."
- NU lăsa expresiile LaTeX neformatate (fără $$). Toate expresiile matematice trebuie să fie în $$...$$
- Pentru formule simple inline în text, poți folosi $expresie$ (cu un singur $ pe fiecare parte)
- În câmpul "formulas", fiecare formulă trebuie să fie deja în format MathJax cu $$...$$

Nu include text în afara obiectului JSON.`;

    const prompt = `${instructions}

DETALII UTILIZATOR:
${userDetails || 'Utilizatorul nu a furnizat text, doar imaginea atașată.'}`;

    return new Promise((resolve, reject) => {
      let conversationInstance: Conversation | null = null;
      let aiBuffer = '';
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          finishError(new Error('Agentul ElevenLabs nu a răspuns la timp. Încearcă din nou.'));
        }
      }, 60_000);

      const cleanup = async () => {
        clearTimeout(timeoutId);
        if (conversationInstance) {
          try {
            await conversationInstance.endSession();
          } catch {
            // Ignore end session errors
          }
          conversationInstance = null;
        }
      };

      const finishSuccess = async (payload: ElevenLabsSolveResult) => {
        if (settled) return;
        settled = true;
        await cleanup();
        resolve(payload);
      };

      const finishError = async (err: unknown) => {
        if (settled) return;
        settled = true;
        await cleanup();
        if (err instanceof Error) {
          reject(err);
        } else {
          reject(new Error('Conversatia ElevenLabs s-a încheiat cu o eroare.'));
        }
      };

      (async () => {
        try {
          conversationInstance = await Conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        connectionType: 'websocket',
        textOnly: true,
        onMessage: ({ source, message }) => {
          if (source !== 'ai' || !message) return;
          aiBuffer += message;
          const parsed = parseAgentResponse(aiBuffer);
          if (parsed) {
            finishSuccess(parsed);
          }
        },
        onDisconnect: () => {
          if (!settled) {
            finishError(new Error('Conversația s-a închis înainte de a primi răspunsul.'));
          }
        },
        onError: (err: any) => {
          finishError(err instanceof Error ? err : new Error(String(err)));
        },
          });
          conversationInstance.sendUserMessage(prompt);
        } catch (err) {
          finishError(err);
        }
      })();
    });
  };

  const handleSubmit = async () => {
    if (!problemText.trim() && !problemImage) {
      setError('Te rog introdu textul problemei SAU încarcă o imagine a problemei.');
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Te rog introdu textul problemei SAU încarcă o imagine a problemei.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSolutionResult(null);

    try {
      const result = await requestSolutionFromElevenLabs();
      const sanitized: ElevenLabsSolveResult = {
        problemSummary: result.problemSummary?.trim() || '',
        solutionSummary: result.solutionSummary?.trim() || '',
        solution: result.solution?.trim() || '',
        explanation: result.explanation?.trim() || '',
        formulas: Array.isArray(result.formulas) ? result.formulas : [],
        finalAnswer: result.finalAnswer?.trim() || '',
      };

      setSolutionResult(sanitized);
      setTimeout(() => {
        solutionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      toast({
        title: "Succes",
        description: "Agentul ElevenLabs a generat o soluție.",
      });
    } catch (err) {
      console.error('Error solving problem via ElevenLabs:', err);
      const message = err instanceof Error ? err.message : 'A apărut o eroare necunoscută la rezolvarea problemei.';
      setError(message);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="problem-text" className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Textul Problemei (Opțional)
          </Label>
          <Textarea
            id="problem-text"
            placeholder="Scrie aici enunțul problemei..."
            value={problemText}
            onChange={handleTextChange}
            className="h-32 resize-none"
            disabled={!!problemImage}
          />
        </div>

        <div className="text-center text-sm text-muted-foreground font-medium my-2">SAU</div>

        <div className="space-y-2">
          <Label htmlFor="problem-image" className="font-semibold flex items-center gap-2">
            <FileImage className="w-4 h-4 text-primary" /> Imagine Problemă (Opțional)
          </Label>
          <Input
            id="problem-image"
            type="file"
            accept="image/*"
            onChange={handleProblemFileChange}
            ref={problemInputRef}
            className="hidden"
            disabled={!!problemText.trim()}
          />
          <DropZone
            accept="image/*"
            multiple={false}
            disabled={!!problemText.trim()}
            onFiles={(files) => {
              const fileList = Array.isArray(files) ? files : Array.from(files)
              if (fileList.length > 0) {
                const fakeEvent = { target: { files: [fileList[0]] } } as unknown as React.ChangeEvent<HTMLInputElement>
                handleProblemFileChange(fakeEvent)
              }
            }}
            className="w-full"
          >
            <div className="flex flex-col items-center gap-2 w-full">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Trage o imagine a problemei sau fă click</span>
            </div>
          </DropZone>
          {problemImage && (
            <div className="mt-4 relative">
              <img
                src={problemImage.previewUrl}
                alt="Previzualizare problemă"
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeProblemImage}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <Label htmlFor="additional-context" className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Context Adițional / Exercițiul Dorit (Opțional)
          </Label>
          <Textarea
            id="additional-context"
            placeholder="Specifică care exercițiu vrei rezolvat dacă sunt mai multe în imagine..."
            value={additionalContext}
            onChange={handleContextChange}
            className="h-24 resize-none"
          />
          <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
            💡 <strong>Sfat:</strong> Dacă încarci o imagine cu mai multe exerciții, specifică aici care exercițiu vrei rezolvat pentru a primi o soluție precisă.
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        ref={solveButtonRef}
        onClick={handleSubmit}
        disabled={isLoading || (!problemText.trim() && !problemImage)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isLoading ? 'Se rezolvă problema...' : 'Rezolvă Problema'}
      </Button>

      {isLoading && (
        <div className="space-y-2">
          <Progress value={undefined} className="w-full" />
          <p className="text-center text-sm text-muted-foreground">
            Se rezolvă problema...
          </p>
        </div>
      )}

      {solutionResult && (
        <div ref={solutionResultRef} className="space-y-6 mt-6 border-t pt-6">
          <div className="space-y-6">
            {(solutionResult.problemSummary || solutionResult.solutionSummary) && (
              <div className="grid gap-4 md:grid-cols-2">
                {solutionResult.problemSummary && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Rezumat Problemă
                    </h3>
                    <div className="prose max-w-none text-slate-900">
                      <Markdown>{solutionResult.problemSummary}</Markdown>
                    </div>
                  </div>
                )}
                {solutionResult.solutionSummary && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                      <ListChecks className="h-4 w-4" />
                      Rezumat Rezolvare
                    </h3>
                    <div className="prose max-w-none text-slate-900">
                      <Markdown>{solutionResult.solutionSummary}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {solutionResult.solution && (
              <div className={`p-4 rounded-lg border ${
                solutionResult.solution.toLowerCase().includes('văd mai multe exerciții') ||
                solutionResult.solution.toLowerCase().includes('te rog specifică') ||
                solutionResult.solution.toLowerCase().includes('nu este clar')
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                  solutionResult.solution.toLowerCase().includes('văd mai multe exerciții') ||
                  solutionResult.solution.toLowerCase().includes('te rog specifică') ||
                  solutionResult.solution.toLowerCase().includes('nu este clar')
                    ? 'text-orange-800'
                    : 'text-blue-800'
                }`}>
                  {solutionResult.solution.toLowerCase().includes('văd mai multe exerciții') ||
                   solutionResult.solution.toLowerCase().includes('te rog specifică') ||
                   solutionResult.solution.toLowerCase().includes('nu este clar')
                    ? '❓ Clarificare Necesară:'
                    : '📋 Pașii Rezolvării:'
                  }
                </h3>
                <div className={`prose max-w-none ${
                  solutionResult.solution.toLowerCase().includes('văd mai multe exerciții') ||
                  solutionResult.solution.toLowerCase().includes('te rog specifică') ||
                  solutionResult.solution.toLowerCase().includes('nu este clar')
                    ? 'text-orange-900'
                    : 'text-blue-900'
                }`}>
                  <Markdown>{solutionResult.solution}</Markdown>
                </div>
                {(solutionResult.solution.toLowerCase().includes('văd mai multe exerciții') ||
                  solutionResult.solution.toLowerCase().includes('te rog specifică') ||
                  solutionResult.solution.toLowerCase().includes('nu este clar')) && (
                  <div className="mt-3 p-3 bg-orange-100 rounded border border-orange-300">
                    <p className="text-sm text-orange-800 font-medium">
                      💡 Pentru a continua, te rog să specifici în câmpul "Context Adițional" care exercițiu vrei rezolvat, apoi apasă din nou "Rezolvă Problema".
                    </p>
                  </div>
                )}
              </div>
            )}

            {solutionResult.explanation && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                  💡 Explicații Detaliate:
                </h3>
                <div className="prose max-w-none text-green-900">
                  <Markdown>{solutionResult.explanation}</Markdown>
                </div>
              </div>
            )}

            {solutionResult.formulas && solutionResult.formulas.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
                  🧮 Formule Folosite:
                </h3>
                <div className="space-y-3">
                  {solutionResult.formulas.map((formula, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-purple-100">
                      <div className="prose max-w-none text-purple-900">
                        <Markdown>{wrapAsDisplayMath(formula)}</Markdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {solutionResult.finalAnswer && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold mb-3 text-yellow-800 flex items-center gap-2">
                  🎯 Răspuns Final:
                </h3>
                <div className="bg-white p-4 rounded border border-yellow-100">
                  <div className="text-lg font-medium prose max-w-none text-yellow-900">
                    <Markdown>{solutionResult.finalAnswer}</Markdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'embedded') {
    return formContent;
  }

  return (
    <div className="space-y-6">
      {formContent}
    </div>
  );
}


