import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminApi';
import { prisma } from '@/lib/prisma';
import { buildSessionSetDraftTitle } from '@/lib/sessionSets';

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const sessionEventId = request.nextUrl.searchParams.get('sessionEventId');

  const drafts = await prisma.sessionSetDraft.findMany({
    where: sessionEventId ? { sessionEventId } : undefined,
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({
    drafts: drafts.map((draft) => ({
      id: draft.id,
      sessionEventId: draft.sessionEventId,
      title: draft.title,
      sessionSetCount: Array.isArray(draft.sessionSetsJson) ? draft.sessionSetsJson.length : 0,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      sessionSets: Array.isArray(draft.sessionSetsJson) ? draft.sessionSetsJson : [],
      skippedSongs: Array.isArray(draft.skippedSongsJson) ? draft.skippedSongsJson : [],
      forcedSessionSets: Array.isArray(draft.forcedSessionSetsJson) ? draft.forcedSessionSetsJson : [],
    })),
  });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null) as null | {
    sessionEventId?: string;
    sessionSets?: unknown;
    skippedSongs?: unknown;
    forcedSessionSets?: unknown;
  };

  if (!body?.sessionEventId) {
    return NextResponse.json({ error: 'sessionEventId is required' }, { status: 400 });
  }

  if (!Array.isArray(body.sessionSets) || body.sessionSets.length === 0) {
    return NextResponse.json({ error: 'sessionSets is required' }, { status: 400 });
  }

  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: body.sessionEventId },
    select: { id: true, title: true, eventType: true },
  });

  if (!sessionEvent) {
    return NextResponse.json({ error: 'SessionEvent not found' }, { status: 404 });
  }
  if (sessionEvent.eventType === 'attendance_only') {
    return NextResponse.json(
      { error: 'リクエスト曲なしイベントでは sessionSet 下書きを保存できません' },
      { status: 400 },
    );
  }

  const title = buildSessionSetDraftTitle(sessionEvent.title);

  const draft = await prisma.sessionSetDraft.upsert({
    where: {
      sessionEventId_title: {
        sessionEventId: sessionEvent.id,
        title,
      },
    },
    update: {
      sessionSetsJson: body.sessionSets,
      skippedSongsJson: Array.isArray(body.skippedSongs) ? body.skippedSongs : [],
      forcedSessionSetsJson: Array.isArray(body.forcedSessionSets) ? body.forcedSessionSets : [],
    },
    create: {
      sessionEventId: sessionEvent.id,
      title,
      sessionSetsJson: body.sessionSets,
      skippedSongsJson: Array.isArray(body.skippedSongs) ? body.skippedSongs : [],
      forcedSessionSetsJson: Array.isArray(body.forcedSessionSets) ? body.forcedSessionSets : [],
    },
  });

  return NextResponse.json({
    draft: {
      id: draft.id,
      sessionEventId: draft.sessionEventId,
      title: draft.title,
      sessionSetCount: Array.isArray(draft.sessionSetsJson) ? draft.sessionSetsJson.length : 0,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      sessionSets: Array.isArray(draft.sessionSetsJson) ? draft.sessionSetsJson : [],
      skippedSongs: Array.isArray(draft.skippedSongsJson) ? draft.skippedSongsJson : [],
      forcedSessionSets: Array.isArray(draft.forcedSessionSetsJson) ? draft.forcedSessionSetsJson : [],
    },
  });
}
