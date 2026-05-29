import { z } from 'zod';
import { MAIN_INSTRUMENT_OPTIONS } from './memberProfile';
import { nonEmptyTrimmedStringSchema } from './authSchemas';
import { SESSION_EVENT_STATUS_VALUES } from './sessionEventStatus';

const normalizedNullableStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}, z.union([z.string(), z.null()]).optional());

const validDateStringSchema = z.string().trim().min(1, 'Invalid date').refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid date');

const optionalValidDateStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}, z.union([validDateStringSchema, z.null()]).optional());

const optionalNonNegativeIntegerSchema = z.union([z.number().int().min(0), z.null()]).optional();

export const participantCreateRequestSchema = z.object({
  name: z.string().trim().min(1, 'Invalid body'),
  instrument: z.enum(MAIN_INSTRUMENT_OPTIONS, { message: 'Invalid instrument' }),
}).strict();

export const songCreateRequestSchema = z.object({
  title: z.string().trim().min(1, 'Invalid title'),
  isJazzStandardBible1: z.boolean().optional(),
  isJazzStandardBible2: z.boolean().optional(),
}).strict();

export const participantRequestCreateSchema = z.object({
  participantId: nonEmptyTrimmedStringSchema,
  songTitle: z.string().trim().min(1, 'Invalid body'),
  keyName: normalizedNullableStringSchema,
  round: z.union([z.literal(1), z.literal(2)]),
}).strict();

export const sessionEntryRequestItemSchema = z.object({
  songTitle: z.string().trim().min(1, 'Invalid body'),
  round: z.union([z.literal(1), z.literal(2)]),
  priority: z.number().int(),
  keyName: normalizedNullableStringSchema,
}).strict();

export const sessionEntryCreateRequestSchema = z.object({
  sessionEventId: nonEmptyTrimmedStringSchema,
  attendanceStatus: z.enum(['attending', 'absent', 'undecided']),
  requests: z.array(sessionEntryRequestItemSchema).optional().default([]),
}).strict();

export const sessionEventCreateRequestSchema = z.object({
  title: z.string().trim().min(1, 'Invalid body'),
  description: normalizedNullableStringSchema,
  venue: z.string().trim().min(1, 'Invalid body'),
  eventDate: validDateStringSchema,
  startTime: optionalValidDateStringSchema,
  endTime: optionalValidDateStringSchema,
  participationFee: optionalNonNegativeIntegerSchema,
  hasAfterParty: z.boolean().optional(),
  afterPartyFee: optionalNonNegativeIntegerSchema,
  notes: normalizedNullableStringSchema,
  round1StartAt: optionalValidDateStringSchema,
  round1EndAt: optionalValidDateStringSchema,
  round2StartAt: optionalValidDateStringSchema,
  round2EndAt: optionalValidDateStringSchema,
  status: z.enum(SESSION_EVENT_STATUS_VALUES).optional(),
}).strict();

export const sessionEventUpdateRequestSchema = z.object({
  title: z.string().trim().min(1, 'Invalid body').optional(),
  description: normalizedNullableStringSchema,
  venue: z.string().trim().min(1, 'Invalid body').optional(),
  eventDate: validDateStringSchema.optional(),
  startTime: optionalValidDateStringSchema,
  endTime: optionalValidDateStringSchema,
  participationFee: optionalNonNegativeIntegerSchema,
  hasAfterParty: z.boolean().optional(),
  afterPartyFee: optionalNonNegativeIntegerSchema,
  notes: normalizedNullableStringSchema,
  round1StartAt: optionalValidDateStringSchema,
  round1EndAt: optionalValidDateStringSchema,
  round2StartAt: optionalValidDateStringSchema,
  round2EndAt: optionalValidDateStringSchema,
  status: z.enum(SESSION_EVENT_STATUS_VALUES).optional(),
}).strict();

export const sessionEventCommentCreateRequestSchema = z.object({
  body: z.string().trim().min(1, 'コメントを入力してください'),
}).strict();

export const announcementCreateRequestSchema = z.object({
  title: z.string().trim().min(1, 'Invalid body'),
  body: z.string().trim().min(1, 'Invalid body'),
  isPublished: z.boolean().optional(),
}).strict();

export const announcementUpdateRequestSchema = z.object({
  title: z.string().trim().min(1, 'Invalid body').optional(),
  body: z.string().trim().min(1, 'Invalid body').optional(),
  isPublished: z.boolean().optional(),
}).strict();

export const columnMutationRequestSchema = z.object({
  title: z.string().trim().min(1, 'Invalid body'),
  slug: normalizedNullableStringSchema,
  summary: z.string().trim().min(1, 'Invalid body'),
  body: z.string().trim().min(1, 'Invalid body'),
  thumbnailLabel: normalizedNullableStringSchema,
  authorName: normalizedNullableStringSchema,
  displayOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: optionalValidDateStringSchema,
}).strict();

export const sessionSetRatingRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: normalizedNullableStringSchema,
}).strict();

export const sessionArchiveCreateRequestSchema = z.object({
  sessionEventId: nonEmptyTrimmedStringSchema,
  title: normalizedNullableStringSchema,
  note: normalizedNullableStringSchema,
}).strict();

export const sessionSetGenerateRequestSchema = z.object({
  sessionEventId: nonEmptyTrimmedStringSchema,
}).strict();