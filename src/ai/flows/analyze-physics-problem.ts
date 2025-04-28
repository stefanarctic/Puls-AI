'use server';
/**
 * @fileOverview Analyzes a physics problem provided as an image and compares it against a table of results.
 *
 * - analyzePhysicsProblem - A function that handles the physics problem analysis process.
 * - AnalyzePhysicsProblemInput - The input type for the analyzePhysicsProblem function.
 * - AnalyzePhysicsProblemOutput - The return type for the analyzePhysicsProblem function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzePhysicsProblemInputSchema = z.object({
  problemPhotoDataUri: z
    .string()
    .describe(
      "A photo of the physics problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  resultsTableDataUri: z
    .string()
    .describe(
      "A photo of the results table, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzePhysicsProblemInput = z.infer<typeof AnalyzePhysicsProblemInputSchema>;

const AnalyzePhysicsProblemOutputSchema = z.object({
  solution: z.string().describe('The solution to the physics problem.'),
  errorAnalysis: z.string().describe('An analysis of any errors made in the provided solution.'),
});
export type AnalyzePhysicsProblemOutput = z.infer<typeof AnalyzePhysicsProblemOutputSchema>;

export async function analyzePhysicsProblem(input: AnalyzePhysicsProblemInput): Promise<AnalyzePhysicsProblemOutput> {
  return analyzePhysicsProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePhysicsProblemPrompt',
  input: {
    schema: z.object({
      problemPhotoDataUri: z
        .string()
        .describe(
          "A photo of the physics problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      resultsTableDataUri: z
        .string()
        .describe(
          "A photo of the results table, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      solution: z.string().describe('The solution to the physics problem.'),
      errorAnalysis: z.string().describe('An analysis of any errors made in the provided solution.'),
    }),
  },
  prompt: `You are an expert physics problem solver. Analyze the physics problem in the image and compare the solution to the provided results table.

Physics Problem Photo: {{media url=problemPhotoDataUri}}
Results Table Photo: {{media url=resultsTableDataUri}}

Provide the solution to the problem and highlight any mistakes made in the provided solution. If no errors were detected explain that the solution is correct and no errors were found.`,
});

const analyzePhysicsProblemFlow = ai.defineFlow<
  typeof AnalyzePhysicsProblemInputSchema,
  typeof AnalyzePhysicsProblemOutputSchema
>(
  {
    name: 'analyzePhysicsProblemFlow',
    inputSchema: AnalyzePhysicsProblemInputSchema,
    outputSchema: AnalyzePhysicsProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
