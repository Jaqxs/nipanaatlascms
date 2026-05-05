"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KpiCard } from "./components/KpiCard";
import { AlertsPanel, AlertItem } from "./components/AlertsPanel";
import { Badge, statusToTone } from "./components/Badge";
import { Modal } from "./components/Modal";
import { PageHeader } from "./components/PageHeader";
import { RowActionsMenu } from "./components/RowActionsMenu";
import { GoldPriceCard } from "./components/GoldPriceCard";
import { ExportModal } from "./components/ExportModal";
import { TransactionDetailModal } from "./components/TransactionDetailModal";
import {
  SalesVsExpensesChart, ProfitTrendChart, StockByPurityChart, GoldPriceSparkline,
} from "./components/Charts";
import {
  KPIS, RECENT_TX, STOCK_BY_PURITY, GOLD_PRICE, GOLD_FLOW, fmtWeight,
} from "./lib/mockData";
import { useRole } from "./lib/role-context";
import { useCurrency } from "./lib/currency-context";
import { useDateRange } from "./lib/date-range-context";

const QUICK_ACTIONS = [
  { label: "Record Sale", icon: "ri-arrow-up-circle-line" },
  { label: "Record Purchase", icon: "ri-arrow-down-circle-line" },
  { label: "New Invoice", icon: "ri-file-paper-2-line" },
  { label: "New Quotation", icon: "ri-price-tag-3-line" },
  { label: "Log Expense", icon: "ri-coin-line" },
  { label: "Adjust Stock", icon: "ri-archive-line" },
];

const INVENTORY_AVAILABLE_G = 2257.5;

const EXTENDED_TX = [
  ...RECENT_TX,
  { ref: "TX-018336", date: "May 02", type: "Cash Inflow", party: "Investor — Amir K.", amount: 50_000, status: "confirmed" },
  { ref: "TX-018335", date: "May 01", type: "Gold Sale", party: "Sukuma Gold Co.", amount: 12_400, status: "confirmed" },
  { ref: "TX-018334", date: "Apr 30", type: "Op. Expense", party: "Office rent — May", amount: -2_800, status: "confirmed" },
  { ref: "TX-018333", date: "Apr 30", type: "Logistics", party: "Insurance — Q2", amount: -3_200, status: "rejected" },
];

