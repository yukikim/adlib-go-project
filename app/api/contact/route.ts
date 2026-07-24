import { NextRequest, NextResponse } from 'next/server';

import {
  buildContactMailText,
  CONTACT_REQUEST_MAX_BYTES,
  contactSubmissionSchema,
  getContactValidationError,
} from '@/lib/contact';
import { consumeContactRateLimit, getContactClientKey } from '@/lib/contactRateLimit';
import { sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';

const contactRecipientSchema = contactSubmissionSchema.shape.email;

function jsonResponse(body: object, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set([request.nextUrl.origin]);
  const appBaseUrl = process.env.APP_BASE_URL?.trim();
  if (appBaseUrl) {
    try {
      allowedOrigins.add(new URL(appBaseUrl).origin);
    } catch {
      // APP_BASE_URL の設定不備は送信先設定の検証とは分け、現在の origin だけを許可する。
    }
  }

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: 'この送信元からは受け付けられません。' }, 403);
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > CONTACT_REQUEST_MAX_BYTES) {
    return jsonResponse({ error: '送信内容が大きすぎます。' }, 413);
  }

  const rawBody = await request.text().catch(() => '');
  if (Buffer.byteLength(rawBody, 'utf8') > CONTACT_REQUEST_MAX_BYTES) {
    return jsonResponse({ error: '送信内容が大きすぎます。' }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: '送信内容を読み取れませんでした。' }, 400);
  }

  const parsed = contactSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: getContactValidationError(parsed.error) }, 400);
  }

  // Honeypot に値がある場合も成功と同じ応答にし、bot に検出結果を知らせない。
  if (parsed.data.website) {
    return jsonResponse({
      ok: true,
      message: 'お問い合わせを受け付けました。',
    });
  }

  const rateLimit = consumeContactRateLimit(getContactClientKey(request.headers));
  if (!rateLimit.allowed) {
    return jsonResponse(
      { error: '送信回数が上限に達しました。時間をおいて再度お試しください。' },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    );
  }

  const recipient = contactRecipientSchema.safeParse(process.env.CONTACT_TO_EMAIL);
  if (!recipient.success) {
    console.error('CONTACT_TO_EMAIL is missing or invalid.');
    return jsonResponse(
      { error: '現在、お問い合わせを送信できません。時間をおいて再度お試しください。' },
      503,
    );
  }

  try {
    await sendMail({
      mailType: 'public_contact',
      to: recipient.data,
      replyTo: parsed.data.email,
      subject: `【Adlib-go】お問い合わせ: ${parsed.data.subject}`,
      text: buildContactMailText(parsed.data),
    });
  } catch (error) {
    console.error('Failed to send public contact email.', error);
    return jsonResponse(
      { error: 'お問い合わせを送信できませんでした。時間をおいて再度お試しください。' },
      500,
    );
  }

  return jsonResponse({
    ok: true,
    message: 'お問い合わせを受け付けました。',
  });
}

