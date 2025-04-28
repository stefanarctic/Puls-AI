'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, XCircle, Lightbulb, Star } from 'lucide-react'; // Added Star icon
import Image from 'next/image';
import { handleAnalyzeProblem } from './actions';
import type { AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem'; // Output type includes rating now
import { useToast } from "@/hooks/use-toast"

export default function PhysicsProblemSolverPage() {
  // Remove state related to results table
  const [problemImageFile, setProblemImageFile] = useState<File | null>(null);
  const [problemImagePreview, setProblemImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePhysicsProblemOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null);
  // Remove ref for results table input
  const { toast } = useToast()

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null); // Clear error when a new file is selected
    } else {
        setFile(null);
        setPreview(null);
    }
  };

  const handleSubmit = async () => {
    // Remove check for results table file
    if (!problemImageFile) {
      setError('Te rog încarcă imaginea cu problema și rezolvarea.');
      toast({
          variant: "destructive",
          title: "Eroare",
          description: "Te rog încarcă imaginea cu problema și rezolvarea.",
        })
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const problemPhotoDataUri = problemImagePreview!;
      // Remove resultsTableDataUri

      // Pass only the problem photo URI to the action
      const result = await handleAnalyzeProblem({
        problemPhotoDataUri,
      });

      if (result.error) {
        setError(result.error);
         toast({
            variant: "destructive",
            title: "Analiza a eșuat",
            description: result.error,
          })
      } else {
        setAnalysisResult(result.data);
      }
    } catch (err) {
      console.error('Error analyzing problem:', err);
      const errorMessage = err instanceof Error ? err.message : 'A apărut o eroare necunoscută.';
      setError(`Analiza problemei a eșuat. ${errorMessage}`);
       toast({
            variant: "destructive",
            title: "Analiza a eșuat",
            description: `Analiza problemei a eșuat. ${errorMessage}`,
          })
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const renderPreview = (preview: string | null, label: string) => {
      if (preview) {
          return <Image src={preview} alt={`${label} preview`} width={300} height={200} className="mt-2 rounded-md object-contain border" />; // Slightly larger preview
      }
      return <div className="mt-2 h-[200px] w-[300px] flex items-center justify-center border rounded-md bg-secondary"><span className="text-muted-foreground text-sm">Nicio imagine încărcată</span></div>;
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary text-center">Analizator Probleme Fizică</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Încarcă o fotografie cu problema de fizică și rezolvarea ta pentru a primi analiză și feedback AI în limba română.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Remove the grid layout, center the single upload */}
          <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="problem-image" className="font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Imagine Problemă + Rezolvare
              </Label>
              <Input
                id="problem-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setProblemImageFile, setProblemImagePreview)}
                ref={problemInputRef}
                className="hidden"
              />
               <Button variant="outline" onClick={() => triggerFileInput(problemInputRef)} className="w-full max-w-xs">
                 {problemImageFile ? 'Schimbă Imaginea' : 'Încarcă Imagine'}
               </Button>
              {renderPreview(problemImagePreview, "Problemă + Rezolvare")}
          </div>
          {/* Remove the results table upload section */}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !problemImageFile} // Disable if no problem image
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? 'Se analizează...' : 'Analizează Problema'}
          </Button>

          {isLoading && (
             <div className="space-y-2 pt-4">
                <Progress value={undefined} className="w-full animate-pulse" />
                 <p className="text-center text-sm text-muted-foreground">AI-ul analizează problema...</p>
             </div>
          )}

          {analysisResult && (
            <div className="space-y-4 pt-6 border-t mt-6">
              <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Analiză Completă
              </h3>
               {/* Display Rating */}
              <Card className="bg-secondary border-yellow-500 border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Punctaj
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-lg font-semibold whitespace-pre-wrap">{analysisResult.rating}</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x1="16" y1="14" y2="18"/><line x1="16" x1="12" y1="14" y2="14"/><line x1="12" x1="12" y1="14" y2="18"/><line x1="12" x1="8" y1="14" y2="14"/><line x1="8" x1="8" y1="14" y2="18"/><line x1="8" x1="8" y1="10" y2="10"/></svg>
                    Soluție Corectă
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{analysisResult.solution}</p>
                </CardContent>
              </Card>
               <Card className="bg-secondary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" /> Analiză Erori & Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm whitespace-pre-wrap">{analysisResult.errorAnalysis}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
