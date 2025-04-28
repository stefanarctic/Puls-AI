'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import { handleAnalyzeProblem } from './actions';
import type { AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem';
import { useToast } from "@/hooks/use-toast"

export default function PhysicsProblemSolverPage() {
  const [problemImageFile, setProblemImageFile] = useState<File | null>(null);
  const [resultsTableFile, setResultsTableFile] = useState<File | null>(null);
  const [problemImagePreview, setProblemImagePreview] = useState<string | null>(null);
  const [resultsTablePreview, setResultsTablePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePhysicsProblemOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null);
  const resultsInputRef = useRef<HTMLInputElement>(null);
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
    if (!problemImageFile || !resultsTableFile) {
      setError('Please upload both the problem image and the results table image.');
      toast({
          variant: "destructive",
          title: "Error",
          description: "Please upload both the problem image and the results table image.",
        })
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const problemPhotoDataUri = problemImagePreview!;
      const resultsTableDataUri = resultsTablePreview!;

      const result = await handleAnalyzeProblem({
        problemPhotoDataUri,
        resultsTableDataUri,
      });

      if (result.error) {
        setError(result.error);
         toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: result.error,
          })
      } else {
        setAnalysisResult(result.data);
      }
    } catch (err) {
      console.error('Error analyzing problem:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze the problem. ${errorMessage}`);
       toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: `Failed to analyze the problem. ${errorMessage}`,
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
          return <Image src={preview} alt={`${label} preview`} width={200} height={150} className="mt-2 rounded-md object-contain border" />;
      }
      return <div className="mt-2 h-[150px] w-[200px] flex items-center justify-center border rounded-md bg-secondary"><span className="text-muted-foreground text-sm">No image uploaded</span></div>;
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary text-center">Physics Problem Solver</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Upload a photo of your physics problem and its corresponding results table to get AI-powered analysis and feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="problem-image" className="font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Problem Image
              </Label>
              <Input
                id="problem-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setProblemImageFile, setProblemImagePreview)}
                ref={problemInputRef}
                className="hidden"
              />
               <Button variant="outline" onClick={() => triggerFileInput(problemInputRef)} className="w-full">
                 {problemImageFile ? 'Change Problem Image' : 'Upload Problem Image'}
               </Button>
              {renderPreview(problemImagePreview, "Problem Image")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="results-table" className="font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Results Table Image
              </Label>
              <Input
                id="results-table"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setResultsTableFile, setResultsTablePreview)}
                ref={resultsInputRef}
                className="hidden"
              />
              <Button variant="outline" onClick={() => triggerFileInput(resultsInputRef)} className="w-full">
                {resultsTableFile ? 'Change Results Table' : 'Upload Results Table'}
               </Button>
              {renderPreview(resultsTablePreview, "Results Table")}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !problemImageFile || !resultsTableFile}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Problem'}
          </Button>

          {isLoading && (
             <div className="space-y-2 pt-4">
                <Progress value={undefined} className="w-full animate-pulse" />
                 <p className="text-center text-sm text-muted-foreground">AI is analyzing your problem...</p>
             </div>
          )}

          {analysisResult && (
            <div className="space-y-4 pt-6 border-t mt-6">
              <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Analysis Complete
              </h3>
              <Card className="bg-secondary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x1="16" y1="14" y2="18"/><line x1="16" x1="12" y1="14" y2="14"/><line x1="12" x1="12" y1="14" y2="18"/><line x1="12" x1="8" y1="14" y2="14"/><line x1="8" x1="8" y1="14" y2="18"/><line x1="8" x1="8" y1="10" y2="10"/></svg>
                    Solution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{analysisResult.solution}</p>
                </CardContent>
              </Card>
               <Card className="bg-secondary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" /> Error Analysis & Feedback
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
