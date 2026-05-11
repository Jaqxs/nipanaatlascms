"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type RangeId = "today" | "week" | "month" | "quarter" | "ytd" | "custom";

interface CustomBound { from: string; to: string }

export const RANGES: Record<RangeId, { id: RangeId; label: string; days: number }> = {
  today: { id: "today", label: "Today", days: 1 },
  week: { id: "week", label: "This Week", days: 7 },
  month: { id: "month", label: "This Month", days: 31 },
  quarter: { id: "quarter", label: "This Quarter", days: 92 },
  ytd: { id: "ytd", label: "Year to Date", days: 365 },
  custom: { id: "custom", label: "Custom Range", days: 365 },
};

// The system uses a dynamic today's date for real-time reporting
export const TODAY = new Date(); 

interface Ctx {
  rangeId: RangeId;
  setRangeId: (id: RangeId) => void;
  custom: CustomBound;
  setCustom: (c: CustomBound) => void;
  /** Returns true if a Date falls in the active range */
  inRange: (d: Date | null | undefined) => boolean;
  /** Convenience for short date strings like "May 04" or "Apr 30" */
  inRangeFromShortDate: (s: string) => boolean;
  label: string;
}

const C = createContext<Ctx | null>(null);

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

export function parseShortDate(s: string, year = TODAY.getFullYear()): Date | null {
  if (!s) return null;
  const m = s.trim().toLowerCase().match(/^([a-z]{3,})\s+(\d{1,2})$/);
  if (!m) return null;
  const monthIdx = MONTHS.indexOf(m[1].slice(0, 3));
  if (monthIdx < 0) return null;
  const day = parseInt(m[2], 10);
  // If month is in the future relative to TODAY, assume previous year
  let yr = year;
  if (monthIdx > TODAY.getMonth()) yr = year - 1;
  return new Date(yr, monthIdx, day);
}

function startOf(range: RangeId, custom: CustomBound) {
  const t = new Date(TODAY);
  t.setHours(0, 0, 0, 0);
  switch (range) {
    case "today": return t;
    case "week": {
      const d = new Date(t);
      const dow = d.getDay() || 7; // make Sunday = 7
      d.setDate(d.getDate() - (dow - 1));
      return d;
    }
    case "month":
      return new Date(t.getFullYear(), t.getMonth(), 1);
    case "quarter": {
      const q = Math.floor(t.getMonth() / 3) * 3;
      return new Date(t.getFullYear(), q, 1);
    }
    case "ytd":
      return new Date(t.getFullYear(), 0, 1);
    case "custom": {
      const d = new Date(custom.from);
      return isNaN(d.getTime()) ? new Date(t.getFullYear(), 0, 1) : d;
    }
  }
}

function endOf(range: RangeId, custom: CustomBound) {
  const t = new Date(TODAY);
  t.setHours(23, 59, 59, 999);
  if (range === "custom") {
    const d = new Date(custom.to);
    return isNaN(d.getTime()) ? t : d;
  }
  return t;
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [rangeId, setRangeId] = useState<RangeId>("month");
  const [custom, setCustom] = useState<CustomBound>({
    from: "2026-04-01",
    to: "2026-05-04",
  });

  const inRange = (d: Date | null | undefined) => {
    if (!d) return true; // no date — keep
    const s = startOf(rangeId, custom).getTime();
    const e = endOf(rangeId, custom).getTime();
    const t = d.getTime();
    return t >= s && t <= e;
  };

  const inRangeFromShortDate = (s: string) => inRange(parseShortDate(s));

  return (
    <C.Provider value={{ rangeId, setRangeId, custom, setCustom, inRange, inRangeFromShortDate, label: RANGES[rangeId].label }}>
      {children}
    </C.Provider>
  );
}

export function useDateRange() {
  const c = useContext(C);
  if (!c) throw new Error("useDateRange must be inside DateRangeProvider");
  return c;
}
