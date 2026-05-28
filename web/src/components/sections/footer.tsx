import { FOOTER } from "@/content/static";

export function Footer() {
  return (
    <footer className="bg-ink text-cream py-12">
      <div className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <p className="font-serif italic text-[28px] leading-none">
            {FOOTER.brand}
          </p>
          <p className="mt-2 text-[14px] text-cream/70">{FOOTER.tagline}</p>
        </div>
        <p className="text-[12px] text-cream/50">{FOOTER.colophon}</p>
      </div>
    </footer>
  );
}
