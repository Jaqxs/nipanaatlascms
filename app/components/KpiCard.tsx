interface Props {
  label: string;
  value: string;
  /** Optional non-abbreviated value shown as a hover tooltip */
  fullValue?: string;
  hint?: string;
  delta?: { value: string; positive?: boolean };
  icon?: string;
  emphasis?: "default" | "gold";
}

export function KpiCard({ label, value, fullValue, hint, delta, icon, emphasis = "default" }: Props) {
  const isGold = emphasis === "gold";
  return (
    <div
      className={`surface p-4 min-w-0 ${isGold ? "border-[rgba(184,137,61,0.3)]" : ""}`}
      style={isGold ? { background: "#fdf6e4" } : undefined}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted truncate">{label}</div>
        {icon && <i className={`${icon} text-gold-600 text-base opacity-70 shrink-0`} />}
      </div>
      <div
        className="font-numeric text-[26px] leading-[1.05] text-ink truncate"
        title={fullValue || value}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] min-w-0">
        {delta && (
          <span className={`inline-flex items-center gap-0.5 shrink-0 ${delta.positive ? "text-sage-700" : "text-rose-700"}`}>
            <i className={delta.positive ? "ri-arrow-up-line" : "ri-arrow-down-line"} />
            {delta.value}
          </span>
        )}
        {hint && <span className="text-ink-faint truncate">{hint}</span>}
      </div>
    </div>
  );
}
