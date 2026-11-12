import type { ReactNode } from "react";

type Tone = "neutral" | "ok" | "bad" | "held" | "shipped" | "pending";

const toneStyle: Record<Tone, { background: string; color: string }> = {
  neutral: { background: "var(--status-neutral-bg)", color: "var(--status-neutral-fg)" },
  ok: { background: "var(--status-ok-bg)", color: "var(--status-ok-fg)" },
  bad: { background: "var(--status-bad-bg)", color: "var(--status-bad-fg)" },
  held: { background: "var(--status-held-bg)", color: "var(--status-held-fg)" },
  shipped: { background: "var(--status-shipped-bg)", color: "var(--status-shipped-fg)" },
  pending: { background: "var(--status-pending-bg)", color: "var(--status-pending-fg)" },
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const style = toneStyle[tone];
  return (
    <span className={`badge ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}
