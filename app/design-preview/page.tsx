import {
  JazzPreviewShell,
  PreviewButton,
  PreviewEyebrow,
  PreviewSectionTitle,
  PreviewStatus,
} from "@/components/design-preview/JazzPreviewShell";
import Image from "next/image";

const sessionSteps = [
  {
    number: "01",
    title: "予定を見る",
    body: "日程、会場、空き状況をひとつのカードで確認。",
  },
  {
    number: "02",
    title: "曲を持ち寄る",
    body: "好きなスタンダードとキーを選んでエントリー。",
  },
  {
    number: "03",
    title: "音を重ねる",
    body: "当日のセットを確認して、あとは会場へ。",
  },
];

const columnCards = [
  {
    issue: "ISSUE 12",
    title: "初めてのジャムセッションで、最初に聴くこと。",
    category: "SESSION NOTES",
  },
  {
    issue: "ISSUE 11",
    title: "Autumn Leavesから始める、会話のような演奏。",
    category: "STANDARD",
  },
  {
    issue: "ISSUE 10",
    title: "いいセッションをつくる、ホストの小さな工夫。",
    category: "BACKSTAGE",
  },
];

export default function JazzTopPreviewPage() {
  return (
    <JazzPreviewShell current="top">
      <main>
        <section className="relative isolate overflow-hidden border-b border-[#f4eddf]/15">
          <div
            aria-hidden="true"
            className="jazz-grooves absolute -right-36 top-12 -z-10 aspect-square w-[34rem] rounded-full opacity-80 sm:-right-24 lg:right-[4vw] lg:top-20 lg:w-[44rem]"
          />
              <div className="px-2.5 pt-8 flex justify-center lg:justify-end lg:pr-8">
                <Image
                  src="/images/ag-logo-g2.svg"
                  alt="Adlib Go"
                  width={200}
                  height={80}
                  className="h-14 w-auto lg:h-30"
                />
              </div>
          <div className="mx-auto grid min-h-[82svh] max-w-7xl content-center gap-12 px-4 pt-4 pb-12 sm:px-6 lg:grid-cols-[1.05fr_0.75fr] lg:items-end lg:gap-16 lg:py-24">
            <div>

              <PreviewEyebrow>JAZZ SESSION · TOKYO</PreviewEyebrow>
              <h1 className="mt-6 max-w-4xl font-serif text-[clamp(4.5rem,20vw,10rem)] leading-[0.76] tracking-[-0.075em]">
                Find
                <br />
                your
                <br />
                <span className="ml-[0.35em] text-jazz-brass italic">
                  groove.
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-sm leading-7 text-[#f4eddf]/65 sm:text-base">
                上手さより、音で話すこと。
                <br />
                Adlib Goは、ジャズを愛する人が集まり、
                その日だけの音楽をつくるセッションコミュニティです。
              </p>
              <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
                <PreviewButton href="#next-session">
                  次回セッションを見る
                </PreviewButton>
                <PreviewButton href="/design-preview/public" variant="outline">
                  コラムを読む
                </PreviewButton>
              </div>
            </div>

            <article
              id="next-session"
              className="relative border border-[#f4eddf]/20 bg-[#121715]/90 p-5 sm:p-7"
            >
              <div className="absolute -left-px -top-px h-1 w-24 bg-jazz-brass" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <PreviewStatus tone="red">NOW BOOKING</PreviewStatus>
                  <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-[#f4eddf]/45">
                    NEXT SESSION
                  </p>
                </div>
                <p className="text-right font-serif text-5xl leading-none text-jazz-brass">
                  23
                  <span className="block text-xs tracking-[0.18em]">AUG.</span>
                </p>
              </div>
              <h2 className="mt-8 font-serif text-3xl leading-tight">
                Late Summer
                <br />
                Standard Session
              </h2>
              <dl className="mt-8 grid grid-cols-[5rem_1fr] gap-y-3 border-t border-[#f4eddf]/15 pt-5 text-xs">
                <dt className="tracking-[0.15em] text-[#f4eddf]/40">TIME</dt>
                <dd>14:00–18:00</dd>
                <dt className="tracking-[0.15em] text-[#f4eddf]/40">VENUE</dt>
                <dd>Studio Groove, Kichijoji</dd>
                <dt className="tracking-[0.15em] text-[#f4eddf]/40">SEATS</dt>
                <dd>12 / 18 members</dd>
              </dl>
              <a
                href="#session-flow"
                className="mt-7 flex min-h-12 items-center justify-between border-t border-[#f4eddf]/15 pt-5 text-xs font-bold tracking-[0.12em] text-jazz-brass"
              >
                参加までの流れ
                <span aria-hidden="true">↓</span>
              </a>
            </article>
          </div>
        </section>

        <section
          id="session-flow"
          className="jazz-paper-grid bg-[#e9e0cf] px-4 py-20 text-jazz-green sm:px-6 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <PreviewSectionTitle
              light
              eyebrow="HOW IT WORKS"
              title="難しいことは、音を出してから。"
              description="モバイルでは、検討から参加登録までを縦方向の3ステップに絞ります。"
            />
            <ol className="mt-12 grid border-t border-jazz-green/25 md:grid-cols-3 md:border-l">
              {sessionSteps.map((step) => (
                <li
                  key={step.number}
                  className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-jazz-green/25 py-7 md:block md:border-r md:px-6 md:py-8"
                >
                  <span className="font-serif text-3xl text-[#9c6d25]">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-jazz-green/65">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <PreviewSectionTitle
                eyebrow="SESSION JOURNAL"
                title="音楽の余韻を、言葉に。"
              />
              <a
                href="/design-preview/public"
                className="text-xs font-bold tracking-[0.12em] text-jazz-brass"
              >
                すべてのコラム →
              </a>
            </div>

            <div className="mt-12 grid gap-px bg-[#f4eddf]/15 md:grid-cols-3">
              {columnCards.map((column, index) => (
                <article
                  key={column.issue}
                  className="group min-h-72 bg-[#0c0f0e] p-6 transition-colors hover:bg-[#131a17]"
                >
                  <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-[#f4eddf]/40">
                    <span>{column.issue}</span>
                    <span>{column.category}</span>
                  </div>
                  <p className="mt-10 font-serif text-6xl text-jazz-brass/25">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-6 max-w-sm font-serif text-2xl leading-snug transition-colors group-hover:text-jazz-brass">
                    {column.title}
                  </h3>
                  <p className="mt-6 text-xs font-bold tracking-[0.12em] text-[#f4eddf]/55">
                    READ STORY →
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#f4eddf]/15 bg-jazz-brass px-4 py-16 text-[#0c0f0e] sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em]">
                MEMBERS ONLY
              </p>
              <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
                次のセッションは、
                <br />
                マイページから始まる。
              </h2>
            </div>
            <PreviewButton href="/design-preview/member" variant="ink">
              メンバー画面を見る
            </PreviewButton>
          </div>
        </section>
      </main>
    </JazzPreviewShell>
  );
}
