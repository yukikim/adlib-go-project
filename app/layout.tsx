import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Adolib-go KICK-OFF',
  description: '公開ページ、メンバーサイト、管理サイトを持つセッション運営アプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header style={{ borderBottom: '1px solid #e5e5e5', background: '#fafafa' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1rem 2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="/">トップ</a>
            <a href="/signin">サインイン</a>
            <a href="/signup">サインアップ</a>
            <a href="/member">メンバー</a>
            <a href="/admin">管理</a>
            <a href="/about">adolib-go について</a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
