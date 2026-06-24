import { createHash, randomBytes } from 'crypto';

export const MEMBER_INVITATION_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function hashMemberInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createMemberInvitationToken() {
  return {
    token: randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + MEMBER_INVITATION_TOKEN_MAX_AGE_MS),
  };
}
