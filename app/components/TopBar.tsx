"use client";
import Link from "next/link";
import { useRole } from "../lib/role-context";
import { useCurrency, CURRENCIES, CurrencyCode } from "../lib/currency-context";
import { useDateRange, RANGES, RangeId } from "../lib/date-range-context";
import { useAuth } from "../lib/auth-context";
import { NotificationBell } from "./NotificationBell";
import { useEffect, useRef, useState } from "react";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { role, setRole, isAdmin } = useRole();
  const { code, setCode } = useCurrency();
  const { rangeId, setRangeId, custom, setCustom } = useDateRange();
  const { user, logout } = useAuth();
  const [customOpen, setCustomOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [profileOpen]);

  const initials = (user?.name || "JA")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white border-b border-line shrink-0">
      <div className="px-6 md:px-10 py-3 flex items-center gap-4 max-w-[1480px] w-full mx-auto">
        <button 
          onClick={onMenuClick}
          className="w-9 h-9 flex items-center justify-center surface-flat md:hidden"
        >
          <i className="ri-menu-2-line text-lg" />
        </button>

        <div className="hidden sm:block text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          {isAdmin ? "Administration" : "Field Operations"} · NIPANA Atlas
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center surface-flat px-1 py-1 text-xs text-ink-muted">
            <button
              onClick={() => setRole("admin")}
              className={`px-3 py-1.5 rounded-md transition ${role === "admin" ? "bg-gold-100 text-gold-700" : ""}`}
            >
              Admin
            </button>
            <button
              onClick={() => setRole("sales_ops")}
              className={`px-3 py-1.5 rounded-md transition ${role === "sales_ops" ? "bg-gold-100 text-gold-700" : ""}`}
            >
              Sales & Ops
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 surface-flat px-3 py-2 text-sm text-ink-soft relative">
            <i className="ri-calendar-2-line text-ink-faint" />
            <select
              value={rangeId}
              onChange={(e) => {
                const id = e.target.value as RangeId;
                setRangeId(id);
                if (id === "custom") setCustomOpen(true);
              }}
              className="bg-transparent outline-none cursor-pointer pr-1"
            >
              {Object.values(RANGES).map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {rangeId === "custom" && (
              <button
                onClick={() => setCustomOpen(!customOpen)}
                className="text-[11px] text-gold-700 hover:underline pl-1"
                title={`${custom.from} → ${custom.to}`}
              >
                {custom.from.slice(5)} → {custom.to.slice(5)}
              </button>
            )}
            {customOpen && rangeId === "custom" && (
              <div
                className="absolute top-12 right-0 w-72 bg-white border border-line rounded-xl z-50 p-4"
                style={{ boxShadow: "0 18px 38px -12px rgba(31,26,20,0.22)" }}
              >
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-3">Custom range</div>
                <label className="block mb-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted mb-1">From</div>
                  <input type="date" className="input" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
                </label>
                <label className="block mb-4">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted mb-1">To</div>
                  <input type="date" className="input" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
                </label>
                <div className="flex justify-end">
                  <button onClick={() => setCustomOpen(false)} className="btn-primary">Apply</button>
                </div>
              </div>
            )}
          </div>

          <button className="surface-flat w-9 h-9 flex items-center justify-center text-ink-soft hover:text-gold-600 transition">
            <i className="ri-refresh-line" />
          </button>

          <div className="hidden md:flex items-center gap-1.5 surface-flat px-3 py-2 text-sm text-ink-soft">
            <i className="ri-money-dollar-circle-line text-ink-faint" />
            <select
              value={code}
              onChange={(e) => setCode(e.target.value as CurrencyCode)}
              className="bg-transparent outline-none cursor-pointer font-medium"
              aria-label="Currency"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>

          <NotificationBell />

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 pl-2 hover:bg-paper-50 rounded-lg py-1 pr-2 transition"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white"
                style={{ background: "#b8893d" }}
              >
                {initials}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-ink leading-tight">{user?.name || "Account"}</div>
                <div className="text-[11px] text-ink-faint">{isAdmin ? "Administrator" : "Sales & Ops"}</div>
              </div>
              <i className="ri-arrow-down-s-line text-ink-faint text-sm hidden lg:block" />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-12 w-64 bg-white border border-line rounded-xl z-50 overflow-hidden"
                style={{ boxShadow: "0 24px 48px -16px rgba(31,26,20,0.22), 0 4px 12px -4px rgba(31,26,20,0.08)" }}
              >
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-sm font-medium text-ink truncate">{user?.name}</div>
                  <div className="text-xs text-ink-muted truncate">{user?.email}</div>
                </div>
                <div className="py-1">
                  <Link href="/profile" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper-50 transition">
                    <i className="ri-user-3-line text-ink-faint" /> Profile
                  </Link>
                  <Link href="/profile" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper-50 transition">
                    <i className="ri-shield-keyhole-line text-ink-faint" /> Security
                  </Link>
                  {isAdmin && (
                    <Link href="/settings" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper-50 transition">
                      <i className="ri-settings-3-line text-ink-faint" /> System settings
                    </Link>
                  )}
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper-50 transition">
                    <i className="ri-question-line text-ink-faint" /> Help & support
                  </button>
                </div>
                <div className="border-t border-line">
                  <button
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-700 hover:bg-rose-100/40 transition font-medium"
                  >
                    <i className="ri-logout-circle-r-line" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
