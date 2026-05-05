"use client";
import { useEffect, useRef, useState } from "react";

interface Notification {
  id: string;
  kind: "approval" | "anomaly" | "invoice" | "stock" | "system" | "ai";
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const ICONS: Record<Notification["kind"], string> = {
  approval: "ri-checkbox-circle-line",
  anomaly: "ri-radar-line",
  invoice: "ri-file-paper-2-line",
  stock: "ri-archive-line",
  system: "ri-settings-3-line",
  ai: "ri-sparkling-2-line",
};

const TONE: Record<Notification["kind"], { bg: string; fg: string }> = {
  approval: { bg: "#dde6d2", fg: "#536450" },
  anomaly: { bg: "#f1d9c8", fg: "#8a4d31" },
  invoice: { bg: "#fbf3df", fg: "#7a571c" },
  stock: { bg: "#fbf3df", fg: "#7a571c" },
  system: { bg: "#f7f1e3", fg: "#6b5e4d" },
  ai: { bg: "#fbf3df", fg: "#7a571c" },
};

const SAMPLE: Notification[] = [
  { id: "n1", kind: "approval", title: "Pending approval", body: "Maria Rweyemamu submitted TX-018340 — Geita Cooperative purchase, $22,800.", time: "12 min ago", unread: true },
  { id: "n2", kind: "anomaly", title: "Anomaly flagged", body: "AN-2218 · TX-018340 sits 2.8σ above category mean. Review recommended.", time: "12 min ago", unread: true },
  { id: "n3", kind: "invoice", title: "Invoice viewed", body: "Mwanza Refinery opened INV-2026-000482 for the first time.", time: "1 hr ago", unread: true },
  { id: "n4", kind: "ai", title: "Daily briefing ready", body: "May 04 morning summary delivered. 3 items flagged for attention.", time: "3 hr ago", unread: false },
  { id: "n5", kind: "stock", title: "Low stock alert", body: "18K grade is at 612g — below 750g threshold.", time: "5 hr ago", unread: false },
  { id: "n6", kind: "system", title: "Backup completed", body: "Daily database backup finished successfully (412 MB, encrypted).", time: "Yesterday", unread: false },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(SAMPLE);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const unreadCount = items.filter((i) => i.unread).length;
  const markAllRead = () => setItems(items.map((i) => ({ ...i, unread: false })));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="surface-flat w-9 h-9 flex items-center justify-center text-ink-soft hover:text-gold-600 transition relative"
        aria-label="Notifications"
      >
        <i className="ri-notification-3-line" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-medium flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-[380px] bg-white border border-line rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ boxShadow: "0 24px 48px -16px rgba(31,26,20,0.22), 0 4px 12px -4px rgba(31,26,20,0.08)" }}
        >
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <div>
              <div className="font-display text-base text-ink">Notifications</div>
              <div className="text-[11px] text-ink-muted">{unreadCount} unread</div>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-gold-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[460px] overflow-y-auto">
            {items.map((n) => {
              const tone = TONE[n.kind];
              return (
                <button
                  key={n.id}
                  onClick={() => setItems(items.map((i) => i.id === n.id ? { ...i, unread: false } : i))}
                  className={`w-full text-left flex gap-3 p-4 border-b border-line hover:bg-paper-50 transition ${n.unread ? "bg-paper-50/60" : ""}`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    <i className={`${ICONS[n.kind]} text-base`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-ink truncate">{n.title}</span>
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />}
                    </div>
                    <div className="text-xs text-ink-muted leading-snug">{n.body}</div>
                    <div className="text-[10px] text-ink-faint mt-1.5 uppercase tracking-wider">{n.time}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-line bg-paper-50/40 flex items-center justify-between">
            <button className="text-xs text-ink-muted hover:text-ink">Notification settings</button>
            <button className="text-xs text-gold-700 hover:underline font-medium">View all →</button>
          </div>
        </div>
      )}
    </div>
  );
}
