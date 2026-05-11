"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type CurrencyCode = "TZS" | "USD" | "EUR" | "GBP" | "KES";

interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  symbol: string;
  rate: number; // multiplier from base USD
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  TZS: { code: "TZS", label: "Tanzanian Shilling", symbol: "TSh", rate: 2500, decimals: 0 },
  USD: { code: "USD", label: "US Dollar", symbol: "$", rate: 1, decimals: 2 },
  EUR: { code: "EUR", label: "Euro", symbol: "€", rate: 0.92, decimals: 2 },
  GBP: { code: "GBP", label: "British Pound", symbol: "£", rate: 0.79, decimals: 2 },
  KES: { code: "KES", label: "Kenyan Shilling", symbol: "KSh", rate: 129, decimals: 0 },
};

interface FormatOpts {
  decimals?: number;
  signed?: boolean;
  /** Use compact notation (1.2M, 4.5B) — good for KPIs */
  compact?: boolean;
}

interface CurrencyCtx {
  code: CurrencyCode;
  setCode: (c: CurrencyCode) => void;
  meta: CurrencyMeta;
  format: (usdAmount: number, opts?: FormatOpts) => string;
  /** Always-USD format for things like gold spot rates that are global by convention */
  formatUSD: (usdAmount: number) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

function compactFmt(value: number) {
  if (value === null || value === undefined || isNaN(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 1 : 2).replace(/\.?0+$/, "") + "B";
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, "") + "M";
  if (abs >= 1_000) return (value / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.?0+$/, "") + "K";
  return value.toFixed(0);
}

function fmt(amount: number | null | undefined, meta: CurrencyMeta, opts?: FormatOpts) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${meta.symbol} 0`;
  }
  const value = amount * meta.rate;
  const sign = opts?.signed && value > 0 ? "+" : "";
  const negative = value < 0 ? "−" : sign;
  const abs = Math.abs(value);

  if (opts?.compact) {
    return `${negative}${meta.symbol} ${compactFmt(abs)}`;
  }

  const decimals = opts?.decimals ?? meta.decimals;
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${negative}${meta.symbol} ${formatted}`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>("TZS");
  const meta = CURRENCIES[code];
  const value: CurrencyCtx = {
    code,
    setCode,
    meta,
    format: (n, opts) => fmt(n, meta, opts),
    formatUSD: (n) => fmt(n, CURRENCIES.USD),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCurrency must be used within CurrencyProvider");
  return c;
}
