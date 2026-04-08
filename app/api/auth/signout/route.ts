import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, invalidateSessionByToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  await invalidateSessionByToken(token);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}