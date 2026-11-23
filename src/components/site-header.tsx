import Link from "next/link";
import { PixelLogo } from "./pixel-logo";

const NAV_LINKS = [
  { href: "/", label: "Search" },
  { href: "/compare", label: "Compare" },
  { href: "/notes", label: "My notes" },
];

export function SiteHeader() {
  return (
    <header className="border-b-[3px] border-zinc-900 bg-sky">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-game text-xl font-semibold" aria-label="GitHub Explorer home">
          <PixelLogo />
          <span className="hidden sm:inline">GitHub Explorer</span>
        </Link>
        <nav className="flex gap-0.5 whitespace-nowrap font-game text-sm sm:gap-2 sm:text-base">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="px-2 py-1 hover:bg-white/60">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
