import { z } from 'zod';

import { sanitizeContactMessage, sanitizeContactSingleLine } from '@/lib/contact';

export const MEMBER_MESSAGE_SUBJECT_MAX_LENGTH = 120;
export const MEMBER_MESSAGE_BODY_MAX_LENGTH = 2_000;

export const memberMessageSubmissionSchema = z
  .object({
    subject: z
      .string()
      .max(MEMBER_MESSAGE_SUBJECT_MAX_LENGTH * 2, '件名が長すぎます。')
      .transform(sanitizeContactSingleLine)
      .pipe(
        z
          .string()
          .min(1, '件名を入力してください。')
          .max(MEMBER_MESSAGE_SUBJECT_MAX_LENGTH, `件名は${MEMBER_MESSAGE_SUBJECT_MAX_LENGTH}文字以内で入力してください。`),
      ),
    body: z
      .string()
      .max(MEMBER_MESSAGE_BODY_MAX_LENGTH * 2, 'メッセージが長すぎます。')
      .transform(sanitizeContactMessage)
      .pipe(
        z
          .string()
          .min(1, 'メッセージを入力してください。')
          .max(
            MEMBER_MESSAGE_BODY_MAX_LENGTH,
            `メッセージは${MEMBER_MESSAGE_BODY_MAX_LENGTH.toLocaleString('ja-JP')}文字以内で入力してください。`,
          ),
      ),
  })
  .strict();

export type MemberMessageSubmission = z.infer<typeof memberMessageSubmissionSchema>;

export function buildMemberMessageNotificationText(input: {
  senderDisplayName: string;
  senderEmail: string;
  subject: string;
  body: string;
}) {
  return [
    'メンバーマイページから管理者宛てのメッセージを受信しました。',
    '',
    `送信者: ${input.senderDisplayName}`,
    `メールアドレス: ${input.senderEmail}`,
    `件名: ${input.subject}`,
    '',
    'メッセージ内容:',
    input.body,
    '',
    'メッセージ本体は管理ダッシュボードでも確認できます。',
  ].join('\n');
}
