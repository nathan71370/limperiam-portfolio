import { cn } from "@/lib/cn";

export function Kicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-[2px] text-ink-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}
