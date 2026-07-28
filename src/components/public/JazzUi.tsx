import Link from "next/link";
import type { ReactNode } from "react";

export function JazzEyebrow({
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
        light ? "text-jazz-green/60" : "text-jazz-brass",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={
          light ? "h-px w-5 bg-jazz-green/35" : "h-px w-5 bg-jazz-brass"
        }
      />
      {children}
    </p>
  );
}

export function JazzSectionTitle({
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
      <JazzEyebrow light={light}>{eyebrow}</JazzEyebrow>
      <h2
        className={[
          "mt-4 max-w-3xl font-serif text-3xl leading-[1.15] tracking-[-0.025em] sm:text-4xl lg:text-5xl",
          light ? "text-jazz-green" : "text-[#f4eddf]",
        ].join(" ")}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={[
            "mt-4 max-w-2xl text-sm leading-7",
            light ? "text-jazz-green/65" : "text-[#f4eddf]/60",
          ].join(" ")}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function JazzLinkButton({
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
      "border-jazz-brass bg-jazz-brass text-[#0c0f0e] hover:border-jazz-brass-hover hover:bg-jazz-brass-hover",
    outline:
      "border-[#f4eddf]/30 text-[#f4eddf] hover:border-[#f4eddf]/70 hover:bg-[#f4eddf]/5",
    ink: "border-jazz-green bg-jazz-green text-[#f4eddf] hover:bg-jazz-green-hover",
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

export function JazzStatus({
  children,
  tone = "brass",
}: {
  children: ReactNode;
  tone?: "brass" | "green" | "red";
}) {
  const toneClass = {
    brass: "border-jazz-brass/45 bg-jazz-brass/10 text-jazz-brass",
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
