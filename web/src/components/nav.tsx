import Link from "next/link";
import { NAV } from "@/content/static";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/80 border-b border-line">
      <div className="mx-auto flex max-w-[var(--max-w)] items-center justify-between px-[var(--page-pad)] py-4">
        <Link
          href="/"
          className="font-serif italic text-[22px] leading-none text-ink"
        >
          {NAV.brand}
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-[13px] text-ink-soft">
          {NAV.items.map((item) => (
            <a key={item.h} href={item.h} className="hover:text-ink transition-colors">
              {item.l}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
