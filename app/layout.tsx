import './globals.css';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { AppHeader } from '@/components/public/AppHeader';

export const metadata = {
  title: 'Adlib-go KICK-OFF',
  description: 'ただいま工事中, 公開ページ、メンバーサイト、管理サイトを持つセッション運営アプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-white">
        <AppHeader />
        <div id="top-container" className="min-h-screen overflow-hidden">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
