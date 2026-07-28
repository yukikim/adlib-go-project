import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Top" },
  { href: "/columns", label: "Stories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-[#f4eddf]/15 bg-[#0c0f0e] px-4 py-10 text-[#f4eddf] sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Image
            src="/images/ag-logo.svg"
            alt="Adlib Go"
            width={200}
            height={80}
            className="h-7 w-auto"
          />
          <p className="mt-4 max-w-sm text-xs leading-6 text-[#f4eddf]/55">
            音が重なる前の期待まで、心地よく設計する。
          </p>
          <nav aria-label="フッターナビゲーション" className="mt-6">
            <ul className="flex flex-wrap gap-x-5 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[10px] font-bold tracking-[0.14em] text-[#f4eddf]/50 transition-colors hover:text-jazz-brass"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="text-[10px] tracking-[0.16em] text-[#f4eddf]/40">
          ADLIB GO © 2026
        </p>
      </div>
    </footer>
  );
}
