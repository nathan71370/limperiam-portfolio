import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function PrimaryButton({ children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-ink text-cream px-5 py-2.5 text-[13px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
