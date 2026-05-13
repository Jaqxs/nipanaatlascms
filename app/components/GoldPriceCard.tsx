"use client";
import { GoldPriceSparkline } from "./Charts";
const GOLD_PRICE = { current: 75.42, delta: 1.2, asOf: "Live Spot", history: [74, 75, 74.5, 75.8, 75.42], source: "LBMA" };

interface Props {
  current?: number;
  delta?: number;
  asOf?: string;
  history?: number[];
  isAdmin?: boolean;
  onUpdate?: () => void;
}

export function GoldPriceCard({ 
  current: propCurrent, 
  delta: propDelta, 
  asOf: propAsOf, 
  history: propHistory, 
  isAdmin, 
  onUpdate 
}: Props) {
  const current = propCurrent ?? GOLD_PRICE.current;
  const delta = propDelta ?? GOLD_PRICE.delta;
  const asOf = propAsOf ?? GOLD_PRICE.asOf;
  const history = propHistory && propHistory.length > 0 ? propHistory : (GOLD_PRICE.history.length > 0 ? GOLD_PRICE.history : [0]);
  const { source } = GOLD_PRICE;
  
  const high = Math.max(...history);
  const low = Math.min(...history);
  const dayChange = current !== 0 ? ((delta / (current - delta)) * 100) : 0;

  return (
    <div className="surface p-5 flex flex-col" style={{ background: "#fdf6e4" }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Active Gold Price</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-numeric text-[40px] text-ink leading-none">${current.toFixed(2)}</span>
            <span className="text-ink-soft text-sm">/ gram · USD</span>
          </div>
          <div className="text-xs text-gold-700 mt-1.5 inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 surface-flat px-2 py-0.5">
              <i className={delta >= 0 ? "ri-arrow-up-line" : "ri-arrow-down-line"} />
              ${Math.abs(delta).toFixed(2)} ({dayChange.toFixed(2)}%)
            </span>
            <span className="text-ink-muted">{source}</span>
          </div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#b8893d" }}
        >
          <i className="ri-coin-line text-white text-2xl" />
        </div>
      </div>

      <div className="mt-4">
        <GoldPriceSparkline data={history} />
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted text-center -mt-1">last 7 entries</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="surface-flat px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">7d high</div>
          <div className="font-numeric text-base text-ink mt-0.5">${high.toFixed(2)}</div>
        </div>
        <div className="surface-flat px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">7d low</div>
          <div className="font-numeric text-base text-ink mt-0.5">${low.toFixed(2)}</div>
        </div>
        <div className="surface-flat px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">vs LBMA</div>
          <div className="font-numeric text-base text-sage-700 mt-0.5">+0.3%</div>
        </div>
      </div>

      <div className="divider-rule my-4" />

      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>As of {asOf}</span>
        {isAdmin && (
          <button onClick={onUpdate} className="text-gold-700 font-medium hover:underline inline-flex items-center gap-1">
            Update price <i className="ri-edit-line" />
          </button>
        )}
      </div>
    </div>
  );
}
