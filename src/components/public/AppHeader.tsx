import { cookies } from 'next/headers';
import { getAuthenticatedUserByToken, getSessionTokenFromCookieStore } from '@/lib/auth';
import { HeaderSignOutButton } from './HeaderSignOutButton';
import { AppHeaderNav } from './AppHeaderNav';
import { canUseMemberFeatures } from '@/lib/memberAccess';

export async function AppHeader() {
  const cookieStore = await cookies();
  const token = getSessionTokenFromCookieStore(cookieStore);
  const currentUser = await getAuthenticatedUserByToken(token);
  const displayName = currentUser?.memberProfile?.displayName?.trim() || currentUser?.email || '表示名未設定';
  const isSignedIn = Boolean(currentUser);
  const isMember = canUseMemberFeatures(currentUser);
  const isAdmin = currentUser?.role === 'admin';
  const roleLabel = isAdmin && isMember ? '管理者・メンバー' : isAdmin ? '管理者' : isMember ? 'メンバー' : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#f4eddf]/15 bg-[#0c0f0e]/95 text-[#f4eddf] backdrop-blur-sm">
      <AppHeaderNav isSignedIn={isSignedIn} isMember={isMember} isAdmin={isAdmin}>
        {currentUser ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-[#f4eddf]/15 pt-4 text-[#f4eddf]/60 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            {roleLabel ? (
              <p className="text-[9px] font-bold tracking-[0.14em] text-jazz-brass">
                {roleLabel}
              </p>
            ) : null}
            <p className="text-xs">{displayName}</p>
            <HeaderSignOutButton />
          </div>
        ) : null}
      </AppHeaderNav>
    </header>
  );
}
