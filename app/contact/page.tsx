import type { Metadata } from "next";
import { ContactForm } from "@/components/public/ContactForm";
import { JazzEyebrow } from "@/components/public/JazzUi";

export const metadata: Metadata = {
  title: "お問い合わせ | Adlib-go KICK-OFF",
  description: "Adlib-go KICK-OFF 運営へのお問い合わせフォームです。",
};

export default function ContactPage() {
  return (
    <main className="jazz-page min-h-svh">
      <section className="jazz-staff border-b border-[#f4eddf]/15 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <JazzEyebrow>CONTACT</JazzEyebrow>
          <h1 className="mt-6 max-w-4xl font-serif text-[clamp(3.7rem,13vw,8rem)] leading-[0.86] tracking-[-0.06em]">
            Let&apos;s
            <br />
            <span className="text-jazz-brass italic">talk.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-sm leading-8 text-[#f4eddf]/60">
            Adlib Goについてのご質問やご連絡をお送りください。
            内容を確認のうえ、運営からメールで返信します。
          </p>
        </div>
      </section>

      <section className="jazz-paper-grid bg-[#e9e0cf] px-4 py-16 text-jazz-green sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.45fr_1fr]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-jazz-green/55">
              MESSAGE FORM
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight">
              音楽のこと、
              <br />
              参加のこと。
            </h2>
            <p className="mt-4 text-sm leading-7 text-jazz-green/60">
              すべての項目を入力してください。送信内容は運営への連絡にのみ使用します。
            </p>
          </div>
          <div className="border border-jazz-green/25 bg-[#f4eddf]/60 p-5 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
