import {
  JazzPreviewShell,
  PreviewButton,
  PreviewEyebrow,
  PreviewSectionTitle,
  PreviewStatus,
} from "@/components/design-preview/JazzPreviewShell";

const stories = [
  {
    number: "11",
    category: "STANDARD",
    title: "Autumn Leavesから始める、会話のような演奏。",
    summary:
      "同じ進行の中で、何を聴き、どこに余白を残すのか。定番曲を通して考えます。",
    date: "2026.07.18",
  },
  {
    number: "10",
    category: "BACKSTAGE",
    title: "いいセッションをつくる、ホストの小さな工夫。",
    summary:
      "演奏順、声のかけ方、初参加者への目配り。場をつくる側のノートです。",
    date: "2026.07.02",
  },
  {
    number: "09",
    category: "INTERVIEW",
    title: "ベースが教えてくれた、待つことの強さ。",
    summary:
      "音数ではなく、バンド全体の呼吸を支えること。メンバーへの短いインタビュー。",
    date: "2026.06.14",
  },
];

const programNotes = [
  {
    time: "13:30",
    title: "Doors open",
    detail: "受付・音出し",
  },
  {
    time: "14:00",
    title: "First set",
    detail: "スタンダード中心",
  },
  {
    time: "16:00",
    title: "Second set",
    detail: "持ち寄り曲・ボーカル",
  },
  {
    time: "18:00",
    title: "Close",
    detail: "近隣でアフターセッション",
  },
];

export default function JazzPublicPreviewPage() {
  return (
    <JazzPreviewShell current="public">
      <main>
        <section className="jazz-staff border-b border-[#f4eddf]/15 px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <PreviewEyebrow>PUBLIC STORIES</PreviewEyebrow>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.45fr] lg:items-end">
              <h1 className="max-w-5xl font-serif text-[clamp(3.8rem,14vw,9rem)] leading-[0.84] tracking-[-0.065em]">
                Listen.
                <br />
                Read.
                <br />
                <span className="text-jazz-brass italic">Play.</span>
              </h1>
              <p className="border-l border-jazz-brass/60 pl-5 text-sm leading-7 text-[#f4eddf]/65">
                演奏の前に知ること。
                <br />
                演奏のあとに残ること。
                <br />
                Adlib Goの活動と、ジャズを楽しむための読み物を届けます。
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#e9e0cf] px-4 py-20 text-jazz-green sm:px-6 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <PreviewSectionTitle
              light
              eyebrow="FEATURED · ISSUE 12"
              title="初めてのジャムセッションで、最初に聴くこと。"
            />
            <article className="mt-10 grid overflow-hidden border border-jazz-green/25 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="jazz-paper-grid relative min-h-80 bg-jazz-green p-7 text-[#e9e0cf] sm:p-10">
                <span className="text-[10px] font-bold tracking-[0.2em] text-jazz-brass">
                  BEGINNER&apos;S NOTE
                </span>
                <p
                  aria-hidden="true"
                  className="absolute bottom-2 right-5 font-serif text-[11rem] leading-none text-[#e9e0cf]/8 sm:text-[15rem]"
                >
                  12
                </p>
                <div className="absolute bottom-8 left-7 right-7 sm:bottom-10 sm:left-10 sm:right-10">
                  <p className="max-w-md font-serif text-3xl leading-tight sm:text-4xl">
                    音を出す前に、
                    <br />
                    バンドの呼吸を聴く。
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between p-7 sm:p-10">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-jazz-green/25 px-3 py-1 text-[10px] font-bold tracking-[0.12em]">
                      SESSION NOTES
                    </span>
                    <span className="rounded-full border border-jazz-green/25 px-3 py-1 text-[10px] font-bold tracking-[0.12em]">
                      6 MIN READ
                    </span>
                  </div>
                  <p className="mt-8 max-w-2xl text-sm leading-8 text-jazz-green/70 sm:text-base">
                    曲を知っていることと、セッションを楽しめることは少し違います。
                    カウントの前、テーマの最中、ソロが終わる瞬間。
                    まず聴きたい5つのポイントを、初参加者向けにまとめました。
                  </p>
                </div>
                <div className="mt-10 flex flex-col gap-4 border-t border-jazz-green/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-jazz-green/50">
                    2026.07.26 · BY ADLIB GO
                  </p>
                  <PreviewButton href="#" variant="ink">
                    続きを読む
                  </PreviewButton>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <PreviewSectionTitle
              eyebrow="LATEST STORIES"
              title="最近の読み物"
              description="一覧はカードを並べすぎず、タイトルと要約を主役にした編集的なレイアウトです。"
            />
            <div className="mt-12 divide-y divide-[#f4eddf]/15 border-y border-[#f4eddf]/15">
              {stories.map((story) => (
                <article
                  key={story.number}
                  className="group grid gap-5 py-7 md:grid-cols-[5rem_10rem_1fr_auto] md:items-center md:gap-8"
                >
                  <p className="font-serif text-4xl text-jazz-brass/50">
                    {story.number}
                  </p>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-jazz-brass">
                      {story.category}
                    </p>
                    <p className="mt-2 text-[10px] tracking-[0.1em] text-[#f4eddf]/40">
                      {story.date}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl leading-snug transition-colors group-hover:text-jazz-brass">
                      {story.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-[#f4eddf]/55">
                      {story.summary}
                    </p>
                  </div>
                  <a
                    href="#"
                    aria-label={`${story.title}を読む`}
                    className="grid size-12 place-items-center rounded-full border border-[#f4eddf]/25 transition-colors group-hover:border-jazz-brass group-hover:text-jazz-brass"
                  >
                    →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#f4eddf]/15 bg-[#121715] px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1fr]">
            <div>
              <PreviewStatus tone="green">UPCOMING</PreviewStatus>
              <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">
                Late Summer
                <br />
                Standard Session
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#f4eddf]/60">
                2026.08.23 SUN · 吉祥寺
                <br />
                初参加の方も歓迎します。
              </p>
              <div className="mt-8">
                <PreviewButton href="/design-preview/member">
                  参加案内を見る
                </PreviewButton>
              </div>
            </div>

            <ol className="border-t border-[#f4eddf]/15">
              {programNotes.map((note) => (
                <li
                  key={note.time}
                  className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-[#f4eddf]/15 py-5"
                >
                  <time className="font-serif text-xl text-jazz-brass">
                    {note.time}
                  </time>
                  <span className="font-serif text-xl">{note.title}</span>
                  <span className="hidden text-xs text-[#f4eddf]/45 sm:block">
                    {note.detail}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </JazzPreviewShell>
  );
}
