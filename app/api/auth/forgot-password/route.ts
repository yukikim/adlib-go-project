import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPasswordResetToken } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  if (!body?.email) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.userAccount.findUnique({ where: { email } });

  if (!user || user.status !== 'active') {
    return NextResponse.json({ ok: true, message: 'If the email exists, a reset token was issued.' });
  }

  const { token, expiresAt } = await createPasswordResetToken(user.id);
  const resetUrlBase = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const resetUrl = `${resetUrlBase}/?resetToken=${token}`;

  await sendMail({
    mailType: 'password_reset',
    to: user.email,
    subject: 'Adolib-go パスワード再設定',
    text: `以下の URL からパスワードを再設定してください。\n${resetUrl}\n有効期限: ${expiresAt.toISOString()}`,
  });

  return NextResponse.json({
    ok: true,
    message: 'Password reset token issued.',
    ...(process.env.NODE_ENV !== 'production' ? { resetToken: token, expiresAt } : {}),
  });
}