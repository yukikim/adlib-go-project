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

  return (
    <header className="h-15 fixed group z-10 w-full bg-background/90">
      <AppHeaderNav isSignedIn={isSignedIn} isMember={isMember} isAdmin={isAdmin} />
      {currentUser ? (
        <div className="flex flex-col gap-3 rounded-xl border border-brand-main/15 px-4 py-3 text-sm shadow-sm md:items-end">
          <div className="space-y-1 md:text-right">
            {roleLabel ? <p className="text-xs font-medium tracking-wide text-muted-foreground">{roleLabel}</p> : null}
            {/* {roleLabel === '管理者' ? <p className="text-xs font-medium tracking-wide text-red-600">※ 管理者は内容を編集できます</p> : null} */}
            <p className="font-medium text-on-background">{displayName}</p>
            <p className="text-muted-foreground">{currentUser.email}</p>
          </div>
          <HeaderSignOutButton />
        </div>
      ) : null}
    </header>
  );
}