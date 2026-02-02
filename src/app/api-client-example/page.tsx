
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, XCircle, Lightbulb, Star, FileText, Image as ImageIcon, Trash2, FileImage, Calculator } from 'lucide-react';
import NextImage from 'next/image'; // Renamed to avoid conflict with ImageIcon
import type { AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem';
import { useToast } from "@/hooks/use-toast";
import Markdown from "@/components/ui/markdown";

interface ImageFile {
  file: File;
  previewUrl: string;
}

export default function ApiClientExamplePage() {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImageFile, setProblemImageFile] = useState<ImageFile | null>(null);
  const [solutionText, setSolutionText] = useState<string>('');
  const [solutionImageFiles, setSolutionImageFiles] = useState<ImageFile[]>([]);
  
  const [apiResponse, setApiResponse] = useState<AnalyzePhysicsProblemOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null);
  const solutionInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProblemFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const previewUrl = await fileToDataUrl(file);
        setProblemImageFile({ file, previewUrl });
        setError(null);
      } catch (err) {
        console.error("Error reading problem file:", err);
        setError("A apărut o eroare la citirea imaginii problemei.");
        toast({ variant: "destructive", title: "Eroare", description: "Nu s-a putut încărca imaginea problemei." });
      }
      if (problemInputRef.current) problemInputRef.current.value = '';
    }
  };

  const handleSolutionFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImageFiles: ImageFile[] = [];
      try {
        for (const file of files) {
          const previewUrl = await fileToDataUrl(file);
          newImageFiles.push({ file, previewUrl });
        }
        setSolutionImageFiles(prev => [...prev, ...newImageFiles]);
        setError(null);
      } catch (err) {
        console.error("Error reading solution files:", err);
        setError("A apărut o eroare la citirea imaginilor soluției.");
        toast({ variant: "destructive", title: "Eroare", description: "Nu s-au putut încărca imaginile soluției." });
      }
      if (solutionInputRef.current) solutionInputRef.current.value = '';
    }
  };

  const removeProblemImage = () => setProblemImageFile(null);
  const removeSolutionImage = (index: number) => {
    setSolutionImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!problemText.trim() && !problemImageFile) {
      setError('Te rog introdu textul problemei SAU încarcă o imagine a problemei.');
      toast({ variant: "destructive", title: "Lipsă Date Problemă", description: "Introdu textul sau imaginea problemei." });
      return;
    }
    if (!solutionText.trim() && solutionImageFiles.length === 0) {
      setError('Te rog introdu textul soluției SAU încarcă cel puțin o imagine cu rezolvarea.');
      toast({ variant: "destructive", title: "Lipsă Soluție", description: "Introdu textul soluției sau încarcă cel puțin o imagine cu soluția." });
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const payload = {
        problemText: problemText.trim() || undefined,
        problemPhotoDataUri: problemImageFile?.previewUrl,
        solutionText: solutionText.trim() || undefined,
        solutionPhotoDataUris: solutionImageFiles.length > 0 ? solutionImageFiles.map(img => img.previewUrl) : undefined,
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }
      
      setApiResponse(result as AnalyzePhysicsProblemOutput);
      toast({ title: "Succes", description: "Analiza a fost primită." });

    } catch (err) {
      console.error('Error calling API:', err);
      const message = err instanceof Error ? err.message : 'A apărut o eroare necunoscută la apelarea API-ului.';
      setError(message);
      toast({ variant: "destructive", title: "Eroare API", description: message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => ref.current?.click();

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary text-center">Exemplu Client API Fizică</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Această pagină demonstrează apelarea endpoint-ului `/api/analyze` din client-side React.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Problem Input */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="problem-text-api" className="font-semibold flex items-center gap-2"><FileText /> Text Problemă</Label>
                <Textarea
                  id="problem-text-api"
                  placeholder="Scrie enunțul problemei..."
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  className="h-32"
                  disabled={!!problemImageFile}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">SAU</div>
              <div>
                <Label htmlFor="problem-image-api" className="font-semibold flex items-center gap-2"><FileImage /> Imagine Problemă</Label>
                <Input id="problem-image-api" type="file" accept="image/*" ref={problemInputRef} onChange={handleProblemFileChange} className="hidden" disabled={!!problemText.trim()} />
                <Button variant="outline" onClick={() => triggerFileInput(problemInputRef)} className="w-full" disabled={!!problemText.trim()}>
                  <Upload className="mr-2" /> Încarcă Imagine Problemă
                </Button>
                {problemImageFile && (
                  <div className="mt-2 relative group aspect-video w-full max-w-xs mx-auto">
                    <NextImage src={problemImageFile.previewUrl} alt="Previzualizare problemă" fill className="rounded-md object-contain border" />
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={removeProblemImage}><Trash2 /></Button>
                  </div>
                )}
              </div>
            </div>

            {/* Solution Input */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="solution-text-api" className="font-semibold flex items-center gap-2"><FileText /> Text Soluție</Label>
                <Textarea
                  id="solution-text-api"
                  placeholder="Scrie soluția ta..."
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  className="h-32"
                  disabled={solutionImageFiles.length > 0}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">SAU</div>
              <div className="space-y-2">
                <Label htmlFor="solution-images-api" className="font-semibold flex items-center gap-2"><ImageIcon /> Imagini Soluție ({solutionImageFiles.length})</Label>
                <Input id="solution-images-api" type="file" accept="image/*" multiple ref={solutionInputRef} onChange={handleSolutionFilesChange} className="hidden" disabled={!!solutionText.trim()} />
                <Button variant="outline" onClick={() => triggerFileInput(solutionInputRef)} className="w-full" disabled={!!solutionText.trim()}>
                  <Upload className="mr-2" /> Adaugă Imagini Soluție
                </Button>
                {solutionImageFiles.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {solutionImageFiles.map((img, index) => (
                      <div key={index} className="relative group aspect-square">
                        <NextImage src={img.previewUrl} alt={`Soluție ${index + 1}`} fill className="rounded-md object-contain border" />
                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeSolutionImage(index)}><Trash2 /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="mt-2 h-[100px] w-full flex items-center justify-center border rounded-md bg-secondary"><span className="text-muted-foreground text-sm">Nicio imagine cu soluția.</span></div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSubmit} disabled={isLoading || (!solutionText.trim() && solutionImageFiles.length === 0) || (!problemText.trim() && !problemImageFile)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4">
            {isLoading ? 'Se trimite la API...' : 'Trimite la API'}
          </Button>

          {isLoading && (
            <div className="space-y-2 pt-4">
              <Progress value={undefined} className="w-full" /> {/* Indeterminate */}
              <p className="text-center text-sm text-muted-foreground">Se apelează API-ul...</p>
            </div>
          )}

          {apiResponse && (
            <div className="space-y-4 pt-6 border-t mt-6">
              <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Răspuns API
              </h3>
              <Card className="bg-secondary border-yellow-500 border-2">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Star /> Punctaj</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose max-w-none text-lg font-semibold">
                    <Markdown>{apiResponse.rating}</Markdown>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-secondary">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calculator className="w-5 h-5" /> Soluție Corectă</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose max-w-none text-sm">
                    <Markdown>{apiResponse.solution}</Markdown>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-secondary">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb /> Analiză Erori & Feedback</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose max-w-none text-sm">
                    <Markdown>{apiResponse.errorAnalysis}</Markdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    