
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
import { Upload, CheckCircle, XCircle, Lightbulb, Star, FileText, Image as ImageIcon, Trash2, FileImage } from 'lucide-react'; // Added FileImage, Trash2
import Image from 'next/image';
import { handleAnalyzeProblem } from './actions';
import type { AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem';
import { useToast } from "@/hooks/use-toast";

interface SolutionImage {
  file: File;
  previewUrl: string;
}

export default function PhysicsProblemSolverPage() {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<SolutionImage | null>(null); // State for problem image
  const [solutionImages, setSolutionImages] = useState<SolutionImage[]>([]); // State for multiple solution images
  const [analysisResult, setAnalysisResult] = useState<AnalyzePhysicsProblemOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null); // Ref for problem image input
  const solutionInputRef = useRef<HTMLInputElement>(null); // Ref for solution images input
  const { toast } = useToast();

  const handleProblemFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProblemImage({ file, previewUrl: reader.result as string });
        setError(null); // Clear error when new file is added
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
      // Reset file input
      if (problemInputRef.current) {
        problemInputRef.current.value = '';
      }
    }
  };

   const handleSolutionFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: SolutionImage[] = [];
      let fileReadPromises: Promise<void>[] = [];

      files.forEach(file => {
        const reader = new FileReader();
        const promise = new Promise<void>((resolve, reject) => {
            reader.onloadend = () => {
              newImages.push({ file, previewUrl: reader.result as string });
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        fileReadPromises.push(promise);
      });

      Promise.all(fileReadPromises).then(() => {
          setSolutionImages(prevImages => [...prevImages, ...newImages]);
          setError(null); // Clear error when new files are added
          // Reset file input to allow selecting the same file again if needed
          if (solutionInputRef.current) {
              solutionInputRef.current.value = '';
          }
      }).catch(err => {
          console.error("Error reading solution files:", err);
          setError("A apărut o eroare la citirea imaginilor soluției.");
          toast({
              variant: "destructive",
              title: "Eroare la încărcare",
              description: "Nu s-au putut încărca toate imaginile soluției selectate.",
          });
      });
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setProblemText(e.target.value);
      setError(null); // Clear error when text changes
  }

  const removeProblemImage = () => {
    setProblemImage(null);
  };

  const removeSolutionImage = (indexToRemove: number) => {
    setSolutionImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!problemText.trim() && !problemImage) {
        setError('Te rog introdu textul problemei SAU încarcă o imagine a problemei.');
        toast({
            variant: "destructive",
            title: "Eroare",
            description: "Te rog introdu textul problemei SAU încarcă o imagine a problemei.",
        })
        return;
    }
    if (solutionImages.length === 0) { // Check if array is empty
      setError('Te rog încarcă cel puțin o imagine cu rezolvarea.');
      toast({
          variant: "destructive",
          title: "Eroare",
          description: "Te rog încarcă cel puțin o imagine cu rezolvarea.",
        })
      return;
    }


    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const solutionPhotoDataUris = solutionImages.map(img => img.previewUrl); // Get array of data URIs

      // Pass problem text, optional problem image URI, and solution photo URIs to the action
      const result = await handleAnalyzeProblem({
        problemText: problemText.trim() || undefined, // Send undefined if empty
        problemPhotoDataUri: problemImage?.previewUrl, // Send undefined if null
        solutionPhotoDataUris, // Pass the array
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
        // Optionally clear inputs after successful analysis
        // setProblemText('');
        // setProblemImage(null);
        // setSolutionImages([]);
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

   // Function to render preview for the single problem image
   const renderProblemPreview = () => {
      if (!problemImage) {
          return null; // Don't show the placeholder if text area is also there
      }
      return (
          <div className="mt-2 relative group aspect-video w-full max-w-md mx-auto"> {/* Centered preview */}
              <Image src={problemImage.previewUrl} alt="Enunț problemă" layout="fill" className="rounded-md object-contain border" />
              <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={removeProblemImage}
                  aria-label="Șterge imaginea problemei"
              >
                  <Trash2 className="h-4 w-4" />
              </Button>
          </div>
      );
  }

  // Function to render previews for multiple solution images
  const renderSolutionPreviews = () => {
      if (solutionImages.length === 0) {
          return <div className="mt-2 h-[100px] w-full flex items-center justify-center border rounded-md bg-secondary"><span className="text-muted-foreground text-sm">Nicio imagine cu soluția încărcată</span></div>;
      }
      return (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {solutionImages.map((image, index) => (
                  <div key={index} className="relative group aspect-square">
                      <Image src={image.previewUrl} alt={`Rezolvare ${index + 1}`} layout="fill" className="rounded-md object-contain border" />
                      <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeSolutionImage(index)}
                          aria-label="Șterge imaginea soluției"
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))}
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary text-center">Analizator Probleme Fizică</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Introdu textul SAU încarcă o imagine cu enunțul problemei. Apoi, încarcă una sau mai multe fotografii cu rezolvarea ta pentru a primi analiză și feedback AI în limba română.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                    disabled={!!problemImage} // Disable if image is uploaded
                  />
                </div>

                <div className="text-center text-sm text-muted-foreground font-medium my-2">SAU</div>

                 {/* Problem Image Upload */}
                <div className="flex flex-col space-y-2 items-center">
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
                    disabled={!!problemText.trim()} // Disable if text is entered
                  />
                  <Button
                    variant="outline"
                    onClick={() => triggerFileInput(problemInputRef)}
                    disabled={!!problemText.trim()} // Disable if text is entered
                    className="w-full max-w-xs"
                   >
                    <Upload className="mr-2 h-4 w-4" /> Încarcă Imagine Problemă
                  </Button>
                  {/* Render problem preview */}
                  {renderProblemPreview()}
                </div>
             </div>

             {/* Solution Upload Section */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="solution-image" className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Imagini Rezolvare ({solutionImages.length})*
              </Label>
              <Input
                id="solution-image"
                type="file"
                accept="image/*"
                multiple // Allow multiple file selection
                onChange={handleSolutionFilesChange}
                ref={solutionInputRef}
                className="hidden"
              />
               <Button variant="outline" onClick={() => triggerFileInput(solutionInputRef)} className="w-full max-w-xs self-center">
                 <Upload className="mr-2 h-4 w-4" /> Adaugă Imagini Soluție
               </Button>
               {/* Render solution previews */}
               {renderSolutionPreviews()}
            </div>
          </div>


          {error && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading || solutionImages.length === 0 || (!problemText.trim() && !problemImage) } // Disable if loading, no solution images, or no problem input (text or image)
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
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
                    Soluție Corectă (bazată pe enunțul problemei)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{analysisResult.solution}</p>
                </CardContent>
              </Card>
               <Card className="bg-secondary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" /> Analiză Erori & Feedback (bazat pe imaginile soluției)
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
