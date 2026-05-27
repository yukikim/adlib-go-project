import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMemberUser } from '@/lib/auth';
import { getZodErrorMessage } from '@/lib/authSchemas';
import { sessionEventCommentCreateRequestSchema } from '@/lib/apiSchemas';
import { sendSessionEventCommentNotification } from '@/lib/sessionEventNotifications';

export async function POST(request: NextRequest) {
  const auth = await requireMemberUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const sessionEventId = request.nextUrl.pathname.split('/').slice(-2, -1)[0];
  if (!sessionEventId) {
    return NextResponse.json({ error: 'session event id is required' }, { status: 400 });
  }

  const parsed = sessionEventCommentCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }

  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: sessionEventId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!sessionEvent) {
    return NextResponse.json({ error: 'SessionEvent not found' }, { status: 404 });
  }

  if (sessionEvent.status !== 'published') {
    return NextResponse.json({ error: 'イベントコメントは公開ステータス中のみ投稿できます' }, { status: 400 });
  }

  const comment = await prisma.sessionEventComment.create({
    data: {
      sessionEventId,
      userAccountId: auth.user.id,
      body: parsed.data.body,
    },
  });

  await sendSessionEventCommentNotification({
    sessionEventId,
    commentBody: parsed.data.body,
    memberDisplayName: auth.user.memberProfile?.displayName ?? auth.user.email,
    createdById: auth.user.id,
  });

  return NextResponse.json({ comment }, { status: 201 });
}