import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canUseMemberFeatures } from '@/lib/memberAccess';

type CookieValueReader = {
  get: (name: string) => { value?: string } | undefined;
};

export const SESSION_COOKIE_NAME = 'adlib_session';
export const LEGACY_SESSION_COOKIE_NAMES = ['adolib_session'] as const;
const ALL_SESSION_COOKIE_NAMES = [SESSION_COOKIE_NAME, ...LEGACY_SESSION_COOKIE_NAMES];
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_RESET_TOKEN_MAX_AGE_MS = 1000 * 60 * 60;
const EMAIL_VERIFICATION_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function buildSessionCookieValue() {
  return randomBytes(32).toString('hex');
}

function getSessionCookieConfig(name: string, value: string, expires: Date, maxAge: number) {
  return {
    name,
    value,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
    maxAge,
  };
}

export function getSessionTokenFromCookieStore(cookieStore: CookieValueReader) {
  for (const cookieName of ALL_SESSION_COOKIE_NAMES) {
    const token = cookieStore.get(cookieName)?.value;
    if (token) {
      return token;
    }
  }

  return undefined;
}

export function getSessionTokenFromRequest(request: NextRequest) {
  return getSessionTokenFromCookieStore(request.cookies);
}

export function applySessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(getSessionCookieConfig(SESSION_COOKIE_NAME, token, expiresAt, SESSION_MAX_AGE_SECONDS));

  for (const legacyCookieName of LEGACY_SESSION_COOKIE_NAMES) {
    response.cookies.set(getSessionCookieConfig(legacyCookieName, '', new Date(0), 0));
  }
}

export function clearSessionCookie(response: NextResponse) {
  for (const cookieName of ALL_SESSION_COOKIE_NAMES) {
    response.cookies.set(getSessionCookieConfig(cookieName, '', new Date(0), 0));
  }
}

export async function createSession(userAccountId: string) {
  const token = buildSessionCookieValue();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.authSession.create({
    data: {
      userAccountId,
      sessionTokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function invalidateSessionByToken(token: string | undefined) {
  if (!token) {
    return;
  }

  await prisma.authSession.deleteMany({
    where: { sessionTokenHash: hashToken(token) },
  });
}

export async function getAuthenticatedUserByToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const now = new Date();
  const session = await prisma.authSession.findUnique({
    where: { sessionTokenHash: hashToken(token) },
    include: {
      userAccount: {
        include: {
          memberProfile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= now) {
    if (session) {
      await prisma.authSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastAccessedAt: now },
  });

  return session.userAccount;
}

export async function revokeAllSessionsForUser(userAccountId: string) {
  await prisma.authSession.deleteMany({
    where: { userAccountId },
  });
}

export async function getAuthenticatedUser(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  return getAuthenticatedUserByToken(token);
}

export async function requireAuthenticatedUser(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user || user.status !== 'active') {
    return {
      response: NextResponse.json(
        { error: 'unauthorized', message: 'sign in is required' },
        { status: 401 },
      ),
    };
  }

  return { user };
}

export async function requireMemberUser(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) {
    return auth;
  }

  if (!canUseMemberFeatures(auth.user)) {
    return {
      response: NextResponse.json(
        { error: 'forbidden', message: 'member profile is required' },
        { status: 403 },
      ),
    };
  }

  return auth;
}

export async function createPasswordResetToken(userAccountId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_MAX_AGE_MS);

  await prisma.passwordResetToken.create({
    data: {
      userAccountId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function createEmailVerificationToken(userAccountId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_MAX_AGE_MS);

  await prisma.emailVerificationToken.deleteMany({
    where: { userAccountId, usedAt: null },
  });

  await prisma.emailVerificationToken.create({
    data: {
      userAccountId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function consumePasswordResetToken(token: string) {
  const now = new Date();
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { userAccount: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: now },
  });

  return resetToken.userAccount;
}

export async function verifyEmailByToken(token: string) {
  const now = new Date();
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { userAccount: true },
  });

  if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt <= now) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: now },
    });

    return tx.userAccount.update({
      where: { id: verificationToken.userAccountId },
      data: { emailVerifiedAt: verificationToken.userAccount.emailVerifiedAt ?? now },
      include: { memberProfile: true },
    });
  });
}
