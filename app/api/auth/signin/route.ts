import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applySessionCookie, createSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  if (!body?.email || !body.password) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.userAccount.findUnique({
    where: { email },
    include: { memberProfile: true },
  });

  if (!user || user.status !== 'active') {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
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