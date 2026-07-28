import {
  JazzEyebrow,
  JazzLinkButton,
  JazzSectionTitle,
} from "@/components/public/JazzUi";

const principles = [
  {
    number: "01",
    title: "集まる",
    body: "公開ページで次回開催と読み物を知り、紹介を通じてコミュニティへ参加します。",
  },
  {
    number: "02",
    title: "持ち寄る",
    body: "メンバーページから参加可否、リクエスト曲、キーを登録します。",
  },
  {
    number: "03",
    title: "残す",
    body: "sessionSet、レイティング、アーカイブを残し、次の演奏へつなげます。",
  },
];

export default function AboutPage() {
  return (
    <main className="jazz-page min-h-svh">
      <section className="jazz-staff border-b border-[#f4eddf]/15 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.6fr] lg:items-end">
          <div>
            <JazzEyebrow>ABOUT ADLIB GO</JazzEyebrow>
            <h1 className="mt-6 max-w-5xl font-serif text-[clamp(3.8rem,13vw,8rem)] leading-[0.86] tracking-[-0.06em]">
              Music is
              <br />
              a <span className="text-jazz-brass italic">conversation.</span>
            </h1>
          </div>
          <p className="border-l border-jazz-brass/60 pl-5 text-sm leading-8 text-[#f4eddf]/65">
            Adlib Goは、セッション主催者の運営とメンバーの参加導線を
            ひとつにつなぐ、ジャズセッションコミュニティです。
            音を出す前の準備から、演奏後の記録までを支えます。
          </p>
        </div>
      </section>

      <section className="jazz-paper-grid bg-[#e9e0cf] px-4 py-20 text-jazz-green sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <JazzSectionTitle
            light
            eyebrow="OUR FLOW"
            title="一度きりの演奏を、次につなげる。"
          />
          <ol className="mt-12 grid border-t border-jazz-green/25 md:grid-cols-3 md:border-l">
            {principles.map((principle) => (
              <li
                key={principle.number}
                className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-jazz-green/25 py-7 md:block md:border-r md:px-6 md:py-8"
              >
                <span className="font-serif text-3xl text-[#9c6d25]">
                  {principle.number}
                </span>
                <div>
                  <h2 className="font-serif text-2xl">{principle.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-jazz-green/65">
                    {principle.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.65fr_1fr]">
          <JazzSectionTitle
            eyebrow="COMMUNITY"
            title="上手さより、音で話すこと。"
          />
          <div className="space-y-7 border-t border-[#f4eddf]/15 pt-7 text-sm leading-8 text-[#f4eddf]/60">
            <p>
              参加者はマイページからプロフィールとエントリーを管理し、
              募集期間中はRoundごとの希望曲を登録できます。
            </p>
            <p>
              運営は開催情報、sessionSet、通知、レイティング、
              アーカイブを一貫して管理します。必要な情報を一箇所に集め、
              当日は演奏そのものに集中できる状態を目指しています。
            </p>
            <div className="flex flex-col gap-3 pt-3 min-[420px]:flex-row">
              <JazzLinkButton href="/columns">コラムを読む</JazzLinkButton>
              <JazzLinkButton href="/contact" variant="outline">
                お問い合わせ
              </JazzLinkButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
