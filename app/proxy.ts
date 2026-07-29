import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MAINTENANCE_DOMAINS = new Set([
  'www.adlib-go.com',
  'adlib-go.com',
]);

const MAINTENANCE_HTML = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ただいま制作中 | Adlib-go</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      color: #f8f3e8;
      background:
        radial-gradient(circle at top, #294c3c 0%, #13271f 48%, #09120e 100%);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans JP", sans-serif;
    }
    main {
      width: min(640px, 100%);
      padding: 56px 32px;
      text-align: center;
      border: 1px solid rgba(212, 169, 76, 0.45);
      border-radius: 24px;
      background: rgba(9, 18, 14, 0.72);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }
    p:first-child {
      margin: 0 0 16px;
      color: #d4a94c;
      font-weight: 700;
      letter-spacing: 0.18em;
    }
    h1 {
      margin: 0 0 24px;
      font-size: clamp(2rem, 7vw, 3.5rem);
    }
    p:last-child {
      margin: 0;
      line-height: 1.9;
      color: #d8ddd9;
    }
  </style>
</head>
<body>
  <main>
    <p>ADLIB-GO</p>
    <h1>ただいま制作中です</h1>
    <p>
      現在、公開に向けて準備を進めています。<br>
      今しばらくお待ちください。
    </p>
  </main>
</body>
</html>`;

export function proxy(request: NextRequest) {
  const host = (request.headers.get('host') ?? '')
    .split(':')[0]
    .toLowerCase();

  if (!MAINTENANCE_DOMAINS.has(host)) {
    return NextResponse.next();
  }

  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'Retry-After': '3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const config = {
  matcher: '/:path*',
};