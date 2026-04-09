import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const members = await prisma.memberProfile.findMany({
    include: {
      userAccount: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          sessionEntries: true,
        },
      },
    },
    orderBy: [{ displayName: 'asc' }],
  });

  return NextResponse.json({
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      nickname: member.nickname,
      mainInstrument: member.mainInstrument,
      subInstrument: member.subInstrument,
      gender: member.gender,
      ageRange: member.ageRange,
      area: member.area,
      bio: member.bio,
      createdAt: member.createdAt,
      userAccount: member.userAccount,
      entryCount: member._count.sessionEntries,
    })),
  });
}