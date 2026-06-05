import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <main className="mx-0 mt-15 flex min-h-[calc(100vh-3.75rem)] w-full flex-col bg-[color-mix(in_srgb,var(--brand-base)_16%,white)] px-4 py-6">
      <div className="admin-content-stage brand-hero-surface mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center rounded-3xl border px-6 py-16 text-center shadow-sm">
        <div className="brand-kicker mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Admin
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-background md:text-3xl">
          管理ダッシュボードを読み込み中です
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
          認証情報と最新データを確認しています。画面の準備ができ次第、自動で切り替わります。
        </p>
      </div>
    </main>
  );
}