export default function Dashboard() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const { format, formatUSD } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();
  const totalFineWeight = STOCK_BY_PURITY.reduce((a, b) => a + b.value, 0);
  const filteredTx = EXTENDED_TX.filter((t) => inRangeFromShortDate(t.date));

  const [tx, setTx] = useState<typeof EXTENDED_TX[number] | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState<string | null>(null);
  const [alertDetail, setAlertDetail] = useState<AlertItem | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Mwanza Operations · Monday, 4 May 2026 · Showing ${rangeLabel}`}
        actions={isAdmin && (
          <button onClick={() => setExportOpen(true)} className="btn-secondary">
            <i className="ri-download-cloud-2-line" />
            Export snapshot
          </button>
        )}
      />

      {/* KPI Row — role-aware */}
      {isAdmin ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total Sales" value={format(KPIS.totalSales, { compact: true })} fullValue={format(KPIS.totalSales)} delta={{ value: "12.4%", positive: true }} hint="vs last month" icon="ri-arrow-right-up-line" />
          <KpiCard label="Total Expenses" value={format(KPIS.totalExpenses, { compact: true })} fullValue={format(KPIS.totalExpenses)} delta={{ value: "4.1%", positive: false }} hint="vs last month" icon="ri-arrow-right-down-line" />
          <KpiCard label="Net P&L" value={format(KPIS.netProfit, { compact: true })} fullValue={format(KPIS.netProfit)} delta={{ value: "18.2%", positive: true }} hint="margin 34.5%" icon="ri-scales-3-line" emphasis="gold" />
          <KpiCard label="Gold Stock" value={fmtWeight(KPIS.stockWeight)} hint={`${(totalFineWeight / 1000).toFixed(2)} kg fine`} icon="ri-archive-stack-line" />
          <KpiCard label="Stock Value" value={format(KPIS.stockValue, { compact: true })} fullValue={format(KPIS.stockValue)} hint={`@ ${formatUSD(GOLD_PRICE.current)}/g`} icon="ri-coin-line" />
          <KpiCard label="Cash Position" value={format(KPIS.cashPosition, { compact: true })} fullValue={format(KPIS.cashPosition)} hint="liquid · all banks" icon="ri-wallet-3-line" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Gold Sold" value={fmtWeight(GOLD_FLOW.sold.weight_g)} hint={`${GOLD_FLOW.sold.count} sales · ${rangeLabel}`} icon="ri-arrow-up-circle-line" />
          <KpiCard label="Gold Purchased" value={fmtWeight(GOLD_FLOW.purchased.weight_g)} hint={`${GOLD_FLOW.purchased.count} buys · ${rangeLabel}`} icon="ri-arrow-down-circle-line" />
          <KpiCard label="Gold Stock" value={fmtWeight(KPIS.stockWeight)} hint={`${(totalFineWeight / 1000).toFixed(2)} kg fine`} icon="ri-archive-stack-line" />
          <KpiCard label="My Submissions" value="42" hint="this month · 95% approved" icon="ri-quill-pen-line" />
          <KpiCard label="My Invoices" value={`${KPIS.pendingInvoices.count}`} hint={`${KPIS.pendingInvoices.count} pending`} icon="ri-file-paper-2-line" />
          <KpiCard label="Active Gold Price" value={`$${GOLD_PRICE.current.toFixed(2)}/g`} hint="USD · spot" icon="ri-coin-line" emphasis="gold" />
        </div>
      )}

      {/* Gold Flow summary — visible to both roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GoldFlowCard
          tone="sage"
          icon="ri-arrow-up-circle-line"
          label="Gold Sold"
          rangeLabel={rangeLabel}
          weight={GOLD_FLOW.sold.weight_g}
          value={GOLD_FLOW.sold.value_usd}
          count={GOLD_FLOW.sold.count}
          avgPrice={GOLD_FLOW.sold.avgPricePerGram}
          spark={GOLD_FLOW.sold.spark}
          format={format}
          formatUSD={formatUSD}
          showValue={isAdmin}
        />
        <GoldFlowCard
          tone="terracotta"
          icon="ri-arrow-down-circle-line"
          label="Gold Purchased"
          rangeLabel={rangeLabel}
          weight={GOLD_FLOW.purchased.weight_g}
          value={GOLD_FLOW.purchased.value_usd}
          count={GOLD_FLOW.purchased.count}
          avgPrice={GOLD_FLOW.purchased.avgPricePerGram}
          spark={GOLD_FLOW.purchased.spark}
          format={format}
          formatUSD={formatUSD}
          showValue={isAdmin}
        />
      </div>

      {/* Charts row — admin sees financial charts + alerts; Ops sees inventory + price + quick actions */}
      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="surface p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Trade Activity</div>
                  <div className="font-display text-lg text-ink">Sales vs Expenses · last 7 days</div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gold-500" /> Sales</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#c89b62] opacity-60" /> Expenses</span>
                </div>
              </div>
              <SalesVsExpensesChart />
            </div>
            <div className="surface p-5 flex flex-col flex-1 min-h-[280px]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Profit Trend · 30-day rolling</div>
                  <div className="font-display text-lg text-ink">With AI forecast band</div>
                </div>
              </div>
              <div className="flex-1 min-h-[200px]">
                <ProfitTrendChart className="h-full" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Quick Actions</div>
                  <div className="font-display text-lg text-ink">Common tasks</div>
                </div>
                <i className="ri-flashlight-line text-gold-600 text-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((q) => (
                  <button key={q.label} onClick={() => setQuickOpen(q.label)} className="action-tile">
                    <i className={q.icon} />
                    <span className="truncate">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <AlertsPanel onOpen={setAlertDetail} />
          </div>
        </div>
      ) : (
        // Sales & Ops: Inventory (left) + Quick Actions + Gold Price (right) — heights aligned via flex-1 fill
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 surface p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Inventory</div>
                <div className="font-display text-lg text-ink">Stock by purity</div>
              </div>
              <Link href="/inventory" className="text-xs text-gold-700 hover:underline flex items-center gap-1">
                Manage <i className="ri-arrow-right-line" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 items-center">
              <StockByPurityChart size="large" />
              <div className="space-y-2">
                {STOCK_BY_PURITY.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm text-ink-soft">
                    <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-auto font-numeric text-ink">{s.value.toFixed(0)}g</span>
                  </div>
                ))}
                <div className="divider-rule my-2" />
                <div className="flex items-center gap-2 text-sm text-ink">
                  <span className="font-medium">Total fine</span>
                  <span className="ml-auto font-numeric">{(totalFineWeight).toFixed(1)}g</span>
                </div>
              </div>
            </div>

            {/* Operational stats strip — fills the remaining space */}
            <div className="divider-rule my-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <MiniStat label="Available" value={`${INVENTORY_AVAILABLE_G.toFixed(0)}g`} sub="ready to sell" />
              <MiniStat label="Reserved" value="880g" sub="for open orders" />
              <MiniStat label="Processing" value="659g" sub="at refinery" />
              <MiniStat label="In transit" value="422g" sub="armoured shipment" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Quick Actions</div>
                  <div className="font-display text-lg text-ink">Common tasks</div>
                </div>
                <i className="ri-flashlight-line text-gold-600 text-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((q) => (
                  <button key={q.label} onClick={() => setQuickOpen(q.label)} className="action-tile">
                    <i className={q.icon} />
                    <span className="truncate">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <GoldPriceCard isAdmin={false} />
          </div>
        </div>
      )}

      {/* Inventory + Gold Price row — admin only (Ops sees inventory in left col + price in right col) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="surface p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Inventory</div>
                <div className="font-display text-lg text-ink">Stock by purity</div>
              </div>
              <Link href="/inventory" className="text-xs text-gold-700 hover:underline flex items-center gap-1">
                Manage <i className="ri-arrow-right-line" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 items-center">
              <StockByPurityChart size="large" />
              <div className="space-y-2">
                {STOCK_BY_PURITY.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm text-ink-soft">
                    <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-auto font-numeric text-ink">{s.value.toFixed(0)}g</span>
                  </div>
                ))}
                <div className="divider-rule my-2" />
                <div className="flex items-center gap-2 text-sm text-ink">
                  <span className="font-medium">Total fine</span>
                  <span className="ml-auto font-numeric">{(totalFineWeight).toFixed(1)}g</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <span>Stock value</span>
                  <span className="ml-auto font-numeric text-ink">{format(KPIS.stockValue)}</span>
                </div>
              </div>
            </div>
          </div>

          <GoldPriceCard isAdmin={isAdmin} onUpdate={() => setPriceOpen(true)} />
        </div>
      )}

      {/* Recent Transactions — full width */}
      <div className="surface">
        <div className="px-5 pt-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {isAdmin ? "Recent Transactions" : "My Recent Submissions"}
            </div>
            <div className="font-display text-lg text-ink">{filteredTx.length} entries · {rangeLabel}</div>
          </div>
          <Link href="/transactions" className="text-xs text-gold-700 hover:underline flex items-center gap-1">
            All transactions <i className="ri-arrow-right-line" />
          </Link>
        </div>
        <table className="ledger mt-2">
          <thead>
            <tr>
              <th>Ref</th><th>Date</th><th>Type</th><th>Counterparty</th>
              {isAdmin && <th>Submitted by</th>}
              {isAdmin && <th className="text-right">Amount</th>}
              {!isAdmin && <th className="text-right">Weight</th>}
              <th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {filteredTx.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="text-center text-ink-faint py-12">No transactions in this date range.</td></tr>
            ) : filteredTx.map((t) => (
              <tr key={t.ref} className="clickable" onClick={() => setTx(t)}>
                <td className="font-numeric text-ink">{t.ref}</td>
                <td className="text-ink-muted">{t.date}</td>
                <td>{t.type}</td>
                <td className="text-ink-soft">{t.party}</td>
                {isAdmin && <td className="text-ink-muted">J. Assey</td>}
                {isAdmin ? (
                  <td className={`text-right font-numeric ${t.amount < 0 ? "text-rose-700" : "text-sage-700"}`}>
                    {t.amount < 0 ? "−" : "+"}{format(Math.abs(t.amount))}
                  </td>
                ) : (
                  <td className="text-right font-numeric text-ink">
                    {t.type.includes("Gold") ? `${(Math.abs(t.amount) / 74).toFixed(0)} g` : "—"}
                  </td>
                )}
                <td><Badge tone={statusToTone(t.status)}>{t.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View detail", icon: "ri-eye-line", onClick: () => setTx(t) },
                    { label: "Open in transactions", icon: "ri-external-link-line", onClick: () => router.push("/transactions") },
                    { label: "Duplicate", icon: "ri-file-copy-line", onClick: () => alert("Duplicated") },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <TransactionDetailModal tx={tx} onClose={() => setTx(null)} />

      <Modal open={priceOpen} onClose={() => setPriceOpen(false)} eyebrow="Settings" title="Update gold price"
        footer={<><button className="btn-secondary" onClick={() => setPriceOpen(false)}>Cancel</button><button className="btn-primary" onClick={() => setPriceOpen(false)}>Save</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="New price /g (USD)"><input className="input" placeholder="74.50" /></Field>
          <Field label="Source / reference"><input className="input" placeholder="LBMA · Reuters · Manual" /></Field>
        </div>
      </Modal>

      <Modal open={!!quickOpen} onClose={() => setQuickOpen(null)} eyebrow="Quick action" title={quickOpen || ""}
        footer={<><button className="btn-secondary" onClick={() => setQuickOpen(null)}>Cancel</button><button className="btn-primary" onClick={() => setQuickOpen(null)}>Submit</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date"><input type="date" className="input" defaultValue="2026-05-04" /></Field>
          <Field label="Amount"><input className="input" placeholder="0.00" /></Field>
          <Field label="Counterparty" full><input className="input" placeholder="Supplier or customer" /></Field>
          <Field label="Description" full><textarea rows={2} className="input" placeholder="Minimum 10 characters" /></Field>
        </div>
      </Modal>

      <AlertDetailModal alert={alertDetail} onClose={() => setAlertDetail(null)} onNavigate={(href) => { setAlertDetail(null); router.push(href); }} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="dashboard snapshot" rowCount={filteredTx.length} />
    </div>
  );
}

function GoldFlowCard({
  tone, icon, label, rangeLabel, weight, value, count, avgPrice, spark, format, formatUSD, showValue,
}: {
  tone: "sage" | "terracotta";
  icon: string;
  label: string;
  rangeLabel: string;
  weight: number;
  value: number;
  count: number;
  avgPrice: number;
  spark: number[];
  format: (n: number) => string;
  formatUSD: (n: number) => string;
  showValue: boolean;
}) {
  const tint = tone === "sage" ? "#7a8c6b" : "#b56b4a";
  const bg = tone === "sage" ? "#f1f4ec" : "#f6e2da";

  return (
    <div className="surface p-5"
      style={{ background: `linear-gradient(135deg, ${bg} 0%, #ffffff 60%)` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${tint}1f`, color: tint }}>
            <i className={`${icon} text-2xl`} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
            <div className="text-xs text-ink-faint">{rangeLabel} · {count} transactions</div>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-muted px-2 py-0.5 rounded surface-flat">
          avg {formatUSD(avgPrice)}/g
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-numeric text-[34px] text-ink leading-none">{fmtWeight(weight)}</div>
          {showValue && (
            <div className="text-sm text-ink-muted mt-1.5 font-numeric">{format(value)}</div>
          )}
        </div>
        <div className="w-[42%] h-[60px]">
          <GoldPriceSparkline data={spark} />
        </div>
      </div>
    </div>
  );
}

