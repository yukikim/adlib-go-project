import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionTokenFromRequest, invalidateSessionByToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  await invalidateSessionByToken(token);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}