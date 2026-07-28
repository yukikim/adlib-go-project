import {
  JazzPreviewShell,
  PreviewButton,
  PreviewEyebrow,
  PreviewSectionTitle,
  PreviewStatus,
} from "@/components/design-preview/JazzPreviewShell";

const setList = [
  {
    order: "01",
    title: "There Will Never Be Another You",
    meta: "Key E♭ · Alto Sax",
  },
  {
    order: "02",
    title: "Blue Bossa",
    meta: "Key C minor · Piano",
  },
  {
    order: "03",
    title: "All of Me",
    meta: "Key C · Vocal",
  },
];

const quickLinks = [
  { label: "自分の履歴", meta: "8 sessions", href: "#history" },
  { label: "アーカイブ", meta: "24 records", href: "#archive" },
  { label: "プロフィール", meta: "Piano", href: "#profile" },
  { label: "運営へ連絡", meta: "Message", href: "#message" },
];

export default function JazzMemberPreviewPage() {
  return (
    <JazzPreviewShell current="member">
      <main className="pb-20 md:pb-0">
        <section className="border-b border-[#f4eddf]/15 px-4 py-10 sm:px-6 lg:py-14">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
            <div>
              <PreviewEyebrow>MEMBER HOME</PreviewEyebrow>
              <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                ようこそ、Marcoさん。
              </h1>
              <p className="mt-3 text-sm text-[#f4eddf]/50">
                次のセッションまで 26日
              </p>
            </div>
            <div
              aria-label="メンバーのイニシャル M"
              className="grid size-14 shrink-0 place-items-center rounded-full border border-[#d7a94f]/50 bg-[#d7a94f]/10 font-serif text-2xl text-[#d7a94f] sm:size-20"
            >
              M
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-12">
          <div className="space-y-8">
            <section
              id="entry"
              className="relative overflow-hidden bg-[#d7a94f] p-6 text-[#0c0f0e] sm:p-8"
            >
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 size-52 rounded-full border-[28px] border-[#0c0f0e]/8"
              />
              <p className="text-[10px] font-bold tracking-[0.2em]">
                YOUR NEXT MOVE
              </p>
              <div className="relative mt-8 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="font-serif text-5xl leading-none">7.31</p>
                  <p className="mt-2 text-xs font-bold tracking-[0.12em]">
                    THU · 23:59 DEADLINE
                  </p>
                  <h2 className="mt-7 font-serif text-3xl leading-tight sm:text-4xl">
                    参加可否と
                    <br />
                    リクエスト曲を回答
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-[#0c0f0e]/65">
                    Late Summer Standard SessionのRound 1を受付中です。
                  </p>
                </div>
                <PreviewButton href="#entry-form" variant="ink">
                  回答を始める
                </PreviewButton>
              </div>
            </section>

            <section className="border border-[#f4eddf]/15 bg-[#121715] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <PreviewStatus tone="green">ENTRY OPEN</PreviewStatus>
                  <h2 className="mt-5 font-serif text-3xl leading-tight">
                    Late Summer
                    <br />
                    Standard Session
                  </h2>
                </div>
                <div className="text-right">
                  <p className="font-serif text-5xl leading-none text-[#d7a94f]">
                    23
                  </p>
                  <p className="mt-1 text-[10px] tracking-[0.16em] text-[#f4eddf]/45">
                    AUG. 2026
                  </p>
                </div>
              </div>

              <dl className="mt-7 grid gap-px overflow-hidden border border-[#f4eddf]/15 bg-[#f4eddf]/15 sm:grid-cols-3">
                <div className="bg-[#121715] p-4">
                  <dt className="text-[9px] tracking-[0.16em] text-[#f4eddf]/40">
                    TIME
                  </dt>
                  <dd className="mt-2 text-sm">14:00–18:00</dd>
                </div>
                <div className="bg-[#121715] p-4">
                  <dt className="text-[9px] tracking-[0.16em] text-[#f4eddf]/40">
                    VENUE
                  </dt>
                  <dd className="mt-2 text-sm">吉祥寺</dd>
                </div>
                <div className="bg-[#121715] p-4">
                  <dt className="text-[9px] tracking-[0.16em] text-[#f4eddf]/40">
                    CAPACITY
                  </dt>
                  <dd className="mt-2 text-sm">12 / 18</dd>
                </div>
              </dl>

              <details className="group mt-5 border-t border-[#f4eddf]/15 pt-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-bold tracking-[0.1em]">
                  参加状況・リクエスト曲を見る
                  <span
                    aria-hidden="true"
                    className="text-[#d7a94f] group-open:rotate-45"
                  >
                    ＋
                  </span>
                </summary>
                <div className="grid gap-4 pb-2 pt-4 text-sm leading-7 text-[#f4eddf]/60 sm:grid-cols-2">
                  <p>参加楽器: piano 3 / bass 2 / drums 2 / front 5</p>
                  <p>
                    リクエスト: Blue Bossa / All of Me / Softly, as in a
                    Morning Sunrise
                  </p>
                </div>
              </details>
            </section>

            <section className="bg-[#e9e0cf] p-5 text-[#153027] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.18em] text-[#153027]/55">
                    PUBLISHED SESSION SET
                  </p>
                  <h2 className="mt-3 font-serif text-3xl">
                    July Session Set
                  </h2>
                </div>
                <span className="rounded-full border border-[#153027]/25 px-3 py-1 text-[10px] font-bold tracking-[0.1em]">
                  公開済み
                </span>
              </div>

              <ol className="mt-7 divide-y divide-[#153027]/20 border-y border-[#153027]/20">
                {setList.map((song) => (
                  <li
                    key={song.order}
                    className="grid grid-cols-[2.5rem_1fr] gap-4 py-4"
                  >
                    <span className="font-serif text-xl text-[#9c6d25]">
                      {song.order}
                    </span>
                    <div>
                      <p className="font-serif text-lg">{song.title}</p>
                      <p className="mt-1 text-xs text-[#153027]/55">
                        {song.meta}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <a
                href="#"
                className="mt-5 inline-flex min-h-11 items-center text-xs font-bold tracking-[0.1em]"
              >
                PDFをダウンロード →
              </a>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="border border-[#f4eddf]/15 p-5 sm:p-7">
              <PreviewSectionTitle
                eyebrow="NOTICE"
                title="運営からのお知らせ"
              />
              <article className="mt-7 border-l-2 border-[#d66958] pl-4">
                <div className="flex items-center gap-3">
                  <PreviewStatus tone="red">NEW</PreviewStatus>
                  <time className="text-[10px] tracking-[0.12em] text-[#f4eddf]/40">
                    2026.07.28
                  </time>
                </div>
                <h3 className="mt-4 font-serif text-xl">
                  8月セッションの募集を開始しました
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#f4eddf]/55">
                  Round 1の回答期限は7月31日です。参加可否だけでも先に登録できます。
                </p>
              </article>
              <a
                href="#"
                className="mt-6 inline-flex text-xs font-bold tracking-[0.1em] text-[#d7a94f]"
              >
                お知らせ一覧 →
              </a>
            </section>

            <section>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#f4eddf]/45">
                QUICK ACCESS
              </p>
              <nav aria-label="メンバーページ内のショートカット" className="mt-4">
                {quickLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="group flex min-h-16 items-center justify-between border-t border-[#f4eddf]/15 text-sm transition-colors last:border-b hover:text-[#d7a94f]"
                  >
                    <span className="font-serif text-xl">{link.label}</span>
                    <span className="flex items-center gap-4 text-[10px] tracking-[0.1em] text-[#f4eddf]/40">
                      {link.meta}
                      <span
                        aria-hidden="true"
                        className="text-base text-[#d7a94f]"
                      >
                        →
                      </span>
                    </span>
                  </a>
                ))}
              </nav>
            </section>
          </aside>
        </div>

        <nav
          aria-label="モバイル用メンバーナビゲーション"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#f4eddf]/15 bg-[#0c0f0e]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          {[
            ["HOME", "#"],
            ["EVENT", "#entry"],
            ["HISTORY", "#history"],
            ["PROFILE", "#profile"],
          ].map(([label, href], index) => (
            <a
              key={label}
              href={href}
              className={[
                "grid min-h-16 place-items-center text-[9px] font-bold tracking-[0.12em]",
                index === 0 ? "text-[#d7a94f]" : "text-[#f4eddf]/45",
              ].join(" ")}
            >
              {label}
            </a>
          ))}
        </nav>
      </main>
    </JazzPreviewShell>
  );
}