function AlertDetailModal({ alert, onClose, onNavigate }: { alert: AlertItem | null; onClose: () => void; onNavigate: (href: string) => void }) {
  if (!alert) return null;
  const ROUTE: Record<string, { href: string; label: string }> = {
    stock: { href: "/inventory", label: "Open Inventory" },
    anomaly: { href: "/ai-insights", label: "Open AI Insights" },
    invoice: { href: "/invoices", label: "Open Invoices" },
    price: { href: "/settings", label: "Open Gold Price settings" },
    expense: { href: "/cash-flow", label: "Open Cash Flow" },
  };
  const SEVERITY: Record<string, { tone: string; bg: string; fg: string; label: string }> = {
    danger:  { tone: "Critical", bg: "#ecc8be", fg: "#7d3a2a", label: "Critical" },
    warning: { tone: "Warning",  bg: "#f1d9c8", fg: "#8a4d31", label: "Warning"  },
    info:    { tone: "Watch",    bg: "#fbf3df", fg: "#7a571c", label: "Watch"    },
  };
  const route = ROUTE[alert.kind];
  const sev = SEVERITY[alert.severity];

  return (
    <Modal open onClose={onClose} eyebrow="Alert" title={alert.title}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Dismiss</button>
        <button className="btn-secondary" onClick={onClose}><i className="ri-eye-off-line" />Mute this rule</button>
        <button className="btn-primary" onClick={() => onNavigate(route.href)}>
          <i className="ri-arrow-right-line" /> {route.label}
        </button>
      </>}>
      <div className="surface-flat p-4 mb-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: sev.bg, color: sev.fg }}>
          <i className="ri-alert-line text-xl" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: sev.bg, color: sev.fg }}>
              {sev.label}
            </span>
            <span className="text-xs text-ink-muted">Detected {alert.time}</span>
          </div>
          <div className="text-sm text-ink-soft mt-2">{alert.body}</div>
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Recommended action</div>
      <p className="text-sm text-ink-soft mb-4">
        {alert.kind === "stock" && "Place a purchase order for the affected grade or rebalance from another vault to bring stock above the safety threshold."}
        {alert.kind === "anomaly" && "Open the linked transaction, verify the counterparty and amount, and either approve or escalate."}
        {alert.kind === "invoice" && "Send a courtesy reminder to the customer, or call them to confirm receipt of the invoice."}
        {alert.kind === "price" && "Confirm the source quote. If correct, accept the deviation; otherwise re-enter from the canonical source."}
        {alert.kind === "expense" && "Review category breakdown for the period and pause non-essential spend until the next cycle."}
      </p>
    </Modal>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="surface-flat p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
      <div className="font-numeric text-lg text-ink mt-0.5">{value}</div>
      <div className="text-[11px] text-ink-faint">{sub}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">{label}</div>
      {children}
    </label>
  );
}
