'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DropZone from "@/components/ui/drop-zone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, XCircle, FileText, FileImage, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { SolvePhysicsProblemOutput } from '@/ai/flows/solve-physics-problem';

interface SolutionImage {
  file: File;
  previewUrl: string;
}

export default function SolvePhysicsProblemPage() {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<SolutionImage | null>(null);
  const [solutionResult, setSolutionResult] = useState<SolvePhysicsProblemOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleProblemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProblemImage({ file, previewUrl: reader.result as string });
        setError(null);
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

  const removeProblemImage = () => {
    setProblemImage(null);
  };

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }

      setSolutionResult(result);
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Rezolvă Problema de Fizică</CardTitle>
          <CardDescription>
            Introdu textul sau imaginea problemei și vei primi o soluție detaliată.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Problem Input Section */}
            <div className="space-y-4">
              {/* Problem Text Input */}
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

              {/* Problem Image Upload */}
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
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Eroare</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
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
              <div className="space-y-6 mt-6 border-t pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" /> Soluție
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Pașii Rezolvării:</h3>
                      <p className="whitespace-pre-wrap">{solutionResult.solution}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Explicații:</h3>
                      <p className="whitespace-pre-wrap">{solutionResult.explanation}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Formule Folosite:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {solutionResult.formulas.map((formula, index) => (
                          <li key={index}>{formula}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Răspuns Final:</h3>
                      <p className="text-lg font-medium">{solutionResult.finalAnswer}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 