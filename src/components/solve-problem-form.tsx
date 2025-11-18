'use client';

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DropZone from "@/components/ui/drop-zone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Markdown from "@/components/ui/markdown";
import { Upload, CheckCircle, XCircle, FileText, FileImage, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { SolvePhysicsProblemOutput } from '@/ai/flows/solve-physics-problem';

interface SolutionImage {
  file: File;
  previewUrl: string;
}

export type SolveProblemFormVariant = 'standalone' | 'embedded';

interface SolveProblemFormProps {
  variant?: SolveProblemFormVariant;
}

export default function SolveProblemForm({ variant = 'standalone' }: SolveProblemFormProps) {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<SolutionImage | null>(null);
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [solutionResult, setSolutionResult] = useState<SolvePhysicsProblemOutput | null>(null);
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
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemText: problemText.trim() || undefined,
          problemPhotoDataUri: problemImage?.previewUrl,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }

      setSolutionResult(result);
      setTimeout(() => {
        solutionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      toast({
        title: "Succes",
        description: "Problema a fost rezolvată cu succes.",
      });
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

      {solutionResult && (
        <div ref={solutionResultRef} className="space-y-6 mt-6 border-t pt-6">
          <div className="space-y-6">
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
                        <Markdown>{formula}</Markdown>
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


