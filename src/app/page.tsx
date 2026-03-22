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
import { Upload, CheckCircle, XCircle, Lightbulb, Star, FileText, Image as ImageIcon, Trash2, FileImage, Wand2, ClipboardList, ListChecks, Calculator, Trophy } from 'lucide-react';
import Image from 'next/image';
import { handleAnalyzeProblem } from './actions';
import type { AnalyzeContractOutput } from '@/ai/types/api-contract';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DropZone from "@/components/ui/drop-zone";
import SolveProblemForm from '@/components/solve-problem-form';
import Markdown from "@/components/ui/markdown";

interface SolutionImage {
  file: File;
  previewUrl: string;
}

export default function PhysicsProblemSolverPage() {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<SolutionImage | null>(null);
  const [solutionText, setSolutionText] = useState<string>('');
  const [solutionImages, setSolutionImages] = useState<SolutionImage[]>([]);
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeContractOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const problemInputRef = useRef<HTMLInputElement>(null);
  const solutionInputRef = useRef<HTMLInputElement>(null);
  const solveButtonRef = useRef<HTMLButtonElement>(null);
  const analysisResultRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleProblemFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProblemImage({ file, previewUrl: reader.result as string });
        setError(null); // Clear error when new file is added
        // Scroll to solve button after image is uploaded
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

  const handleContextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setAdditionalContext(e.target.value);
      setError(null); // Clear error when context changes
  }

  const handleSolutionTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setSolutionText(e.target.value);
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
    if (!solutionText.trim() && solutionImages.length === 0) {
      setError('Te rog introdu textul soluției SAU încarcă cel puțin o imagine cu rezolvarea.');
      toast({
          variant: "destructive",
          title: "Eroare",
          description: "Te rog introdu textul soluției SAU încarcă cel puțin o imagine cu rezolvarea.",
        })
      return;
    }


    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const solutionPhotoDataUris = solutionImages.map(img => img.previewUrl); // Get array of data URIs

      // Pass problem text, optional problem image URI, solution text, solution photo URIs, and additional context to the action
      const result = await handleAnalyzeProblem({
        problemText: problemText.trim() || undefined, // Send undefined if empty
        problemPhotoDataUri: problemImage?.previewUrl, // Send undefined if null
        solutionText: solutionText.trim() || undefined, // Send undefined if empty
        solutionPhotoDataUris: solutionPhotoDataUris.length > 0 ? solutionPhotoDataUris : undefined, // Send undefined if empty
        additionalContext: additionalContext.trim() || undefined, // Send undefined if empty
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
          // Scroll to analysis result after it's displayed
          setTimeout(() => {
            analysisResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
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

                  {/* Additional Context Input */}
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="additional-context" className="font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Context Adițional (Opțional)
                    </Label>
                    <Textarea
                      id="additional-context"
                      placeholder="Adaugă informații suplimentare pentru AI (ex: nivel de dificultate, concepte specifice de verificat, etc.)"
                      value={additionalContext}
                      onChange={handleContextChange}
                      className="h-20 resize-none"
                    />
                  </div>
                </div>

                {/* Right column - Solution Input */}
                <div className="space-y-4">
                  {/* Solution Text Input */}
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="solution-text" className="font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Textul Soluției (Opțional)
                    </Label>
                    <Textarea
                      id="solution-text"
                      placeholder="Scrie aici soluția ta..."
                      value={solutionText}
                      onChange={handleSolutionTextChange}
                      className="h-32 resize-none"
                      disabled={solutionImages.length > 0}
                    />
                  </div>

                  <div className="text-center text-sm text-muted-foreground font-medium my-2">SAU</div>

                  {/* Solution Images Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="solution-images" className="font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" /> Imagini cu Rezolvarea (Opțional)
                    </Label>
                    <Input
                      id="solution-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSolutionFilesChange}
                      ref={solutionInputRef}
                      className="hidden"
                      disabled={!!solutionText.trim()}
                    />
                    <DropZone
                      accept="image/*"
                      multiple
                      disabled={!!solutionText.trim()}
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
                    {solutionImages.length > 0 && (
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
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  ref={solveButtonRef}
                  onClick={handleSubmit}
                  disabled={isLoading || (!problemText.trim() && !problemImage) || (!solutionText.trim() && solutionImages.length === 0)}
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
              {analysisResult && (() => {
                const formatRating = (r: AnalyzeContractOutput['rating']): string => {
                  if (typeof r === 'string') return r;
                  return `${r.obtained}/${r.max} puncte`;
                };
                const ratingDisplay = formatRating(analysisResult.rating);
                const hasRating = typeof analysisResult.rating === 'string'
                  ? analysisResult.rating && analysisResult.rating !== '—/10 puncte'
                  : analysisResult.rating != null;

                return (
                  <div ref={analysisResultRef} className="space-y-6 mt-6 border-t pt-6">
                    <div className="space-y-6">
                      {/* Punctaj Obținut */}
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="font-semibold mb-3 text-yellow-800 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          🎯 Punctaj Obținut:
                        </h3>
                        <div className="bg-white p-4 rounded border border-yellow-100">
                          <div className="text-lg font-medium prose max-w-none text-yellow-900">
                            {hasRating ? (
                              <Markdown>{ratingDisplay}</Markdown>
                            ) : (
                              <span className="text-muted-foreground">Punctajul nu a putut fi extras.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Problem Summary and Feedback Summary - Side by side */}
                      {(analysisResult.problemSummary || analysisResult.feedbackSummary) && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {analysisResult.problemSummary && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Rezumat Problemă
                              </h3>
                              <div className="prose max-w-none text-slate-900">
                                <Markdown>{analysisResult.problemSummary}</Markdown>
                              </div>
                            </div>
                          )}
                          {analysisResult.feedbackSummary && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                                <ListChecks className="h-4 w-4" />
                                Rezumat Feedback
                              </h3>
                              <div className="prose max-w-none text-slate-900">
                                <Markdown>{analysisResult.feedbackSummary}</Markdown>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Data tables: givenData and numericalResults */}
                      {((analysisResult.givenData?.length ?? 0) > 0 || (analysisResult.numericalResults?.length ?? 0) > 0) && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {analysisResult.givenData && analysisResult.givenData.length > 0 && (
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
                                    {analysisResult.givenData.map((row, i) => (
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
                          {analysisResult.numericalResults && analysisResult.numericalResults.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                                <Star className="h-4 w-4" />
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
                                    {analysisResult.numericalResults.map((row, i) => (
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

                      {/* Formulas Used */}
                      {analysisResult.formulasUsed && analysisResult.formulasUsed.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h3 className="font-semibold mb-3 text-purple-800 flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Formule folosite
                          </h3>
                          <ul className="list-disc list-inside space-y-1 text-purple-900">
                            {analysisResult.formulasUsed.map((f, i) => (
                              <li key={i}>
                                <Markdown>{f}</Markdown>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Explanation */}
                      {analysisResult.explanation && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h3 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Explicații (concepte și strategie)
                          </h3>
                          <div className="prose max-w-none text-blue-900">
                            <Markdown>{analysisResult.explanation}</Markdown>
                          </div>
                        </div>
                      )}

                      {/* Solution Steps */}
                      {analysisResult.correctSolution && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h3 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            📋 Pașii Rezolvării
                          </h3>
                          <div className="prose max-w-none text-blue-900">
                            <Markdown>{analysisResult.correctSolution}</Markdown>
                          </div>
                        </div>
                      )}

                      {/* Error Analysis */}
                      {analysisResult.errorAnalysis && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h3 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            💡 Analiza Erorilor
                          </h3>
                          <div className="prose max-w-none text-green-900">
                            <Markdown>{analysisResult.errorAnalysis}</Markdown>
                          </div>
                        </div>
                      )}

                      {/* Final Answer */}
                      {analysisResult.finalAnswer && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h3 className="font-semibold mb-2 text-yellow-800 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Răspuns final
                          </h3>
                          <div className="prose max-w-none text-yellow-900">
                            <Markdown>{analysisResult.finalAnswer}</Markdown>
                          </div>
                        </div>
                      )}

                      {/* Student Work Reflection */}
                      {analysisResult.studentWorkReflection && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <h3 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Reflecție asupra lucrării
                          </h3>
                          <div className="prose max-w-none text-slate-900">
                            <Markdown>{analysisResult.studentWorkReflection}</Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="solve">
              <SolveProblemForm variant="embedded" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
