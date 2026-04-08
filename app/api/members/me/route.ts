import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const allowedInstruments = ['drum', 'bass', 'piano', 'front', 'vocal'] as const;

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
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const data: Record<string, string | null> = {};

  if (typeof body.displayName === 'string') {
    const value = body.displayName.trim();
    if (!value) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }
    data.displayName = value;
  }

  if (typeof body.mainInstrument === 'string') {
    if (!allowedInstruments.includes(body.mainInstrument as (typeof allowedInstruments)[number])) {
      return NextResponse.json({ error: 'Invalid mainInstrument' }, { status: 400 });
    }
    data.mainInstrument = body.mainInstrument;
  }

  if ('nickname' in body) data.nickname = body.nickname?.trim() || null;
  if ('subInstrument' in body) data.subInstrument = body.subInstrument?.trim() || null;
  if ('gender' in body) data.gender = body.gender?.trim() || null;
  if ('ageRange' in body) data.ageRange = body.ageRange?.trim() || null;
  if ('area' in body) data.area = body.area?.trim() || null;
  if ('bio' in body) data.bio = body.bio?.trim() || null;

  const memberProfile = await prisma.memberProfile.update({
    where: { id: user.memberProfile.id },
    data,
  });

  return NextResponse.json({ memberProfile });
}