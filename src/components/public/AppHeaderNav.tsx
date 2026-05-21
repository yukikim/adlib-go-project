'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type AppHeaderNavProps = {
  isSignedIn: boolean;
  isMember: boolean;
  isAdmin: boolean;
};

export function AppHeaderNav({ isSignedIn, isMember, isAdmin }: AppHeaderNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((current) => !current);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav
      id="nav"
      data-state={isMenuOpen ? 'active' : undefined}
      className="absolute group z-10 w-full"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 md:gap-0 md:py-3">
          <div className="relative z-20 flex w-full justify-between md:px-0 lg:w-fit">
            <Link href="/" aria-label="logo" className="flex items-center space-x-2" onClick={closeMenu}>
              <Image src="/images/main_logo.svg" alt="Hero Image" width={140} height={60} loading="eager" />
            </Link>

            <div className="relative flex max-h-10 items-center lg:hidden">
              <button
                type="button"
                aria-label="hamburger"
                aria-controls="navlinks"
                aria-expanded={isMenuOpen}
                id="hamburger"
                className="relative -mr-6 p-6 active:scale-95 duration-300"
                onClick={toggleMenu}
              >
                <div
                  aria-hidden="true"
                  id="line"
                  className="m-auto h-0.5 w-5 rounded bg-gray-950 transition duration-300 origin-top group-data-[state=active]:rotate-45 group-data-[state=active]:translate-y-1.5"
                ></div>
                <div
                  aria-hidden="true"
                  id="line2"
                  className="m-auto mt-2 h-0.5 w-5 rounded bg-gray-950 transition duration-300 origin-bottom group-data-[state=active]:-rotate-45 group-data-[state=active]:-translate-y-1"
                ></div>
              </button>
            </div>
          </div>
          <div
            id="navLayer"
            aria-hidden="true"
            className="fixed inset-0 z-10 h-screen w-screen origin-bottom scale-y-0 bg-white/70 backdrop-blur-2xl transition duration-500 group-data-[state=active]:origin-top group-data-[state=active]:scale-y-100 dark:bg-gray-950/70 lg:hidden"
          ></div>
          <div
            id="navlinks"
            className="invisible absolute top-full left-0 z-20 w-full origin-top-right translate-y-1 scale-90 flex-col flex-wrap justify-end gap-6 rounded-3xl border border-gray-100 bg-white p-8 opacity-0 shadow-2xl shadow-gray-600/10 transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none lg:visible lg:relative lg:flex lg:w-fit lg:translate-y-0 lg:scale-100 lg:flex-row lg:items-center lg:gap-0 lg:border-none lg:bg-transparent lg:p-0 lg:opacity-100 lg:shadow-none lg:dark:bg-transparent group-data-[state=active]:visible group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 lg:group-data-[state=active]:translate-y-0"
          >
            <div className="w-full text-on-background font-semibold lg:w-auto lg:pr-4 lg:pt-0">
              <div id="links-group" className="flex flex-col gap-6 tracking-wide lg:flex-row lg:gap-6 lg:text-sm">
                <Link href="/" onClick={closeMenu}>
                  トップ
                </Link>
                <Link href="/columns" onClick={closeMenu}>
                  コラム
                </Link>
                {!isSignedIn ? (
                  <Link href="/signin" onClick={closeMenu}>
                    メンバーサインイン
                  </Link>
                ) : null}
                {!isSignedIn ? (
                  <Link href="/signup" onClick={closeMenu}>
                    メンバーサインアップ
                  </Link>
                ) : null}
                {isMember ? (
                  <Link href="/member" onClick={closeMenu}>
                    メンバー
                  </Link>
                ) : null}
                {isAdmin ? (
                  <Link href="/admin" onClick={closeMenu}>
                    管理
                  </Link>
                ) : null}
                <Link href="/about" onClick={closeMenu}>
                  adlib-go について
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}