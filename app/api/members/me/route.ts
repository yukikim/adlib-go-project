import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookie, createSession, getAuthenticatedUser, revokeAllSessionsForUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { memberSelfUpdateRequestSchema, validateMemberProfileInput } from '@/lib/memberProfile';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user?.memberProfile) {
    return NextResponse.json({ error: 'member profile not found' }, { status: 404 });
  }

  return NextResponse.json({ memberProfile: user.memberProfile });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user?.memberProfile) {
    return NextResponse.json({ error: 'member profile not found' }, { status: 404 });
  }

  const parsed = memberSelfUpdateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const profileValidation = validateMemberProfileInput(body, {
    requireDisplayName: true,
    requireRequiredSelections: true,
    currentMainInstrument: user.memberProfile.mainInstrument,
  });
  if ('error' in profileValidation) {
    return NextResponse.json({ error: profileValidation.error }, { status: 400 });
  }
  const memberProfileId = user.memberProfile.id;

  const shouldChangePassword = body.currentPassword || body.newPassword;
  if (shouldChangePassword) {
    const currentPassword = body.currentPassword!;
    const newPassword = body.newPassword!;
    const validCurrentPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!validCurrentPassword) {
      return NextResponse.json({ error: 'currentPassword is incorrect' }, { status: 400 });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const memberProfile = await tx.memberProfile.update({
      where: { id: memberProfileId },
      data: profileValidation.data,
    });

    if (shouldChangePassword && body.newPassword) {
      await tx.userAccount.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(body.newPassword) },
      });
    }

    return memberProfile;
  });

  const response = NextResponse.json({ memberProfile: updated });
  if (shouldChangePassword) {
    await revokeAllSessionsForUser(user.id);
    const { token, expiresAt } = await createSession(user.id);
    applySessionCookie(response, token, expiresAt);
  }

  return response;
}