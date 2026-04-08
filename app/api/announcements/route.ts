import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/adminApi';

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const where = auth.user.role === 'admin' ? undefined : { isPublished: true };
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

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    body?: string;
    isPublished?: boolean;
  } | null;

  if (!body?.title || !body.body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: body.title.trim(),
      body: body.body.trim(),
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