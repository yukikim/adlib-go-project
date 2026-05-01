import './globals.css';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { AppHeader } from '@/components/public/AppHeader';

export const metadata = {
  title: 'Adlib-go KICK-OFF',
  description: '公開ページ、メンバーサイト、管理サイトを持つセッション運営アプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppHeader />
        <div className="bg-brand-base/10 min-h-screen">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
