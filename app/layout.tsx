import './globals.css';
import type { ReactNode } from 'react';
import { Analytics } from "@vercel/analytics/next"

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
            <a href="/">トップ</a>
            <a href="/columns">コラム</a>
            <a href="/signin">メンバーサインイン</a>
            <a href="/signup">メンバーサインアップ</a>
            <a href="/admin/signin">管理者サインイン</a>
            <a href="/member">メンバー</a>
            <a href="/admin">管理</a>
            <a href="/about">adlib-go について</a>
          </div>
        </header>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
