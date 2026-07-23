import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applySessionCookie, createSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { getZodErrorMessage, signInRequestSchema } from '@/lib/authSchemas';
import { canUseMemberFeatures } from '@/lib/memberAccess';

export async function POST(request: NextRequest) {
  const parsed = signInRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const body = parsed.data;
  const roleTarget = body.roleTarget === 'admin' ? 'admin' : 'member';
  const user = await prisma.userAccount.findUnique({
    where: { email: body.email },
    include: { memberProfile: true },
  });

  if (!user || user.status !== 'active') {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが無効です。' }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが無効です。' }, { status: 401 });
  }

  if (roleTarget === 'member' && !canUseMemberFeatures(user)) {
    return NextResponse.json({ error: 'メンバープロフィールが登録されていません。管理者は /admin/signin を利用してください。' }, { status: 403 });
  }

  if (roleTarget === 'admin' && user.role !== 'admin') {
    return NextResponse.json({ error: '管理者アカウントではありません。' }, { status: 403 });
  }

  await prisma.userAccount.update({
    where: { id: user.id },
    data: { lastSignedInAt: new Date() },
  });

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      memberProfile: user.memberProfile,
    },
  });
  applySessionCookie(response, token, expiresAt);
  return response;
}
