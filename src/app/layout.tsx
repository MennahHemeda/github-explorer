import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Fredoka, Nunito } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

/** Chunky, rounded game-menu font for headings, buttons and numbers. */
const gameFont = Fredoka({
  variable: "--font-game-face",
  subsets: ["latin"],
});

/** Soft, rounded and easy to read for longer text (bios, notes, AI summaries). */
const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GitHub Explorer",
    template: "%s · GitHub Explorer",
  },
  description: "Search GitHub profiles, explore repositories, compare developers and get AI insights.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${gameFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">{children}</main>
        {/* Vercel Web Analytics: anonymous visit counts, no cookies. Only reports on Vercel deployments. */}
        <Analytics />
      </body>
    </html>
  );
}
