import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugifyColumnTitle } from '@/lib/columns';
import { getAuthenticatedUser } from '@/lib/auth';
import { requireAdmin } from '@/lib/adminApi';
import { columnMutationRequestSchema } from '@/lib/apiSchemas';
import { getZodErrorMessage } from '@/lib/authSchemas';

export async function GET(request: NextRequest) {
  const includeDrafts = request.nextUrl.searchParams.get('includeDrafts') === '1';
  const now = new Date();
  let where = { isPublished: true, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] } as {
    isPublished?: boolean;
    OR?: Array<{ publishedAt: null } | { publishedAt: { lte: Date } }>;
  };

  if (includeDrafts) {
    const user = await getAuthenticatedUser(request);
    if (user?.role === 'admin' && user.status === 'active') {
      where = {};
    }
  }

  const columns = await prisma.column.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      body: true,
      thumbnailLabel: true,
      authorName: true,
      displayOrder: true,
      isPublished: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ columns });
}

export async function POST(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const parsed = columnMutationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const slug = (body.slug || slugifyColumnTitle(body.title)).slice(0, 80);
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const existing = await prisma.column.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'slug already exists' }, { status: 409 });
  }

  const displayOrder = typeof body.displayOrder === 'number' ? body.displayOrder : 0;
  const publishedAt = body.publishedAt ? new Date(body.publishedAt) : body.isPublished ? new Date() : null;

  const column = await prisma.column.create({
    data: {
      slug,
      title: body.title,
      summary: body.summary,
      body: body.body,
      thumbnailLabel: body.thumbnailLabel ?? null,
      authorName: body.authorName || 'Adolib-go 運営',
      displayOrder,
      isPublished: body.isPublished ?? false,
      publishedAt,
      createdById: admin!.userId,
    },
  });

  return NextResponse.json({ column }, { status: 201 });
}