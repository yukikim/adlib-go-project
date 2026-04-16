import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getAuthenticatedUser } from '@/lib/auth';
import { slugifyColumnTitle } from '@/lib/columns';
import { columnMutationRequestSchema } from '@/lib/apiSchemas';
import { getZodErrorMessage } from '@/lib/authSchemas';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop();
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const includeDraft = request.nextUrl.searchParams.get('includeDraft') === '1';
  const now = new Date();
  let where = {
    slug,
    isPublished: true,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  } as {
    slug: string;
    isPublished?: boolean;
    OR?: Array<{ publishedAt: null } | { publishedAt: { lte: Date } }>;
  };
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
      displayOrder: true,
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

export async function PATCH(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop();
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const parsed = columnMutationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const current = await prisma.column.findUnique({ where: { slug } });
  if (!current) {
    return NextResponse.json({ error: 'column not found' }, { status: 404 });
  }

  const nextSlug = (body.slug || slugifyColumnTitle(body.title)).slice(0, 80);
  if (!nextSlug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  if (nextSlug !== slug) {
    const existing = await prisma.column.findUnique({ where: { slug: nextSlug }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'slug already exists' }, { status: 409 });
    }
  }

  const isPublished = body.isPublished ?? current.isPublished;
  const displayOrder = typeof body.displayOrder === 'number' ? body.displayOrder : current.displayOrder;
  const publishedAt = isPublished
    ? body.publishedAt
      ? new Date(body.publishedAt)
      : current.publishedAt ?? new Date()
    : null;
  const column = await prisma.column.update({
    where: { slug },
    data: {
      slug: nextSlug,
      title: body.title,
      summary: body.summary,
      body: body.body,
      thumbnailLabel: body.thumbnailLabel ?? null,
      authorName: body.authorName || 'Adlib-go 運営',
      displayOrder,
      isPublished,
      publishedAt,
    },
  });

  return NextResponse.json({ column });
}

export async function DELETE(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop();
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const current = await prisma.column.findUnique({ where: { slug }, select: { id: true } });
  if (!current) {
    return NextResponse.json({ error: 'column not found' }, { status: 404 });
  }

  await prisma.column.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}