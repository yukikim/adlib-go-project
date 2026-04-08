import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

export async function PATCH(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const announcementId = request.nextUrl.pathname.split('/').pop();
  if (!announcementId) {
    return NextResponse.json({ error: 'announcement id is required' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    body?: string;
    isPublished?: boolean;
  } | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const announcement = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      title: body.title === undefined ? undefined : body.title.trim(),
      body: body.body === undefined ? undefined : body.body.trim(),
      isPublished: body.isPublished,
      publishedAt: body.isPublished === undefined ? undefined : body.isPublished ? new Date() : null,
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

  return NextResponse.json({ announcement });
}