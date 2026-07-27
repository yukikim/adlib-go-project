import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/adminApi';
import { requireMemberUser } from '@/lib/auth';
import {
  buildMemberMessageNotificationText,
  memberMessageSubmissionSchema,
} from '@/lib/memberMessage';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const contactRecipientSchema = z.string().trim().email();

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const messages = await prisma.memberMessage.findMany({
    orderBy: [{ createdAt: 'desc' }],
  });

  return jsonResponse({ messages });
}

export async function POST(request: NextRequest) {
  const auth = await requireMemberUser(request);
  if ('response' in auth) {
    return auth.response;
  }

  const parsed = memberMessageSubmissionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' },
      400,
    );
  }

  const senderDisplayName = auth.user.memberProfile?.displayName?.trim() || auth.user.email;
  const message = await prisma.memberMessage.create({
    data: {
      senderId: auth.user.id,
      senderDisplayName,
      senderEmail: auth.user.email,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });

  const recipient = contactRecipientSchema.safeParse(process.env.CONTACT_TO_EMAIL);
  if (!recipient.success) {
    console.error('CONTACT_TO_EMAIL is missing or invalid for member message notification.');
    return jsonResponse(
      {
        message,
        notificationSent: false,
        warning: 'メッセージは保存されましたが、管理者への通知メールを送信できませんでした。',
      },
      201,
    );
  }

  try {
    await sendMail({
      mailType: 'member_message_notification',
      to: recipient.data,
      replyTo: auth.user.email,
      subject: `【Adlib-go】メンバーメッセージ: ${parsed.data.subject}`,
      text: buildMemberMessageNotificationText({
        senderDisplayName,
        senderEmail: auth.user.email,
        subject: parsed.data.subject,
        body: parsed.data.body,
      }),
      createdById: auth.user.id,
    });
  } catch (error) {
    console.error('Failed to send member message notification email.', error);
    return jsonResponse(
      {
        message,
        notificationSent: false,
        warning: 'メッセージは保存されましたが、管理者への通知メールを送信できませんでした。',
      },
      201,
    );
  }

  return jsonResponse(
    {
      message,
      notificationSent: true,
    },
    201,
  );
}
