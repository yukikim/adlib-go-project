import { NextRequest, NextResponse } from 'next/server';
import { consumePasswordResetToken, revokeAllSessionsForUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { token?: string; password?: string }
    | null;

  if (!body?.token || !body.password) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (body.password.trim().length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const user = await consumePasswordResetToken(body.token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password.trim());
  await prisma.userAccount.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  await revokeAllSessionsForUser(user.id);

  return NextResponse.json({ ok: true });
}