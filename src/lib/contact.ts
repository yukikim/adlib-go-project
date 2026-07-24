import { z } from 'zod';

export const CONTACT_MESSAGE_MAX_LENGTH = 2_000;
export const CONTACT_REQUEST_MAX_BYTES = 16_000;

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const DIRECTIONAL_CONTROL_CHARACTERS = /[\u202A-\u202E\u2066-\u2069]/g;
const LINE_SEPARATOR_CHARACTERS = /[\u2028\u2029]/g;

function removeUnsafeControlCharacters(value: string) {
  return value
    .normalize('NFC')
    .replace(CONTROL_CHARACTERS, '')
    .replace(DIRECTIONAL_CONTROL_CHARACTERS, '');
}

export function sanitizeContactSingleLine(value: string) {
  return removeUnsafeControlCharacters(value)
    .replace(LINE_SEPARATOR_CHARACTERS, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeContactMessage(value: string) {
  return removeUnsafeControlCharacters(value)
    .replace(LINE_SEPARATOR_CHARACTERS, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[^\S\n]{3,}/g, '  ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

const sanitizedSingleLineSchema = (maximum: number, requiredMessage: string) =>
  z
    .string()
    .max(maximum * 2, '入力が長すぎます。')
    .transform(sanitizeContactSingleLine)
    .pipe(z.string().min(1, requiredMessage).max(maximum, `${maximum}文字以内で入力してください。`));

export const contactSubmissionSchema = z
  .object({
    name: sanitizedSingleLineSchema(80, 'お名前を入力してください。'),
    email: z
      .string()
      .max(508, 'メールアドレスが長すぎます。')
      .transform((value) => sanitizeContactSingleLine(value).toLowerCase())
      .pipe(z.string().max(254, 'メールアドレスが長すぎます。').email('有効なメールアドレスを入力してください。')),
    subject: sanitizedSingleLineSchema(120, '件名を入力してください。'),
    message: z
      .string()
      .max(CONTACT_MESSAGE_MAX_LENGTH * 2, 'お問い合わせ内容が長すぎます。')
      .transform(sanitizeContactMessage)
      .pipe(
        z
          .string()
          .min(10, 'お問い合わせ内容は10文字以上で入力してください。')
          .max(
            CONTACT_MESSAGE_MAX_LENGTH,
            `お問い合わせ内容は${CONTACT_MESSAGE_MAX_LENGTH.toLocaleString('ja-JP')}文字以内で入力してください。`,
          ),
      ),
    website: z.string().max(CONTACT_REQUEST_MAX_BYTES).optional().default(''),
  })
  .strict();

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export function getContactValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

export function buildContactMailText(input: ContactSubmission) {
  return [
    '公開お問い合わせフォームからメッセージを受信しました。',
    '',
    `お名前: ${input.name}`,
    `メールアドレス: ${input.email}`,
    `件名: ${input.subject}`,
    '',
    'お問い合わせ内容:',
    input.message,
  ].join('\n');
}
