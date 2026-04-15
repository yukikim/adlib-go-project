import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { prisma } from '@/lib/prisma';
import { splitColumnBody } from '@/lib/columns';

export default async function ColumnDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();
  const column = await prisma.column.findFirst({
    where: {
      slug,
      isPublished: true,
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    select: {
      title: true,
      body: true,
      authorName: true,
      publishedAt: true,
    },
  });

  if (!column) {
    notFound();
  }

  const paragraphs = splitColumnBody(column.body);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-brand-main/15 bg-linear-to-br from-brand-base/45 via-background to-brand-main/10 shadow-sm">
        <div className="px-6 py-8 md:px-8 md:py-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Column Detail</Badge>
            <Badge variant="secondary">{column.authorName}</Badge>
            <Badge variant="outline">{column.publishedAt ? new Date(column.publishedAt).toLocaleDateString('ja-JP') : '-'}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{column.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            運営からの案内や参加のヒントをまとめた公開コラムです。必要に応じて一覧へ戻って他の記事も確認できます。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href="/columns">一覧へ戻る</a>
            </Button>
            <Button asChild>
              <a href="/signup">参加をはじめる</a>
            </Button>
          </div>
        </div>
      </section>

      <article>
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>{column.title}</CardTitle>
            <CardDescription>{column.authorName} / {column.publishedAt ? new Date(column.publishedAt).toLocaleDateString('ja-JP') : '-'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {paragraphs.map((paragraph, index) => (
              <div key={paragraph} className="space-y-5">
                <p className="text-sm leading-8 text-foreground/90 md:text-base">{paragraph}</p>
                {index < paragraphs.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </article>
    </main>
  );
}