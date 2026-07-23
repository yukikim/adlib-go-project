import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/adminApi';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { announcementCreateRequestSchema } from '@/lib/apiSchemas';

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  // 兼務管理者がメンバーマイページを見ている場合も、メンバー向けには公開済みだけを返す。
  const isMemberAudience = request.nextUrl.searchParams.get('audience') === 'member';
  const where = auth.user.role === 'admin' && !isMemberAudience ? undefined : { isPublished: true };
  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const parsed = announcementCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const announcement = await prisma.announcement.create({
    data: {
      title: body.title,
      body: body.body,
      isPublished: body.isPublished ?? false,
      publishedAt: body.isPublished ? new Date() : null,
      createdById: admin!.userId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
