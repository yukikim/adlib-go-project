import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ColumnsPage() {
  const now = new Date();
  const columns = await prisma.column.findMany({
    where: {
      isPublished: true,
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      authorName: true,
      displayOrder: true,
      publishedAt: true,
    },
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-8">
      <section className="glass_section">
        <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.25fr_0.85fr] md:px-8 md:py-10">
          <div className="space-y-4">
            <Badge variant="outline" className="brand-kicker">
              Columns
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">コラム一覧</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                運営からの案内やセッション参加のヒントを掲載します。イベント前後の読み物としても使えるアーカイブです。
              </p>
            </div>
          </div>
          <Card className="border-white/70 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>読み進め方</CardTitle>
              <CardDescription>運営の方針や参加のコツを段階的に把握できます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>まず概要を読み、参加導線を把握</p>
              <p>気になるイベントや募集ルールを確認</p>
              <p>サインアップ後にメンバーページでエントリー</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4">
        {columns.map((column) => (
          <Card key={column.slug} className="border shadow-sm transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{column.publishedAt ? new Date(column.publishedAt).toLocaleDateString('ja-JP') : '-'}</Badge>
                <Badge variant="secondary">{column.authorName}</Badge>
              </div>
              <CardTitle>{column.title}</CardTitle>
              <CardDescription>表示順 {column.displayOrder}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">{column.summary}</p>
              <Button asChild variant="outline">
                <Link href={`/columns/${column.slug}`}>詳細を見る</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}