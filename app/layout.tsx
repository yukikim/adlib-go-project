import './globals.css';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { M_PLUS_1p, Racing_Sans_One } from 'next/font/google';
import { AppHeader } from '@/components/public/AppHeader';
import AppFooter from '@/components/public/AppFooter';

const mPlus = M_PLUS_1p({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-m-plus',
  display: 'swap',
});

const racingSansOne = Racing_Sans_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-racing-sans-one',
  display: 'swap',
});

export const metadata = {
  title: 'Adlib-go KICK-OFF',
  description: 'ジャズを愛する人が集まり、その日だけの音楽をつくるセッションコミュニティ。',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${mPlus.variable} ${racingSansOne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        <AppHeader />
        {children}
        <AppFooter />
        <Analytics />
      </body>
    </html>
  );
}
