import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { HeroSection } from "./HeroSection";
import HeroSectionTop from "./HeroSectionTop";
// import 'animate.css'
import Container from './Container';

export async function PublicHomePage() {
  const now = new Date();
  const upcomingEvent = await prisma.sessionEvent.findFirst({
    where: {
      eventDate: {
        gte: new Date(),
      },
    },
    orderBy: [{ eventDate: 'asc' }],
  });
  const columns = await prisma.column.findMany({
    where: {
      isPublished: true,
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 3,
    select: {
      slug: true,
      title: true,
      summary: true,
      thumbnailLabel: true,
      displayOrder: true,
      publishedAt: true,
    },
  });

  return (
    <main className="space-y-40 min-h-svh">
      <HeroSectionTop />
      <div id="main-content" className="relative py-20 bg-tertiary/20">
        <Container>
          <div className="flex flex-col gap-8">
          <section className="p-4 bg-background rounded-lg">
            <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-8 md:py-10">
              <div className="space-y-5">
                <div className="my-8 text-4xl text-red-600 font-bold">ただいま作成中です</div>
                <Badge variant="outline" className="brand-kicker">
                  Adlib-go Session
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">公開ページ、メンバーサイト、管理サイトを分けたポータル</h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    セッション告知、参加登録、sessionSet 公開、レイティング、アーカイブ管理までを一貫して扱うためのポータルです。
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/signin">メンバーサインイン</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/signup">メンバーサインアップ</Link>
                  </Button>
                  {/* <Button asChild variant="outline">
                <Link href="/admin/signin">管理者サインイン</Link>
              </Button> */}
                </div>
              </div>
              <Card className="">
                <CardHeader>
                  <CardTitle>クイックリンク</CardTitle>
                  <CardDescription>公開コンテンツと導線をここから確認できます。</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href="/columns">コラム一覧</Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href="/about">adlib-go について</Link>
                  </Button>
                  <Separator />
                  <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                    次回開催や新着コラムはこのページの下部にまとまっています。
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className='p-4 bg-background rounded-lg'>
            <Card className="">
              <CardHeader>
                <CardTitle>セッション告知</CardTitle>
                <CardDescription>次回開催中のイベントを表示します。</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvent ? (
                  <div className="space-y-3">
                    <Badge variant="secondary">{new Date(upcomingEvent.eventDate).toLocaleDateString('ja-JP')} / {upcomingEvent.venue}</Badge>
                    <div>
                      <h3 className="text-xl font-semibold">{upcomingEvent.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {upcomingEvent.description || '次回セッションの募集情報はメンバー画面から確認できます。'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">現在、公開中の開催告知はありません。</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="p-4 bg-background rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">コラム</h2>
                <p className="text-sm text-muted-foreground">直近の公開コンテンツを表示しています。</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/columns">一覧を見る</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {columns.map((column) => (
                // <Card key={column.slug} className="border shadow-sm transition-transform hover:-translate-y-0.5">
                <Card key={column.slug} className="">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit">{column.thumbnailLabel || 'Column'}</Badge>
                    <CardTitle>{column.title}</CardTitle>
                    <CardDescription>
                      {column.publishedAt ? new Date(column.publishedAt).toLocaleDateString('ja-JP') : '-'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-7 text-muted-foreground">{column.summary}</p>
                    <Button asChild variant="ghost" className="px-0">
                      <Link href={`/columns/${column.slug}`}>続きを読む</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          </div>
        </Container>
      </div>
    </main>
  );
}