import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/public/ContactForm';

export const metadata: Metadata = {
  title: 'お問い合わせ | Adlib-go KICK-OFF',
  description: 'Adlib-go KICK-OFF 運営へのお問い合わせフォームです。',
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-96px)] w-full max-w-4xl flex-col gap-6 px-6 py-8 mt-24 md:px-8">
      <section className="space-y-3">
        <p className="brand-kicker text-sm font-semibold">Contact</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">お問い合わせ</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          Adlib-go KICK-OFF についてのご質問やご連絡は、以下のフォームからお送りください。
        </p>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>お問い合わせフォーム</CardTitle>
          <CardDescription>
            すべての項目を入力してください。内容を確認のうえ、運営からメールで返信します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </main>
  );
}

