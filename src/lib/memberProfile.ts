import { z } from 'zod';

export const MAIN_INSTRUMENT_OPTIONS = ['drum', 'bass', 'piano', 'front', 'vocal'] as const;

export const GENDER_OPTIONS = ['男性', '女性', 'その他', '回答しない'] as const;

export const AGE_RANGE_OPTIONS = ['20代', '30代', '40代', '50代', '60代', '70代', '80代'] as const;

export const PREFECTURE_OPTIONS = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
] as const;

export type MainInstrumentOption = (typeof MAIN_INSTRUMENT_OPTIONS)[number];
export type GenderOption = (typeof GENDER_OPTIONS)[number];
export type AgeRangeOption = (typeof AGE_RANGE_OPTIONS)[number];
export type PrefectureOption = (typeof PREFECTURE_OPTIONS)[number];

type MemberProfileInput = {
  displayName?: string;
  nickname?: string | null;
  mainInstrument?: string;
  subInstrument?: string | null;
  gender?: string | null;
  ageRange?: string | null;
  area?: string | null;
  bio?: string | null;
};

type ValidateMemberProfileOptions = {
  requireDisplayName?: boolean;
  requireRequiredSelections?: boolean;
  currentMainInstrument?: string | null;
};

const trimmedOptionalString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}, z.union([z.string(), z.null()]).optional());

const optionalEnumValue = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, z.enum(values).optional());

export const memberProfileInputSchema = z.object({
  displayName: z.string().trim().min(1, 'displayName is required').optional(),
  nickname: trimmedOptionalString,
  mainInstrument: optionalEnumValue(MAIN_INSTRUMENT_OPTIONS),
  subInstrument: trimmedOptionalString,
  gender: optionalEnumValue(GENDER_OPTIONS),
  ageRange: optionalEnumValue(AGE_RANGE_OPTIONS),
  area: optionalEnumValue(PREFECTURE_OPTIONS),
  bio: trimmedOptionalString,
}).strict();

export const memberSelfUpdateRequestSchema = memberProfileInputSchema.extend({
  currentPassword: z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, z.string().optional()),
  newPassword: z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, z.string().min(8, 'Password must be at least 8 characters').optional()),
}).strict().superRefine((value, ctx) => {
  const hasCurrentPassword = Boolean(value.currentPassword);
  const hasNewPassword = Boolean(value.newPassword);
  if (hasCurrentPassword !== hasNewPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'currentPassword and newPassword are required' });
  }
});

export const adminMemberUpdateRequestSchema = memberProfileInputSchema.extend({
  role: z.enum(['member', 'admin']).optional(),
  status: z.enum(['active', 'suspended', 'invited']).optional(),
}).strict();

export function isValidMainInstrument(value: string): value is MainInstrumentOption {
  return MAIN_INSTRUMENT_OPTIONS.includes(value as MainInstrumentOption);
}

export function isValidGender(value: string): value is GenderOption {
  return GENDER_OPTIONS.includes(value as GenderOption);
}

export function isValidAgeRange(value: string): value is AgeRangeOption {
  return AGE_RANGE_OPTIONS.includes(value as AgeRangeOption);
}

export function isValidPrefecture(value: string): value is PrefectureOption {
  return PREFECTURE_OPTIONS.includes(value as PrefectureOption);
}

export function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

export function validateMemberProfileInput(input: MemberProfileInput, options: ValidateMemberProfileOptions = {}) {
  const parsed = memberProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid body' as const };
  }

  const data = { ...parsed.data };

  if (options.requireDisplayName && !data.displayName) {
    return { error: 'displayName is required' as const };
  }

  const effectiveInstrument = data.mainInstrument ?? options.currentMainInstrument ?? null;
  if ((options.requireRequiredSelections || data.mainInstrument !== undefined) && !effectiveInstrument) {
    return { error: 'Invalid mainInstrument' as const };
  }

  if (options.requireRequiredSelections && !data.gender) {
    return { error: 'Invalid gender' as const };
  }

  if (options.requireRequiredSelections && !data.ageRange) {
    return { error: 'Invalid ageRange' as const };
  }

  if (options.requireRequiredSelections && !data.area) {
    return { error: 'Invalid area' as const };
  }

  if (data.subInstrument !== undefined || options.requireRequiredSelections) {
    if (effectiveInstrument === 'front') {
      if (!data.subInstrument) {
        return { error: 'playingInstrument is required for front' as const };
      }
      data.subInstrument = data.subInstrument;
    } else {
      data.subInstrument = null;
    }
  }

  return { data };
}