import { cn } from "@/lib/cn";

type BaseProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

type InputProps = BaseProps & {
  type?: "text" | "email" | "url" | "number" | "date" | "password";
  defaultValue?: string | number | null;
  pattern?: string;
  inputMode?: "text" | "decimal" | "numeric" | "url" | "email";
};

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  hint,
  required,
  pattern,
  inputMode,
}: InputProps) {
  return (
    <label className="block">
      <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        pattern={pattern}
        inputMode={inputMode}
        defaultValue={defaultValue ?? undefined}
        className={cn(
          "mt-2 w-full rounded-lg border bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none",
          error ? "border-accent" : "border-line",
        )}
      />
      {hint && !error && (
        <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>
      )}
      {error && <p className="mt-1 text-[12px] text-accent">{error}</p>}
    </label>
  );
}

type TextareaProps = BaseProps & {
  defaultValue?: string | null;
  rows?: number;
};

export function FieldTextarea({
  label,
  name,
  defaultValue,
  error,
  hint,
  required,
  rows = 4,
}: TextareaProps) {
  return (
    <label className="block">
      <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        className={cn(
          "mt-2 w-full rounded-lg border bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none resize-y",
          error ? "border-accent" : "border-line",
        )}
      />
      {hint && !error && (
        <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>
      )}
      {error && <p className="mt-1 text-[12px] text-accent">{error}</p>}
    </label>
  );
}

type CheckboxProps = {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
};

export function FieldCheckbox({
  label,
  name,
  defaultChecked,
  hint,
}: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-line accent-accent"
      />
      <span>
        <span className="block text-[14px] text-ink">{label}</span>
        {hint && (
          <span className="block text-[12px] text-ink-mute mt-0.5">{hint}</span>
        )}
      </span>
    </label>
  );
}

type SelectProps = BaseProps & {
  options: { value: string; label: string }[];
  defaultValue?: string | null;
};

export function FieldSelect({
  label,
  name,
  options,
  defaultValue,
  error,
  hint,
  required,
}: SelectProps) {
  return (
    <label className="block">
      <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? undefined}
        className={cn(
          "mt-2 w-full rounded-lg border bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none",
          error ? "border-accent" : "border-line",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>
      )}
      {error && <p className="mt-1 text-[12px] text-accent">{error}</p>}
    </label>
  );
}
