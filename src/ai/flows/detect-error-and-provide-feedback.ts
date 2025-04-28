// NOTE: This flow is currently unused as analyze-physics-problem.ts covers the required functionality.
'use server';
/**
 * @fileOverview An AI agent that detects errors in a physics problem solution and provides feedback.
 *
 * - detectErrorAndProvideFeedback - A function that handles the error detection and feedback process.
 * - DetectErrorAndProvideFeedbackInput - The input type for the detectErrorAndProvideFeedback function.
 * - DetectErrorAndProvideFeedbackOutput - The return type for the detectErrorAndProvideFeedback function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DetectErrorAndProvideFeedbackInputSchema = z.object({
  problemImage: z
    .string()
    .describe(
      "A photo of a physics problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  solutionTable: z.string().describe('A table containing the solution steps and results.'),
  userSolution: z.string().describe('The user provided solution to the physics problem.'),
});
export type DetectErrorAndProvideFeedbackInput = z.infer<typeof DetectErrorAndProvideFeedbackInputSchema>;

const DetectErrorAndProvideFeedbackOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user solution is correct or not.'),
  feedback: z.string().describe('Feedback on the user solution, including where mistakes were made.'),
});
export type DetectErrorAndProvideFeedbackOutput = z.infer<typeof DetectErrorAndProvideFeedbackOutputSchema>;

export async function detectErrorAndProvideFeedback(
  input: DetectErrorAndProvideFeedbackInput
): Promise<DetectErrorAndProvideFeedbackOutput> {
  return detectErrorAndProvideFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectErrorAndProvideFeedbackPrompt',
  input: {
    schema: z.object({
      problemImage: z
        .string()
        .describe(
          "A photo of a physics problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      solutionTable: z.string().describe('A table containing the solution steps and results.'),
      userSolution: z.string().describe('The user provided solution to the physics problem.'),
    }),
  },
  output: {
    schema: z.object({
      isCorrect: z.boolean().describe('Whether the user solution is correct or not.'),
      feedback: z.string().describe('Feedback on the user solution, including where mistakes were made.'),
    }),
  },
  prompt: `You are an expert physics problem solver. Analyze the user's solution to the problem, compare it to the solution table, and provide feedback on where the user made mistakes. If the user is correct, congratulate them.

Physics Problem:
{{media url=problemImage}}

Solution Table:
{{solutionTable}}

User Solution:
{{userSolution}}`,
});

const detectErrorAndProvideFeedbackFlow = ai.defineFlow<
  typeof DetectErrorAndProvideFeedbackInputSchema,
  typeof DetectErrorAndProvideFeedbackOutputSchema
>({
  name: 'detectErrorAndProvideFeedbackFlow',
  inputSchema: DetectErrorAndProvideFeedbackInputSchema,
  outputSchema: DetectErrorAndProvideFeedbackOutputSchema,
},
async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
