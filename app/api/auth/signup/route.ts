import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applySessionCookie, createSession } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { validateMemberProfileInput } from '@/lib/memberProfile';
import { getZodErrorMessage, signUpRequestSchema } from '@/lib/authSchemas';

export async function POST(request: NextRequest) {
  const parsed = signUpRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const profileValidation = validateMemberProfileInput(body, {
    requireDisplayName: true,
    requireRequiredSelections: true,
  });
  if ('error' in profileValidation) {
    return NextResponse.json({ error: profileValidation.error }, { status: 400 });
  }
  const profileData = profileValidation.data;

  const existing = await prisma.userAccount.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.userAccount.create({
    data: {
      email: body.email,
      passwordHash,
      role: 'member',
      status: 'active',
      memberProfile: {
        create: {
          displayName: body.displayName,
          mainInstrument: profileData.mainInstrument!,
          subInstrument: profileData.subInstrument ?? null,
          gender: profileData.gender!,
          ageRange: profileData.ageRange!,
          area: profileData.area!,
          nickname: null,
          bio: null,
        },
      },
    },
    include: { memberProfile: true },
  });

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        memberProfile: user.memberProfile,
      },
    },
    { status: 201 },
  );
  applySessionCookie(response, token, expiresAt);
  return response;
}