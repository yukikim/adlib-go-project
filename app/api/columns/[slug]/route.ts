import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop();
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const includeDraft = request.nextUrl.searchParams.get('includeDraft') === '1';
  let where = { slug, isPublished: true } as { slug: string; isPublished?: boolean };
  if (includeDraft) {
    const user = await getAuthenticatedUser(request);
    if (user?.role === 'admin' && user.status === 'active') {
      where = { slug };
    }
  }

  const column = await prisma.column.findFirst({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      body: true,
      thumbnailLabel: true,
      authorName: true,
      isPublished: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!column) {
    return NextResponse.json({ error: 'column not found' }, { status: 404 });
  }

  return NextResponse.json({ column });
}