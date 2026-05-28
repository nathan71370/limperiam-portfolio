export function StatusDot({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[1.5px] text-ink-soft">
      <span className="relative inline-flex">
        <span className="absolute inset-0 animate-ping rounded-full bg-sage/40" />
        <span className="relative h-2 w-2 rounded-full bg-sage" />
      </span>
      {label}
    </span>
  );
}
