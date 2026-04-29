import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust Layer — AI Document Review",
  description:
    "A general-purpose AI document review system with two layers of trust: a prompt quality score before generation, and a deterministic document score with grounding audit after.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
