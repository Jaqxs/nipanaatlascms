import { ReactNode } from "react";

type Tone = "sage" | "amber" | "rose" | "terracotta" | "ink" | "info";

const TONES: Record<Tone, string> = {
  sage: "bg-sage-100 text-sage-700",
  amber: "bg-gold-100 text-gold-700",
  rose: "bg-rose-100 text-rose-700",
  terracotta: "bg-terracotta-100 text-terracotta-700",
  ink: "bg-paper-300 text-ink-soft",
  info: "bg-paper-200 text-ink-muted",
};

export function Badge({ tone = "ink", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase ${TONES[tone]}`}
      style={{ letterSpacing: "0.06em" }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function statusToTone(status: string): Tone {
  if (!status) return "ink";
  const s = status.toLowerCase();
  if (["paid", "confirmed", "approved", "accepted", "available", "active"].includes(s)) return "sage";
  if (["pending", "sent", "draft", "processing", "reserved"].includes(s)) return "amber";
  if (["overdue"].includes(s)) return "rose";
  if (["rejected", "expired", "cancelled"].includes(s)) return "terracotta";
  if (["converted", "in_transit", "in transit"].includes(s)) return "info";
  return "ink";
}
