import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthenticatedUserByToken, getSessionTokenFromCookieStore } from '@/lib/auth';
import { canUseMemberFeatures } from '@/lib/memberAccess';

type PageRole = 'member' | 'admin';

export async function requirePageUser(role?: PageRole, signInPath = '/signin') {
  const cookieStore = await cookies();
  const token = getSessionTokenFromCookieStore(cookieStore);
  const user = await getAuthenticatedUserByToken(token);

  if (!user || user.status !== 'active') {
    redirect(signInPath);
  }

  if (role === 'member' && !canUseMemberFeatures(user)) {
    redirect(user.role === 'admin' ? '/admin' : signInPath);
  }

  if (role === 'admin' && user.role !== 'admin') {
    redirect('/member');
  }

  return user;
}
