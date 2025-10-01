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
import { Upload, CheckCircle, XCircle, Lightbulb, Star, FileText, Image as ImageIcon, Trash2, FileImage, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { handleAnalyzeProblem } from './actions';
import type { AnalyzePhysicsProblemOutput } from '@/ai/flows/analyze-physics-problem';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DropZone from "@/components/ui/drop-zone";

interface SolutionImage {
  file: File;
  previewUrl: string;
}

export default function PhysicsProblemSolverPage() {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<SolutionImage | null>(null);
  const [solutionImages, setSolutionImages] = useState<SolutionImage[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePhysicsProblemOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null);
  const solutionInputRef = useRef<HTMLInputElement>(null);
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
        if (result.data) {
          setAnalysisResult(result.data);
        }
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Asistent Fizică</CardTitle>
          <CardDescription>
            Alege modul în care dorești să rezolvi problema de fizică
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyze" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Analizează Soluția
              </TabsTrigger>
              <TabsTrigger value="solve" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> Rezolvă Direct
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analyze">
              <div className="grid grid-cols-2 gap-6">
                {/* Left column - Problem Input */}
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
                          const fakeEvent = { target: { files: [fileList[0]] } } as unknown as ChangeEvent<HTMLInputElement>
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

                {/* Right column - Solution Images */}
                <div className="space-y-4">
                  <Label htmlFor="solution-images" className="font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" /> Imagini cu Rezolvarea
                  </Label>
                  <Input
                    id="solution-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSolutionFilesChange}
                    ref={solutionInputRef}
                    className="hidden"
                  />
                  <DropZone
                    accept="image/*"
                    multiple
                    onFiles={(files) => {
                      const fileList = Array.isArray(files) ? files : Array.from(files)
                      const dt = new DataTransfer()
                      fileList.forEach(f => dt.items.add(f))
                      const fakeInput = document.createElement('input')
                      const fakeEvent = { target: { files: dt.files } } as unknown as ChangeEvent<HTMLInputElement>
                      handleSolutionFilesChange(fakeEvent)
                    }}
                    className="w-full"
                  >
                    <div className="flex flex-col items-center gap-2 w-full">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Trage imaginile soluției sau fă click</span>
                    </div>
                  </DropZone>

                  {/* Solution Images Preview */}
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {solutionImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.previewUrl}
                          alt={`Soluție ${index + 1}`}
                          className="w-full h-auto rounded-lg border border-gray-200"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removeSolutionImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analysis Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (!problemText.trim() && !problemImage) || solutionImages.length === 0}
                  className="w-full max-w-xs"
                >
                  {isLoading ? (
                    <>
                      <Progress value={33} className="w-full" />
                      <span className="ml-2">Se analizează...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Analizează Soluția
                    </>
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Eroare</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Analysis Result */}
              {analysisResult && (
                <div className="mt-6 space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Rezultat Analiză</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p><strong>Soluție corectă:</strong> {analysisResult.solution}</p>
                        <p><strong>Analiza erorilor:</strong> {analysisResult.errorAnalysis}</p>
                        <p><strong>Punctaj:</strong> {analysisResult.rating}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>

            <TabsContent value="solve">
              <iframe
                src="/solve"
                className="w-full h-[800px] border-0"
                title="Rezolvă Problema"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
