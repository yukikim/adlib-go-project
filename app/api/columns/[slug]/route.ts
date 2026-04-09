import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';
import { getAuthenticatedUser } from '@/lib/auth';
import { slugifyColumnTitle } from '@/lib/columns';

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

export async function PATCH(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/').pop();
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    slug?: string;
    summary?: string;
    body?: string;
    thumbnailLabel?: string;
    authorName?: string;
    isPublished?: boolean;
  } | null;

  if (!body?.title || !body.summary || !body.body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const current = await prisma.column.findUnique({ where: { slug } });
  if (!current) {
    return NextResponse.json({ error: 'column not found' }, { status: 404 });
  }

  const nextSlug = (body.slug?.trim() || slugifyColumnTitle(body.title)).slice(0, 80);
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
  const column = await prisma.column.update({
    where: { slug },
    data: {
      slug: nextSlug,
      title: body.title.trim(),
      summary: body.summary.trim(),
      body: body.body.trim(),
      thumbnailLabel: body.thumbnailLabel?.trim() || null,
      authorName: body.authorName?.trim() || 'Adolib-go 運営',
      isPublished,
      publishedAt: isPublished ? current.publishedAt ?? new Date() : null,
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