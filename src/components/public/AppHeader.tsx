import Link from 'next/link';
import { cookies } from 'next/headers';
import { getAuthenticatedUserByToken, getSessionTokenFromCookieStore } from '@/lib/auth';
import { HeaderSignOutButton } from './HeaderSignOutButton';

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
    <header className="border-b border-brand-main/15 bg-brand-base/15 backdrop-blur-sm">
      <div className="mx-auto flex max-w-250 flex-col gap-4 px-8 py-4 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/">トップ</Link>
          <Link href="/columns">コラム</Link>
          {!isSignedIn ? <Link href="/signin">メンバーサインイン</Link> : null}
          {!isSignedIn ? <Link href="/signup">メンバーサインアップ</Link> : null}
          {/* {!isSignedIn ? <Link href="/admin/signin">管理者サインイン</Link> : null} */}
          {isMember ? <Link href="/member">メンバー</Link> : null}
          {isAdmin ? <Link href="/admin">管理</Link> : null}
          <Link href="/about">adlib-go について</Link>
        </nav>
        {currentUser ? (
          <div className="flex flex-col gap-3 rounded-xl border border-brand-main/15 bg-white/70 px-4 py-3 text-sm shadow-sm md:items-end">
            <div className="space-y-1 md:text-right">
              {roleLabel ? <p className="text-xs font-medium tracking-wide text-muted-foreground">{roleLabel}</p> : null}
              {/* {roleLabel === '管理者' ? <p className="text-xs font-medium tracking-wide text-red-600">※ 管理者は内容を編集できます</p> : null} */}
              <p className="font-medium text-foreground">{displayName}</p>
              <p className="text-muted-foreground">{currentUser.email}</p>
            </div>
            <HeaderSignOutButton />
          </div>
        ) : null}
      </div>
    </header>
  );
}