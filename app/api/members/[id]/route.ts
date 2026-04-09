import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/adminApi';

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

  const body = (await request.json().catch(() => null)) as {
    role?: 'member' | 'admin';
    status?: 'active' | 'suspended' | 'invited';
    nickname?: string | null;
    area?: string | null;
    bio?: string | null;
  } | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const member = await prisma.memberProfile.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: 'member not found' }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.memberProfile.update({
      where: { id: memberId },
      data: {
        nickname: body.nickname === undefined ? undefined : body.nickname?.trim() || null,
        area: body.area === undefined ? undefined : body.area?.trim() || null,
        bio: body.bio === undefined ? undefined : body.bio?.trim() || null,
      },
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