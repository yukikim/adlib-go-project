import Link from "next/link";
import { notFound } from "next/navigation";
import { JazzEyebrow, JazzLinkButton } from "@/components/public/JazzUi";
import { prisma } from "@/lib/prisma";
import { splitColumnBody } from "@/lib/columns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ColumnDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
  const publishedDate = column.publishedAt
    ? new Date(column.publishedAt).toLocaleDateString("ja-JP")
    : "公開中";

  return (
    <main className="jazz-page min-h-svh">
      <header className="jazz-staff border-b border-[#f4eddf]/15 px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <JazzEyebrow>SESSION JOURNAL</JazzEyebrow>
          <div className="mt-6 flex flex-wrap gap-3 text-[10px] font-bold tracking-[0.14em] text-[#f4eddf]/45">
            <span>{column.authorName}</span>
            <span aria-hidden="true">·</span>
            <time>{publishedDate}</time>
          </div>
          <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.15] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            {column.title}
          </h1>
          <div className="mt-10 flex flex-wrap gap-3">
            <JazzLinkButton href="/columns" variant="outline">
              コラム一覧へ
            </JazzLinkButton>
            <JazzLinkButton href="/signin">会員ログイン</JazzLinkButton>
          </div>
        </div>
      </header>

      <article className="jazz-paper-grid bg-[#e9e0cf] px-4 py-16 text-jazz-green sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="font-serif text-xl leading-9 text-jazz-green/70 sm:text-2xl sm:leading-10">
            演奏の前後に読み返せる、Adlib Goからのセッションノートです。
          </p>
          <div className="mt-12 border-t border-jazz-green/20">
            {paragraphs.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 24)}`}
                className="border-b border-jazz-green/15 py-7 text-sm leading-9 text-jazz-green/85 sm:text-base"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-4 border-l-2 border-[#9c6d25] pl-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-7 text-jazz-green/65">
              次のセッション情報と参加登録は、メンバーマイページで確認できます。
            </p>
            <Link
              href="/signin"
              className="shrink-0 text-xs font-bold tracking-[0.12em] text-jazz-green"
            >
              マイページへ →
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
