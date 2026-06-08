import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { getSessionEventStatusLabel, normalizeSessionEventStatus, type SessionEventStatus } from '@/lib/sessionEventStatus';

type Recipient = {
  email: string;
  displayName?: string | null;
  mainInstrument?: string | null;
};

type MailSummary = {
  mailType: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
};

function formatEventDate(date: Date) {
  return date.toLocaleDateString('ja-JP');
}

function dedupeRecipients(recipients: Recipient[]) {
  const byEmail = new Map<string, Recipient>();
  for (const recipient of recipients) {
    if (!byEmail.has(recipient.email)) {
      byEmail.set(recipient.email, recipient);
    }
  }
  return [...byEmail.values()];
}

async function sendBulkMail(params: {
  recipients: Recipient[];
  mailType: string;
  subject: string;
  textBuilder: (recipient: Recipient) => string;
  createdById?: string;
}): Promise<MailSummary> {
  const recipients = dedupeRecipients(params.recipients);
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendMail({
        mailType: params.mailType,
        to: recipient.email,
        subject: params.subject,
        text: params.textBuilder(recipient),
        createdById: params.createdById,
      }),
    ),
  );

  const failedCount = results.filter((result) => result.status === 'rejected').length;

  return {
    mailType: params.mailType,
    recipientCount: recipients.length,
    sentCount: recipients.length - failedCount,
    failedCount,
  };
}

async function findActiveMemberRecipients() {
  const users = await prisma.userAccount.findMany({
    where: {
      role: 'member',
      status: 'active',
      emailVerifiedAt: { not: null },
    },
    select: {
      email: true,
      memberProfile: {
        select: { displayName: true, mainInstrument: true },
      },
    },
  });

  return users.map((user) => ({
    email: user.email,
    displayName: user.memberProfile?.displayName,
    mainInstrument: user.memberProfile?.mainInstrument,
  }));
}

async function findAttendingMemberRecipients(sessionEventId: string) {
  const entries = await prisma.sessionEntry.findMany({
    where: {
      sessionEventId,
      attendanceStatus: 'attending',
      memberProfile: {
        userAccount: {
          status: 'active',
          emailVerifiedAt: { not: null },
        },
      },
    },
    select: {
      memberProfile: {
        select: {
          displayName: true,
          mainInstrument: true,
          userAccount: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  return entries.map((entry) => ({
    email: entry.memberProfile.userAccount.email,
    displayName: entry.memberProfile.displayName,
    mainInstrument: entry.memberProfile.mainInstrument,
  }));
}

async function getSessionEventSnapshot(sessionEventId: string) {
  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: sessionEventId },
    select: {
      id: true,
      title: true,
      venue: true,
      eventDate: true,
      status: true,
    },
  });

  if (!sessionEvent) {
    throw new Error('SessionEvent not found');
  }

  return sessionEvent;
}

export async function sendSessionEventStatusNotification(params: {
  sessionEventId: string;
  previousStatus: string;
  nextStatus: string;
  createdById?: string;
}) {
  const nextStatus = normalizeSessionEventStatus(params.nextStatus);
  const sessionEvent = await getSessionEventSnapshot(params.sessionEventId);

  if (params.previousStatus === nextStatus) {
    return null;
  }

  if (nextStatus === 'announced') {
    const recipients = await findActiveMemberRecipients();
    return sendBulkMail({
      recipients,
      mailType: 'session_event_announced',
      subject: `【Adlib-go】${sessionEvent.title} の開催告知`,
      createdById: params.createdById,
      textBuilder: (recipient) => `${recipient.displayName ?? 'メンバー'} 様\n\n${sessionEvent.title} の開催予定をお知らせします。\n開催日: ${formatEventDate(sessionEvent.eventDate)}\n会場: ${sessionEvent.venue}\n\nメンバーページで詳細をご確認ください。`,
    });
  }

  if (nextStatus === 'recruiting_round1') {
    const recipients = await findActiveMemberRecipients();
    return sendBulkMail({
      recipients,
      mailType: 'session_event_round1_started',
      subject: `【Adlib-go】${sessionEvent.title} の募集ラウンド1が始まりました`,
      createdById: params.createdById,
      textBuilder: (recipient) => `${recipient.displayName ?? 'メンバー'} 様\n\n${sessionEvent.title} の募集ラウンド1を開始しました。\n${recipient.mainInstrument === 'vocal' ? '参加可否とラウンド1のリクエスト4曲をメンバーページから登録してください。' : '参加可否とラウンド1のリクエスト2曲をメンバーページから登録してください。'}\n開催日: ${formatEventDate(sessionEvent.eventDate)}\n会場: ${sessionEvent.venue}`,
    });
  }

  if (nextStatus === 'recruiting_round2') {
    const recipients = await findAttendingMemberRecipients(sessionEvent.id);
    return sendBulkMail({
      recipients,
      mailType: 'session_event_round2_started',
      subject: `【Adlib-go】${sessionEvent.title} の募集ラウンド2が始まりました`,
      createdById: params.createdById,
      textBuilder: (recipient) => `${recipient.displayName ?? 'メンバー'} 様\n\n${sessionEvent.title} の募集ラウンド2を開始しました。\n${recipient.mainInstrument === 'vocal' ? 'vocal の方はラウンド2での追加選曲はありません。結果公開までお待ちください。' : '候補曲の中から 2 曲を選び、メンバーページから登録してください。'}\n開催日: ${formatEventDate(sessionEvent.eventDate)}\n会場: ${sessionEvent.venue}`,
    });
  }

  return null;
}

export async function sendPublishedSessionSetNotification(params: {
  sessionEventId: string;
  createdById?: string;
}) {
  const sessionEvent = await getSessionEventSnapshot(params.sessionEventId);
  const recipients = await findAttendingMemberRecipients(params.sessionEventId);

  return sendBulkMail({
    recipients,
    mailType: 'session_event_session_sets_published',
    subject: `【Adlib-go】${sessionEvent.title} の sessionSet を公開しました`,
    createdById: params.createdById,
    textBuilder: (recipient) => `${recipient.displayName ?? 'メンバー'} 様\n\n${sessionEvent.title} の sessionSet を公開しました。\nメンバーページで編成内容をご確認ください。\n現在のステータス: ${getSessionEventStatusLabel(sessionEvent.status)}\n開催日: ${formatEventDate(sessionEvent.eventDate)}\n会場: ${sessionEvent.venue}`,
  });
}

export async function sendSessionEventCommentNotification(params: {
  sessionEventId: string;
  commentBody: string;
  memberDisplayName: string;
  createdById?: string;
}) {
  const sessionEvent = await getSessionEventSnapshot(params.sessionEventId);
  const admins = await prisma.userAccount.findMany({
    where: {
      role: 'admin',
      status: 'active',
    },
    select: {
      email: true,
    },
  });

  return sendBulkMail({
    recipients: admins.map((admin) => ({ email: admin.email })),
    mailType: 'session_event_comment_posted',
    subject: `【Adlib-go】${sessionEvent.title} にコメントが投稿されました`,
    createdById: params.createdById,
    textBuilder: () => `${params.memberDisplayName} さんから ${sessionEvent.title} にコメントが投稿されました。\n\nコメント:\n${params.commentBody}`,
  });
}

export type { MailSummary };