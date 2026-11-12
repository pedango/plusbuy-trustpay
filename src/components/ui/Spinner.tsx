export function Spinner({
  size = 20,
  className = "",
  label = "Loading",
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}
