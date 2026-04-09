import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookie, createSession, getAuthenticatedUser, revokeAllSessionsForUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { validateMemberProfileInput } from '@/lib/memberProfile';

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

  const body = (await request.json().catch(() => null)) as
    | {
        displayName?: string;
        nickname?: string | null;
        mainInstrument?: string;
        subInstrument?: string | null;
        gender?: string | null;
        ageRange?: string | null;
        area?: string | null;
        bio?: string | null;
        currentPassword?: string;
        newPassword?: string;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

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
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
    }
    if (body.newPassword.trim().length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    const validCurrentPassword = await verifyPassword(body.currentPassword, user.passwordHash);
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
        data: { passwordHash: await hashPassword(body.newPassword.trim()) },
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