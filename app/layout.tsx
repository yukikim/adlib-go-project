import './globals.css';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { AppHeader } from '@/components/public/AppHeader';
import AppFooter from '@/components/public/AppFooter';

export const metadata = {
  title: 'Adlib-go KICK-OFF',
  description: 'ただいま工事中, 公開ページ、メンバーサイト、管理サイトを持つセッション運営アプリ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white">
        <AppHeader />
        {/* <div id="top-container" className="min-h-screen overflow-hidden"> */}
          {children}
        {/* </div> */}
        <AppFooter />
        <Analytics />
      </body>
    </html>
  );
}
