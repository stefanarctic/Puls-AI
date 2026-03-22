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
 * RESPONSE SUCCES (200 OK) - Contract unificat:
 *   {
 *     "problemSummary"?: string,
 *     "givenData"?: { label, value, unit? }[],     // Date din enunț
 *     "numericalResults"?: { label, value, unit? }[],
 *     "formulasUsed"?: string[],
 *     "explanation"?: string,
 *     "correctSolution"?: string,
 *     "finalAnswer"?: string
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
 * RESPONSE SUCCES (200 OK) - Contract unificat:
 *   {
 *     "rating": string | { obtained: number, max: number },
 *     "problemSummary"?: string,
 *     "feedbackSummary"?: string,
 *     "studentWorkReflection"?: string,
 *     "givenData"?: { label, value, unit? }[],
 *     "numericalResults"?: { label, value, unit? }[],
 *     "formulasUsed"?: string[],
 *     "explanation"?: string,
 *     "correctSolution"?: string,
 *     "errorAnalysis"?: string,
 *     "finalAnswer"?: string
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
import { Upload, CheckCircle, XCircle, FileText, FileImage, Trash2, ListChecks, ClipboardList, Calculator } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { handleSolveProblem } from '@/app/actions';
import type { SolveContractOutput, NumericalResult } from '@/ai/types/api-contract';

interface SolutionImage {
  file: File;
  previewUrl: string;
}

export type SolveProblemFormVariant = 'standalone' | 'embedded';

interface SolveProblemFormProps {
  variant?: SolveProblemFormVariant;
}

/** Unified display type: ElevenLabs + API contract (SolveContractOutput) */
interface SolveResultDisplay {
  problemSummary?: string;
  solutionSummary?: string;
  solution?: string;
  correctSolution?: string;
  explanation?: string;
  formulas?: string[];
  formulasUsed?: string[];
  givenData?: NumericalResult[];
  numericalResults?: NumericalResult[];
  finalAnswer?: string;
}

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
  const [solutionResult, setSolutionResult] = useState<SolveResultDisplay | null>(null);
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
      const apiResult = await handleSolveProblem({
        problemText: problemText.trim() || undefined,
        problemPhotoDataUri: problemImage?.previewUrl,
        additionalContext: additionalContext.trim() || undefined,
      });
      if (apiResult.error) throw new Error(apiResult.error);
      if (!apiResult.data) throw new Error('Nu s-a primit răspuns de la server.');
      const data = apiResult.data as SolveContractOutput;
      const result: SolveResultDisplay = {
        problemSummary: data.problemSummary,
        correctSolution: data.correctSolution,
        explanation: data.explanation,
        formulasUsed: data.formulasUsed ?? [],
        givenData: data.givenData,
        numericalResults: data.numericalResults,
        finalAnswer: data.finalAnswer,
      };
      toast({ title: "Succes", description: "Soluția a fost generată." });

      setSolutionResult(result);
      setTimeout(() => {
        solutionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Error solving problem:', err);
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

      {solutionResult && (() => {
        const solutionSteps = solutionResult.correctSolution ?? solutionResult.solution;
        const formulas = solutionResult.formulasUsed ?? solutionResult.formulas ?? [];
        return (
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

            {/* Data tables: givenData and numericalResults (from API contract) */}
            {((solutionResult.givenData?.length ?? 0) > 0 || (solutionResult.numericalResults?.length ?? 0) > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {solutionResult.givenData && solutionResult.givenData.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Date din enunț
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Parametru</th>
                            <th className="text-left py-2">Valoare</th>
                          </tr>
                        </thead>
                        <tbody>
                          {solutionResult.givenData.map((row, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="py-2">{row.label}</td>
                              <td className="py-2">{row.value}{row.unit ? ` ${row.unit}` : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {solutionResult.numericalResults && solutionResult.numericalResults.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Rezultate calculate
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Rezultat</th>
                            <th className="text-left py-2">Valoare</th>
                          </tr>
                        </thead>
                        <tbody>
                          {solutionResult.numericalResults.map((row, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="py-2">{row.label}</td>
                              <td className="py-2">{row.value}{row.unit ? ` ${row.unit}` : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {solutionSteps && (
              <div className={`p-4 rounded-lg border ${
                solutionSteps.toLowerCase().includes('văd mai multe exerciții') ||
                solutionSteps.toLowerCase().includes('te rog specifică') ||
                solutionSteps.toLowerCase().includes('nu este clar')
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                  solutionSteps.toLowerCase().includes('văd mai multe exerciții') ||
                  solutionSteps.toLowerCase().includes('te rog specifică') ||
                  solutionSteps.toLowerCase().includes('nu este clar')
                    ? 'text-orange-800'
                    : 'text-blue-800'
                }`}>
                  {solutionSteps.toLowerCase().includes('văd mai multe exerciții') ||
                   solutionSteps.toLowerCase().includes('te rog specifică') ||
                   solutionSteps.toLowerCase().includes('nu este clar')
                    ? '❓ Clarificare Necesară:'
                    : '📋 Pașii Rezolvării:'
                  }
                </h3>
                <div className={`prose max-w-none ${
                  solutionSteps.toLowerCase().includes('văd mai multe exerciții') ||
                  solutionSteps.toLowerCase().includes('te rog specifică') ||
                  solutionSteps.toLowerCase().includes('nu este clar')
                    ? 'text-orange-900'
                    : 'text-blue-900'
                }`}>
                  <Markdown>{solutionSteps}</Markdown>
                </div>
                {(solutionSteps.toLowerCase().includes('văd mai multe exerciții') ||
                  solutionSteps.toLowerCase().includes('te rog specifică') ||
                  solutionSteps.toLowerCase().includes('nu este clar')) && (
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

            {formulas.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
                  🧮 Formule Folosite:
                </h3>
                <div className="space-y-3">
                  {formulas.map((formula, index) => (
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
        );
      })()}
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


