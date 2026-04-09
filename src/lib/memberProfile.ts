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
  const data: {
    displayName?: string;
    nickname?: string | null;
    mainInstrument?: MainInstrumentOption;
    subInstrument?: string | null;
    gender?: GenderOption;
    ageRange?: AgeRangeOption;
    area?: PrefectureOption;
    bio?: string | null;
  } = {};

  if (options.requireDisplayName || typeof input.displayName === 'string') {
    const displayName = input.displayName?.trim() ?? '';
    if (!displayName) {
      return { error: 'displayName is required' as const };
    }
    data.displayName = displayName;
  }

  const effectiveInstrument = input.mainInstrument ?? options.currentMainInstrument ?? null;
  if (options.requireRequiredSelections || typeof input.mainInstrument === 'string') {
    if (!effectiveInstrument || !isValidMainInstrument(effectiveInstrument)) {
      return { error: 'Invalid mainInstrument' as const };
    }
    data.mainInstrument = effectiveInstrument;
  }

  if (options.requireRequiredSelections || input.gender !== undefined) {
    if (!input.gender || !isValidGender(input.gender)) {
      return { error: 'Invalid gender' as const };
    }
    data.gender = input.gender;
  }

  if (options.requireRequiredSelections || input.ageRange !== undefined) {
    if (!input.ageRange || !isValidAgeRange(input.ageRange)) {
      return { error: 'Invalid ageRange' as const };
    }
    data.ageRange = input.ageRange;
  }

  if (options.requireRequiredSelections || input.area !== undefined) {
    if (!input.area || !isValidPrefecture(input.area)) {
      return { error: 'Invalid area' as const };
    }
    data.area = input.area;
  }

  if (input.nickname !== undefined) {
    data.nickname = normalizeOptionalText(input.nickname);
  }

  if (input.bio !== undefined) {
    data.bio = normalizeOptionalText(input.bio);
  }

  if (input.subInstrument !== undefined || options.requireRequiredSelections) {
    if (effectiveInstrument === 'vocal') {
      data.subInstrument = null;
    } else {
      data.subInstrument = normalizeOptionalText(input.subInstrument);
    }
  }

  return { data };
}