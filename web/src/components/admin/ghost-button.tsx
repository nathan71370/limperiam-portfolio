import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function GhostButton({ children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-line bg-card text-ink px-5 py-2.5 text-[13px] font-medium hover:border-ink transition-colors disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
