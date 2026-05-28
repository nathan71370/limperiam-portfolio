export function StatusDot({ label }: { label: string }) {
  return (
    <span className="status-wrap" tabIndex={0} aria-label={label}>
      <span className="dot" />
      <span className="tip">{label}</span>
    </span>
  );
}
