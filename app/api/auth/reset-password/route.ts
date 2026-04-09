import { NextRequest, NextResponse } from 'next/server';
import { consumePasswordResetToken, revokeAllSessionsForUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { getZodErrorMessage, resetPasswordRequestSchema } from '@/lib/authSchemas';

export async function POST(request: NextRequest) {
  const parsed = resetPasswordRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const user = await consumePasswordResetToken(body.token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password);
  await prisma.userAccount.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  await revokeAllSessionsForUser(user.id);

  return NextResponse.json({ ok: true });
}