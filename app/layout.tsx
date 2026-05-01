import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Adlib-go KICK-OFF',
  description: '公開ページ、メンバーサイト、管理サイトを持つセッション運営アプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b border-brand-main/15 bg-brand-base/15 backdrop-blur-sm">
          <div className="mx-auto flex max-w-250 flex-wrap gap-4 px-8 py-4">
            <Link href="/">トップ</Link>
            <Link href="/columns">コラム</Link>
            <Link href="/signin">メンバーサインイン</Link>
            <Link href="/signup">メンバーサインアップ</Link>
            <Link href="/admin/signin">管理者サインイン</Link>
            <Link href="/member">メンバー</Link>
            <Link href="/admin">管理</Link>
            <Link href="/about">adlib-go について</Link>
          </div>
        </header>
        <div className="bg-brand-base/10 min-h-screen">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
