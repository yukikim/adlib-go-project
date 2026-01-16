import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Jazz Session Planner',
  description: 'Generate jazz session sets from participants',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
