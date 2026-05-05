"use client";
import { useState } from "react";
import { ALERTS } from "../lib/mockData";

export interface AlertItem {
  kind: string;
  severity: string;
  title: string;
  body: string;
  time: string;
}

const ICONS: Record<string, string> = {
  stock: "ri-stack-line",
  anomaly: "ri-radar-line",
  invoice: "ri-bill-line",
  price: "ri-line-chart-line",
  expense: "ri-coins-line",
};

const SEVERITY_LABEL: Record<string, string> = {
  warning: "Warning",
  info: "Watch",
  danger: "Critical",
};

const SEVERITY_STYLE: Record<string, { stripe: string; iconBg: string; iconFg: string; pillBg: string; pillFg: string }> = {
  warning: { stripe: "#b56b4a", iconBg: "#f1d9c8", iconFg: "#8a4d31", pillBg: "#f1d9c8", pillFg: "#8a4d31" },
  info:    { stripe: "#b8893d", iconBg: "#fbf3df", iconFg: "#7a571c", pillBg: "#fbf3df", pillFg: "#7a571c" },
  danger:  { stripe: "#a85944", iconBg: "#ecc8be", iconFg: "#7d3a2a", pillBg: "#ecc8be", pillFg: "#7d3a2a" },
};

const TABS = [
  { id: "all", label: "All" },
  { id: "danger", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Watch" },
];

export function AlertsPanel({ onOpen }: { onOpen?: (a: AlertItem) => void }) {
  const [tab, setTab] = useState("all");

  const counts = ALERTS.reduce<Record<string, number>>((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {});

  const filtered = tab === "all" ? ALERTS : ALERTS.filter((a) => a.severity === tab);

  return (
    <div className="surface p-5 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
            Smart Alerts
          </div>
          <div className="font-display text-lg text-ink">Items needing attention</div>
        </div>
        <div className="flex items-center gap-1.5 text-rose-700">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-medium uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 mb-1">
        <i className="ri-filter-3-line text-ink-muted text-sm" />
        <div className="surface-flat flex items-center gap-1 px-3 py-1.5 text-sm text-ink-soft flex-1">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="bg-transparent outline-none cursor-pointer w-full font-medium"
            aria-label="Filter alerts"
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} {counts[t.id] ? `(${counts[t.id]})` : ""}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line text-ink-faint shrink-0" />
        </div>
      </div>

      <div className="space-y-2 mt-4 max-h-[360px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-ink-faint text-sm py-8">
            <i className="ri-checkbox-circle-line text-3xl text-sage-500 mb-2 block" />
            All clear in this category.
          </div>
        ) : filtered.map((a, i) => {
          const sty = SEVERITY_STYLE[a.severity];
          return (
            <button
              key={i}
              onClick={() => onOpen && onOpen(a)}
              className="w-full text-left flex gap-2.5 p-2.5 rounded-lg hover:bg-paper-50 transition relative pl-3.5 group"
              style={{ borderLeft: `3px solid ${sty.stripe}` }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: sty.iconBg, color: sty.iconFg }}
              >
                <i className={`${ICONS[a.kind]} text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div className="text-sm font-medium text-ink leading-tight">{a.title}</div>
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: sty.pillBg, color: sty.pillFg }}
                  >
                    {SEVERITY_LABEL[a.severity]}
                  </span>
                </div>
                <div className="text-xs text-ink-muted leading-relaxed">{a.body}</div>
                <div className="text-[10px] text-ink-faint mt-1.5 uppercase tracking-wider flex items-center gap-2">
                  <span>{a.time}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition text-gold-700 ml-auto">
                    Review →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-xs text-ink-muted">
        <span>Updated 2 min ago</span>
        <button className="text-gold-700 hover:underline font-medium">View all alerts →</button>
      </div>
    </div>
  );
}
