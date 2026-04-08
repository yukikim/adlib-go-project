import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminApi';
import { buildArchivePreview } from '@/lib/sessionArchive';

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const sessionEventId = request.nextUrl.pathname.split('/').slice(-2, -1)[0];
  if (!sessionEventId) {
    return NextResponse.json({ error: 'session event id is required' }, { status: 400 });
  }

  try {
    const preview = await buildArchivePreview(sessionEventId);
    return NextResponse.json({
      preview: {
        sessionEventId,
        eventDate: preview.sessionEvent.eventDate,
        venue: preview.sessionEvent.venue,
        participantCount: preview.participantCount,
        setCount: preview.setCount,
        ratingSummaryIncluded: preview.ratingSummaryIncluded,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build archive preview' },
      { status: 400 },
    );
  }
}