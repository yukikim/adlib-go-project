import { createEmailVerificationToken } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

export async function sendEmailVerificationMail(userAccountId: string, email: string) {
  const { token, expiresAt } = await createEmailVerificationToken(userAccountId);
  const verifyUrlBase = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const verifyUrl = `${verifyUrlBase}/verify-email?token=${token}`;

  await sendMail({
    mailType: 'email_verification',
    to: email,
    subject: 'Adlib-go メールアドレス認証',
    text: `以下の URL からメールアドレス認証を完了してください。\n${verifyUrl}\n有効期限: ${expiresAt.toISOString()}`,
  });

  return { token, expiresAt };
}