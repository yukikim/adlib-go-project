import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applySessionCookie, createSession } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

const allowedInstruments = ['drum', 'bass', 'piano', 'front', 'vocal'] as const;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        email?: string;
        password?: string;
        displayName?: string;
        nickname?: string;
        mainInstrument?: string;
        subInstrument?: string;
        gender?: string;
        ageRange?: string;
        area?: string;
        bio?: string;
      }
    | null;

  if (!body?.email || !body.password || !body.displayName || !body.mainInstrument) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password.trim();
  const displayName = body.displayName.trim();

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (!allowedInstruments.includes(body.mainInstrument as (typeof allowedInstruments)[number])) {
    return NextResponse.json({ error: 'Invalid mainInstrument' }, { status: 400 });
  }

  const existing = await prisma.userAccount.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.userAccount.create({
    data: {
      email,
      passwordHash,
      role: 'member',
      status: 'active',
      memberProfile: {
        create: {
          displayName,
          nickname: body.nickname?.trim() || null,
          mainInstrument: body.mainInstrument as (typeof allowedInstruments)[number],
          subInstrument: body.subInstrument?.trim() || null,
          gender: body.gender?.trim() || null,
          ageRange: body.ageRange?.trim() || null,
          area: body.area?.trim() || null,
          bio: body.bio?.trim() || null,
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