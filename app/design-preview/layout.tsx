import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./design-preview.css";

export const metadata: Metadata = {
  title: "Jazz Mobile Concept | Adlib Go",
  description:
    "Adlib Go のトップ、公開ページ、メンバーマイページを対象にしたモバイルファーストのデザイン検討案。",
};

export default function DesignPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
