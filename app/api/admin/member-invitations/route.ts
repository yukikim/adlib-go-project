import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminApi';
import { createMemberInvitationRequestSchema, getZodErrorMessage } from '@/lib/authSchemas';
import { createMemberInvitationToken, hashMemberInvitationToken } from '@/lib/memberInvitation';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response || !admin) return response!;

  const parsed = createMemberInvitationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });

  const { email } = parsed.data;
  if (await prisma.userAccount.findUnique({ where: { email } })) {
    return NextResponse.json({ error: 'このメールアドレスは既に登録されています。' }, { status: 409 });
  }

  const { token, expiresAt } = createMemberInvitationToken();
  await prisma.memberInvitationToken.deleteMany({ where: { email, usedAt: null } });
  await prisma.memberInvitationToken.create({
    data: { email, tokenHash: hashMemberInvitationToken(token), expiresAt, createdById: admin.userId },
  });

  const signupUrl = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/signup?token=${token}`;
  await sendMail({
    mailType: 'member_registration_invitation',
    to: email,
    subject: '【Adlib-go】メンバー登録のご案内',
    text: `Adlib-go のメンバー登録をご案内します。\n以下の URL から登録を完了してください。\n${signupUrl}\n\nこの URL の有効期限は ${expiresAt.toISOString()} です。`,
    createdById: admin.userId,
  });

  return NextResponse.json({ ok: true, expiresAt });
}
