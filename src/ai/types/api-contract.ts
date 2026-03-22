/**
 * Unified API contract types for Puls-AI Analyze and Solve flows.
 * Used by /api/analyze and /api/solve. PULS ProblemSubmit consumes this format.
 */

import {z} from 'genkit';

/** Single numerical datum: label, value, optional unit */
export const NumericalResultSchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
});
export type NumericalResult = z.infer<typeof NumericalResultSchema>;

/** Rating: string "8/10 puncte" or structured { obtained, max } for PULS Firebase */
export const RatingSchema = z.union([
  z.string(),
  z.object({
    obtained: z.number(),
    max: z.number(),
  }),
]);
export type Rating = z.infer<typeof RatingSchema>;

/** Normalize formulasUsed from string | string[] to string[] */
const formulasUsedSchema = z
  .union([
    z.string().transform((s) => (s?.trim() ? [s] : [])),
    z.array(z.string()),
  ])
  .transform((v) => (Array.isArray(v) ? v.filter(Boolean).map(String) : []));

/** Common output fields shared by both flows */
const CommonOutputSchema = z.object({
  problemSummary: z.string().optional(),
  givenData: z.array(NumericalResultSchema).optional(),
  numericalResults: z.array(NumericalResultSchema).optional(),
  formulasUsed: formulasUsedSchema.optional(),
  explanation: z.string().optional(),
  correctSolution: z.string().optional(),
  finalAnswer: z.string().optional(),
});

/** Analyze flow output – includes rating, feedback, error analysis */
export const AnalyzeContractOutputSchema = CommonOutputSchema.extend({
  rating: RatingSchema,
  feedbackSummary: z.string().optional(),
  studentWorkReflection: z.string().optional(),
  errorAnalysis: z.string().optional(),
});
export type AnalyzeContractOutput = z.infer<typeof AnalyzeContractOutputSchema>;

/** Solve flow output – subset without analyze-specific fields */
export const SolveContractOutputSchema = CommonOutputSchema;
export type SolveContractOutput = z.infer<typeof SolveContractOutputSchema>;

/** Normalize formulasUsed from LLM output (string | string[]) to string[] */
export function normalizeFormulasUsed(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((x): x is string => typeof x === 'string').map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
}

/** Parse and normalize givenData array from LLM output */
export function normalizeNumericalArray(val: unknown): NumericalResult[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
    .map((x) => ({
      label: String(x.label ?? '').trim(),
      value: String(x.value ?? '').trim(),
      unit: x.unit != null ? String(x.unit).trim() : undefined,
    }))
    .filter((x) => x.label || x.value);
}

/** Normalize rating from LLM output to Rating type */
export function normalizeRating(val: unknown): Rating {
  if (val == null) return '—/10 puncte';
  if (typeof val === 'object' && 'obtained' in val && 'max' in val) {
    const o = Number((val as {obtained: unknown}).obtained);
    const m = Number((val as {max: unknown}).max);
    if (!Number.isNaN(o) && !Number.isNaN(m)) return {obtained: o, max: m};
  }
  return String(val);
}
