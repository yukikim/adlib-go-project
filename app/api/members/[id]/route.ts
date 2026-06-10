import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { adminMemberUpdateRequestSchema, validateMemberProfileInput } from '@/lib/memberProfile';
import { syncParticipantForMemberProfile } from '@/lib/participantSync';

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const memberId = request.nextUrl.pathname.split('/').pop();
  if (!memberId) {
    return NextResponse.json({ error: 'member id is required' }, { status: 400 });
  }

  const member = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    include: {
      userAccount: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastSignedInAt: true,
        },
      },
      sessionEntries: {
        include: {
          sessionEvent: true,
          requests: {
            orderBy: [{ round: 'asc' }, { priority: 'asc' }],
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: 'member not found' }, { status: 404 });
  }

  const ratings = await prisma.sessionSetRating.findMany({
    where: { userAccountId: member.userAccountId },
    include: {
      sessionSet: {
        select: {
          id: true,
          title: true,
        },
      },
      sessionEvent: {
        select: {
          id: true,
          title: true,
          eventDate: true,
        },
      },
    },
    orderBy: [{ ratedAt: 'desc' }],
  });

  return NextResponse.json({ member, ratings });
}

export async function PATCH(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const memberId = request.nextUrl.pathname.split('/').pop();
  if (!memberId) {
    return NextResponse.json({ error: 'member id is required' }, { status: 400 });
  }

  const parsed = adminMemberUpdateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const member = await prisma.memberProfile.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: 'member not found' }, { status: 404 });
  }

  const profileValidation = validateMemberProfileInput(body, {
    currentMainInstrument: member.mainInstrument,
  });
  if ('error' in profileValidation) {
    return NextResponse.json({ error: profileValidation.error }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedMemberProfile = await tx.memberProfile.update({
      where: { id: memberId },
      data: profileValidation.data,
    });

    await syncParticipantForMemberProfile(tx, {
      previousDisplayName: member.displayName,
      previousMainInstrument: member.mainInstrument,
      nextDisplayName: updatedMemberProfile.displayName,
      nextMainInstrument: updatedMemberProfile.mainInstrument,
    });

    if (body.role || body.status) {
      await tx.userAccount.update({
        where: { id: member.userAccountId },
        data: {
          role: body.role,
          status: body.status,
        },
      });
    }

    return tx.memberProfile.findUniqueOrThrow({
      where: { id: memberId },
      include: {
        userAccount: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  });

  return NextResponse.json({ member: updated });
}

export async function DELETE(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const memberId = request.nextUrl.pathname.split('/').pop();
  if (!memberId) {
    return NextResponse.json({ error: 'member id is required' }, { status: 400 });
  }

  const member = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    include: {
      userAccount: {
        select: {
          id: true,
          role: true,
          email: true,
        },
      },
    },
  });
  if (!member) {
    return NextResponse.json({ error: 'member not found' }, { status: 404 });
  }

  if (member.userAccount.id === admin?.userId) {
    return NextResponse.json({ error: '自分自身は削除できません' }, { status: 400 });
  }

  if (member.userAccount.role === 'admin') {
    return NextResponse.json({ error: '管理者アカウントは削除できません。role を member に戻してください。' }, { status: 400 });
  }

  await prisma.userAccount.delete({ where: { id: member.userAccount.id } });
  return NextResponse.json({ ok: true });
}