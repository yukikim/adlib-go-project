import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, getAuthenticatedUserByToken } from '@/lib/auth';

type PageRole = 'member' | 'admin';

export async function requirePageUser(role?: PageRole) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getAuthenticatedUserByToken(token);

  if (!user || user.status !== 'active') {
    redirect('/signin');
  }

  if (role && user.role !== role) {
    redirect('/');
  }

  return user;
}