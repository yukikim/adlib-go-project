import { cookies } from 'next/headers';
import { getAuthenticatedUserByToken, getSessionTokenFromCookieStore } from '@/lib/auth';
import { HeaderSignOutButton } from './HeaderSignOutButton';
import { AppHeaderNav } from './AppHeaderNav';

export async function AppHeader() {
  const cookieStore = await cookies();
  const token = getSessionTokenFromCookieStore(cookieStore);
  const currentUser = await getAuthenticatedUserByToken(token);
  const displayName = currentUser?.memberProfile?.displayName?.trim() || currentUser?.email || '表示名未設定';
  const isSignedIn = Boolean(currentUser);
  const isMember = currentUser?.role === 'member';
  const isAdmin = currentUser?.role === 'admin';
  const roleLabel = isAdmin ? '管理者' : isMember ? 'メンバー' : null;
  // console.log('currentUser in AppHeader:', currentUser);

  return (
    <header className="h-15 fixed group z-10 w-full bg-background/90">
      <AppHeaderNav isSignedIn={isSignedIn} isMember={isMember} isAdmin={isAdmin}>
      {currentUser ? (
          <div className="flex gap-2 flex-wrap items-center text-gray-600">
            {roleLabel ? <p className="text-xs font-medium tracking-wide">{roleLabel}</p> : null}
            <p className="text-xs">{displayName}</p>
            <p className="text-xs">{currentUser.email}</p>
            <HeaderSignOutButton />
          </div>
      ) : null}
      </AppHeaderNav>
    </header>
  );
}