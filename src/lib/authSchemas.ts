import { z } from 'zod';

export const normalizedEmailSchema = z.string().trim().toLowerCase().email('Invalid email');

export const trimmedPasswordSchema = z.string().trim().min(8, 'Password must be at least 8 characters');

export const nonEmptyTrimmedStringSchema = z.string().trim().min(1, 'Invalid body');

export const signInRequestSchema = z.object({
  email: normalizedEmailSchema,
  password: nonEmptyTrimmedStringSchema,
  roleTarget: z.enum(['member', 'admin']).optional(),
}).strict();

export const forgotPasswordRequestSchema = z.object({
  email: normalizedEmailSchema,
}).strict();

export const resetPasswordRequestSchema = z.object({
  token: nonEmptyTrimmedStringSchema,
  password: trimmedPasswordSchema,
}).strict();

export const signUpRequestSchema = z.object({
  email: normalizedEmailSchema,
  password: trimmedPasswordSchema,
  displayName: z.string().trim().min(1, 'displayName is required'),
  mainInstrument: z.string(),
  subInstrument: z.union([z.string(), z.null()]).optional(),
  gender: z.union([z.string(), z.null()]).optional(),
  ageRange: z.union([z.string(), z.null()]).optional(),
  area: z.union([z.string(), z.null()]).optional(),
}).strict();

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Invalid body';
}