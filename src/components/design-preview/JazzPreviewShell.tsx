import Link from "next/link";
import type { ReactNode } from "react";

type PreviewPage = "top" | "public" | "member";

type JazzPreviewShellProps = {
  current: PreviewPage;
  children: ReactNode;
};

const previewNavigation: Array<{
  id: PreviewPage;
  href: string;
  label: string;
}> = [
  { id: "top", href: "/design-preview", label: "トップ" },
  { id: "public", href: "/design-preview/public", label: "公開ページ" },
  { id: "member", href: "/design-preview/member", label: "メンバー" },
];

/**
 * 3つのデザイン案で共通利用する外枠です。
 * 本実装時は AppHeader / AppFooter の置き換え候補として分離できるよう、
 * ページ固有のコンテンツを children で受け取ります。
 */
export function JazzPreviewShell({
  current,
  children,
}: JazzPreviewShellProps) {
  return (
    <div className="jazz-preview min-h-svh overflow-x-hidden bg-[#0c0f0e] text-[#f4eddf]">
      <header className="sticky top-0 z-50 border-b border-[#f4eddf]/15 bg-[#0c0f0e]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/design-preview"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Adlib Go デザインプレビューのトップへ"
          >
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-[#d7a94f]/70 text-[10px] font-bold tracking-[0.08em] text-[#d7a94f] transition-colors group-hover:bg-[#d7a94f] group-hover:text-[#0c0f0e]"
            >
              AG
            </span>
            <span className="truncate font-serif text-lg leading-none tracking-[0.04em]">
              Adlib Go
            </span>
          </Link>

          <span className="rounded-full border border-[#f4eddf]/15 px-2.5 py-1 text-[9px] font-bold tracking-[0.2em] text-[#f4eddf]/55">
            CONCEPT 01
          </span>
        </div>

        <nav
          aria-label="デザイン案のページ切り替え"
          className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6"
        >
          {previewNavigation.map((item) => {
            const isCurrent = current === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={[
                  "relative shrink-0 px-4 py-3 text-xs font-bold tracking-[0.12em] transition-colors first:pl-0",
                  isCurrent
                    ? "text-[#d7a94f]"
                    : "text-[#f4eddf]/55 hover:text-[#f4eddf]",
                ].join(" ")}
              >
                {item.label}
                {isCurrent ? (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 bg-[#d7a94f] first:left-0" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>

      {children}

      <footer className="border-t border-[#f4eddf]/15 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-2xl">Adlib Go</p>
            <p className="mt-2 max-w-sm text-xs leading-6 text-[#f4eddf]/55">
              音が重なる前の期待まで、心地よく設計する。
            </p>
          </div>
          <p className="text-[10px] tracking-[0.16em] text-[#f4eddf]/40">
            MOBILE-FIRST DESIGN STUDY · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PreviewEyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className={[
        "flex items-center gap-2 text-[10px] font-bold tracking-[0.24em]",
        light ? "text-[#153027]/60" : "text-[#d7a94f]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={light ? "h-px w-5 bg-[#153027]/35" : "h-px w-5 bg-[#d7a94f]"}
      />
      {children}
    </p>
  );
}

export function PreviewSectionTitle({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div>
      <PreviewEyebrow light={light}>{eyebrow}</PreviewEyebrow>
      <h2
        className={[
          "mt-4 max-w-3xl font-serif text-3xl leading-[1.15] tracking-[-0.025em] sm:text-4xl lg:text-5xl",
          light ? "text-[#153027]" : "text-[#f4eddf]",
        ].join(" ")}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={[
            "mt-4 max-w-2xl text-sm leading-7",
            light ? "text-[#153027]/65" : "text-[#f4eddf]/60",
          ].join(" ")}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function PreviewButton({
  href,
  children,
  variant = "brass",
}: {
  href: string;
  children: ReactNode;
  variant?: "brass" | "outline" | "ink";
}) {
  const variantClass = {
    brass:
      "border-[#d7a94f] bg-[#d7a94f] text-[#0c0f0e] hover:border-[#ecc671] hover:bg-[#ecc671]",
    outline:
      "border-[#f4eddf]/30 text-[#f4eddf] hover:border-[#f4eddf]/70 hover:bg-[#f4eddf]/5",
    ink: "border-[#153027] bg-[#153027] text-[#f4eddf] hover:bg-[#23463a]",
  }[variant];

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center border px-5 text-xs font-bold tracking-[0.12em] transition-colors ${variantClass}`}
    >
      {children}
      <span aria-hidden="true" className="ml-3">
        →
      </span>
    </Link>
  );
}

export function PreviewStatus({
  children,
  tone = "brass",
}: {
  children: ReactNode;
  tone?: "brass" | "green" | "red";
}) {
  const toneClass = {
    brass: "border-[#d7a94f]/45 bg-[#d7a94f]/10 text-[#d7a94f]",
    green: "border-[#8db7a5]/45 bg-[#8db7a5]/10 text-[#b9d9ca]",
    red: "border-[#d66958]/45 bg-[#d66958]/10 text-[#ef9b8e]",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] ${toneClass}`}
    >
      {children}
    </span>
  );
}
