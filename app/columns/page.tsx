import Link from "next/link";
import {
  JazzEyebrow,
  JazzLinkButton,
  JazzSectionTitle,
} from "@/components/public/JazzUi";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatPublishedDate(value: Date | null) {
  return value ? new Date(value).toLocaleDateString("ja-JP") : "公開中";
}

export default async function ColumnsPage() {
  const now = new Date();
  const columns = await prisma.column.findMany({
    where: {
      isPublished: true,
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    orderBy: [
      { displayOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      authorName: true,
      publishedAt: true,
    },
  });
  const featuredColumn = columns[0] ?? null;
  const latestColumns = columns.slice(featuredColumn ? 1 : 0);

  return (
    <main className="jazz-page min-h-svh">
      <section className="jazz-staff border-b border-[#f4eddf]/15 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <JazzEyebrow>PUBLIC STORIES</JazzEyebrow>
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

      {featuredColumn ? (
        <section className="bg-[#e9e0cf] px-4 py-20 text-jazz-green sm:px-6 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <JazzSectionTitle
              light
              eyebrow="FEATURED STORY"
              title={featuredColumn.title}
            />
            <article className="mt-10 grid overflow-hidden border border-jazz-green/25 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="jazz-paper-grid relative min-h-80 bg-jazz-green p-7 text-[#e9e0cf] sm:p-10">
                <span className="text-[10px] font-bold tracking-[0.2em] text-jazz-brass">
                  SESSION JOURNAL
                </span>
                <p
                  aria-hidden="true"
                  className="absolute bottom-2 right-5 font-serif text-[11rem] leading-none text-[#e9e0cf]/8 sm:text-[15rem]"
                >
                  01
                </p>
                <p className="absolute bottom-8 left-7 right-7 max-w-md font-serif text-3xl leading-tight sm:bottom-10 sm:left-10 sm:right-10 sm:text-4xl">
                  音を出す前と、
                  <br />
                  音が残ったあとに。
                </p>
              </div>
              <div className="flex flex-col justify-between p-7 sm:p-10">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-jazz-green/25 px-3 py-1 text-[10px] font-bold tracking-[0.12em]">
                      {featuredColumn.authorName}
                    </span>
                    <span className="rounded-full border border-jazz-green/25 px-3 py-1 text-[10px] font-bold tracking-[0.12em]">
                      {formatPublishedDate(featuredColumn.publishedAt)}
                    </span>
                  </div>
                  <p className="mt-8 max-w-2xl text-sm leading-8 text-jazz-green/70 sm:text-base">
                    {featuredColumn.summary}
                  </p>
                </div>
                <div className="mt-10 border-t border-jazz-green/20 pt-6">
                  <JazzLinkButton
                    href={`/columns/${featuredColumn.slug}`}
                    variant="ink"
                  >
                    続きを読む
                  </JazzLinkButton>
                </div>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <JazzSectionTitle
            eyebrow="LATEST STORIES"
            title="最近の読み物"
            description="セッション参加のヒント、運営からのお知らせ、音楽を楽しむためのノートです。"
          />

          {latestColumns.length > 0 ? (
            <div className="mt-12 divide-y divide-[#f4eddf]/15 border-y border-[#f4eddf]/15">
              {latestColumns.map((column, index) => (
                <article
                  key={column.id}
                  className="group grid gap-5 py-7 md:grid-cols-[5rem_10rem_1fr_auto] md:items-center md:gap-8"
                >
                  <p className="font-serif text-4xl text-jazz-brass/50">
                    {String(index + 2).padStart(2, "0")}
                  </p>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-jazz-brass">
                      {column.authorName}
                    </p>
                    <p className="mt-2 text-[10px] tracking-[0.1em] text-[#f4eddf]/40">
                      {formatPublishedDate(column.publishedAt)}
                    </p>
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl leading-snug transition-colors group-hover:text-jazz-brass">
                      {column.title}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-[#f4eddf]/55">
                      {column.summary}
                    </p>
                  </div>
                  <Link
                    href={`/columns/${column.slug}`}
                    aria-label={`${column.title}を読む`}
                    className="grid size-12 place-items-center rounded-full border border-[#f4eddf]/25 transition-colors group-hover:border-jazz-brass group-hover:text-jazz-brass"
                  >
                    →
                  </Link>
                </article>
              ))}
            </div>
          ) : featuredColumn ? null : (
            <p className="mt-12 border-y border-[#f4eddf]/15 py-8 text-sm text-[#f4eddf]/55">
              現在、公開中のコラムはありません。
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
