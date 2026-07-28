"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type AppHeaderNavProps = {
  isSignedIn: boolean;
  isMember: boolean;
  isAdmin: boolean;
  children?: React.ReactNode;
};

const publicLinks = [
  { href: "/", label: "トップ" },
  { href: "/columns", label: "コラム" },
  { href: "/about", label: "Adlib Goについて" },
  { href: "/contact", label: "お問い合わせ" },
];

export function AppHeaderNav({
  isSignedIn,
  isMember,
  isAdmin,
  children,
}: AppHeaderNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav
      aria-label="メインナビゲーション"
      data-state={isMenuOpen ? "open" : "closed"}
      className="group mx-auto max-w-7xl px-4 sm:px-6"
    >
      <div className="flex min-h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Adlib Go トップへ"
          className="relative z-50 shrink-0"
          onClick={closeMenu}
        >
          <Image
            src="/images/ag-logo.svg"
            alt="Adlib Go"
            width={200}
            height={80}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <button
          type="button"
          aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-controls="main-navigation-links"
          aria-expanded={isMenuOpen}
          className="relative z-50 grid size-11 place-items-center lg:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span className="sr-only">メニュー</span>
          <span className="grid gap-1.5">
            <span className="h-px w-5 bg-[#f4eddf] transition-transform group-data-[state=open]:translate-y-[3.5px] group-data-[state=open]:rotate-45" />
            <span className="h-px w-5 bg-[#f4eddf] transition-transform group-data-[state=open]:-translate-y-[3.5px] group-data-[state=open]:-rotate-45" />
          </span>
        </button>

        <div
          id="main-navigation-links"
          className="invisible fixed inset-x-0 top-16 z-40 flex max-h-[calc(100svh-4rem)] translate-y-2 flex-col gap-6 overflow-y-auto border-b border-[#f4eddf]/15 bg-[#0c0f0e] px-4 py-7 opacity-0 transition-all group-data-[state=open]:visible group-data-[state=open]:translate-y-0 group-data-[state=open]:opacity-100 sm:px-6 lg:visible lg:static lg:max-h-none lg:translate-y-0 lg:flex-row lg:items-center lg:gap-5 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:opacity-100"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-xs font-bold tracking-[0.1em] text-[#f4eddf]/65 transition-colors hover:text-jazz-brass"
              >
                {link.label}
              </Link>
            ))}
            {!isSignedIn ? (
              <Link
                href="/signin"
                onClick={closeMenu}
                className="text-xs font-bold tracking-[0.1em] text-[#f4eddf]/65 transition-colors hover:text-jazz-brass"
              >
                会員ログイン
              </Link>
            ) : null}
            {!isSignedIn ? (
              <Link
                href="/signup"
                onClick={closeMenu}
                className="inline-flex min-h-10 items-center justify-center border border-jazz-brass bg-jazz-brass px-4 text-xs font-bold tracking-[0.1em] text-[#0c0f0e] transition-colors hover:bg-jazz-brass-hover"
              >
                会員登録
              </Link>
            ) : null}
            {isMember ? (
              <Link
                href="/member"
                onClick={closeMenu}
                className="text-xs font-bold tracking-[0.1em] text-jazz-brass"
              >
                マイページ
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="text-xs font-bold tracking-[0.1em] text-jazz-brass"
              >
                管理画面
              </Link>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </nav>
  );
}
