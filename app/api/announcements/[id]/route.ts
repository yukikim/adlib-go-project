import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { announcementUpdateRequestSchema } from '@/lib/apiSchemas';
import { getZodErrorMessage } from '@/lib/authSchemas';

export async function PATCH(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const announcementId = request.nextUrl.pathname.split('/').pop();
  if (!announcementId) {
    return NextResponse.json({ error: 'announcement id is required' }, { status: 400 });
  }

  const parsed = announcementUpdateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const announcement = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      title: body.title,
      body: body.body,
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