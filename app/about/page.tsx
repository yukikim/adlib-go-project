import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-8">
      <section className="glass_section">
        <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.3fr_0.8fr] md:px-8 md:py-10">
          <div className="space-y-5">
            <Badge variant="outline" className="brand-kicker">
              About Adlib-go
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">adlib-go について</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Adlib-go KICK-OFF は、セッション主催者の運営業務とメンバー向け導線を 1 つの Web アプリに統合するためのプロジェクトです。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/signup">参加をはじめる</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/columns">コラムを読む</Link>
              </Button>
            </div>
          </div>

          <Card className="border-white/70 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>このサイトでできること</CardTitle>
              <CardDescription>運営と参加者の導線を分離しつつ、必要な情報を一箇所に集約します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>公開ページで告知やコラムを確認</p>
              <p>メンバーサイトでプロフィール管理とエントリー登録</p>
              <p>管理サイトでイベント公開、評価、通知、アーカイブ管理</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>活動概要</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              公開サイト、メンバーサイト、管理サイトを分離しつつ、sessionSet 生成、イベント管理、レイティング、アーカイブ、通知を一貫して扱える構成を目指しています。
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>参加案内</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              参加希望者はサインアップ後、メンバーページからプロフィール設定とセッションエントリーを行います。募集期間中は Round ごとの希望曲入力が可能です。
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>運営ポリシー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              運営は募集状況、sessionSet 公開、レイティング、アーカイブを継続的に管理します。通知履歴と監査情報は、再現性のある運用のために保持します。
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>導線</CardTitle>
            <CardDescription>公開ページから各導線へ移動できます。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/signin">メンバーサインイン</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/admin/signin">管理者サインイン</Link>
              </Button>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">
              まずはコラムや開催案内を確認し、必要に応じてサインアップまたはサインインへ進んでください。
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}