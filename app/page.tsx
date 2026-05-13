"use client";
// Force rebuild: 2026-05-12T09:22:15Z
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KpiCard } from "./components/KpiCard";
import { AlertsPanel, AlertItem } from "./components/AlertsPanel";
import { Badge, statusToTone } from "./components/Badge";
import { Modal } from "./components/Modal";
import { PageHeader } from "./components/PageHeader";
import { getApiUrl } from "./lib/config";
import { RowActionsMenu } from "./components/RowActionsMenu";
import { GoldPriceCard } from "./components/GoldPriceCard";
import { ExportModal } from "./components/ExportModal";
import { TransactionDetailModal } from "./components/TransactionDetailModal";
import {
  SalesVsExpensesChart, ProfitTrendChart, StockByPurityChart, GoldPriceSparkline,
} from "./components/Charts";
import { useRole } from "./lib/role-context";
import { useCurrency } from "./lib/currency-context";
import { useDateRange } from "./lib/date-range-context";
import { usePersistence } from "./lib/persistence-context";
import { PersistenceBanner } from "./components/PersistenceBanner";

const QUICK_ACTIONS = [
  { label: "Record Sale", icon: "ri-arrow-up-circle-line", href: "/transactions?action=new" },
  { label: "Record Purchase", icon: "ri-arrow-down-circle-line", href: "/transactions?action=new" },
  { label: "New Invoice", icon: "ri-file-paper-2-line", href: "/invoices?action=new" },
  { label: "New Quotation", icon: "ri-price-tag-3-line", href: "/quotations?action=new" },
  { label: "Log Expense", icon: "ri-coin-line", href: "/transactions?action=new" },
];

const fmtWeight = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g.toFixed(1)} g`);

const DEFAULT_GOLD_PRICE = { current: 75.42, delta: 0.92, asOf: "Live Spot", history: [74, 75, 74.5, 75.8, 75.42] };
const DEFAULT_STOCK_BY_PURITY = [
  { label: "24K (99.9%)", value: 0 },
  { label: "22K (91.6%)", value: 0 },
  { label: "18K (75.0%)", value: 0 },
];

export default function Dashboard() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [stats, setStats] = useState<any>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { backupData, getBackup, setError, setRecovering, isRecovering } = usePersistence();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, txsRes] = await Promise.all([
        fetch(getApiUrl('/api/dashboard/stats')),
        fetch(getApiUrl('/api/transactions?limit=8'))
      ]);
      
      if (!statsRes.ok || !txsRes.ok) {
        throw new Error(`Connectivity issues: Stats ${statsRes.status}, Txs ${txsRes.status}`);
      }

      const statsData = await statsRes.json();
      const txData = await txsRes.json();
      
      if (statsData && !statsData.error) {
        setStats(statsData);
        backupData('dashboard_stats', statsData);
      }
      
      setRecentTx(Array.isArray(txData) ? txData : []);
      if (Array.isArray(txData) && txData.length > 0) {
        backupData('transactions', txData);
      }
      
      setRecovering(false);
      setError(null);
    } catch (err) {
      console.warn("Failed to fetch dashboard data, trying backup:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      
      const bStats = getBackup('dashboard_stats');
      const bTx = getBackup('transactions');
      if (bStats) setStats(bStats);
      
      const validBackupTx = Array.isArray(bTx) ? bTx : [];
      if (validBackupTx.length > 0) {
        setRecentTx(validBackupTx.slice(0, 8));
        setRecovering(true);
      } else {
        setRecovering(false); // No data and no backup, just empty state
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [tx, setTx] = useState<any | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState<string | null>(null);
  const [alertDetail, setAlertDetail] = useState<AlertItem | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { format, formatUSD } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();
  const totalFineWeight = stats?.stockWeight || 0;
  const filteredTx = recentTx;

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

      <PersistenceBanner onRetry={fetchData} />

      {/* KPI Row — role-aware */}
      {isAdmin ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total Sales" value={format(stats?.totalSales || 0, { compact: true })} fullValue={format(stats?.totalSales || 0)} delta={{ value: "—", positive: true }} hint="real-time" icon="ri-arrow-right-up-line" />
          <KpiCard label="Total Expenses" value={format(stats?.totalExpenses || 0, { compact: true })} fullValue={format(stats?.totalExpenses || 0)} delta={{ value: "—", positive: false }} hint="real-time" icon="ri-arrow-right-down-line" />
          <KpiCard label="Net P&L" value={format(stats?.netProfit || 0, { compact: true })} fullValue={format(stats?.netProfit || 0)} delta={{ value: "—", positive: true }} hint="margin 34.5%" icon="ri-scales-3-line" emphasis="gold" />
          <KpiCard label="Gold Stock" value={fmtWeight(stats?.stockWeight || 0)} hint={`active batches`} icon="ri-archive-stack-line" />
          <KpiCard label="Stock Value" value={format(stats?.stockValue || 0, { compact: true })} fullValue={format(stats?.stockValue || 0)} hint={`@ ${formatUSD(DEFAULT_GOLD_PRICE.current)}/g`} icon="ri-coin-line" />
          <KpiCard label="Cash Position" value={format(stats?.cashPosition || 0, { compact: true })} fullValue={format(stats?.cashPosition || 0)} hint="liquid · approximation" icon="ri-wallet-3-line" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Gold Sold" value={fmtWeight(stats?.goldSoldWeight || 0)} hint={`${stats?.goldSoldCount || 0} sales · ${rangeLabel}`} icon="ri-arrow-up-circle-line" />
          <KpiCard label="Gold Purchased" value={fmtWeight(stats?.goldPurchasedWeight || 0)} hint={`${stats?.goldPurchasedCount || 0} buys · ${rangeLabel}`} icon="ri-arrow-down-circle-line" />
          <KpiCard label="Gold Stock" value={fmtWeight(stats?.stockWeight || 0)} hint={`active batches`} icon="ri-archive-stack-line" />
          <KpiCard label="My Submissions" value="0" hint="this month" icon="ri-quill-pen-line" />
          <KpiCard label="My Invoices" value={`${stats?.pendingInvoices?.count || 0}`} hint={`${stats?.pendingInvoices?.count || 0} pending`} icon="ri-file-paper-2-line" />
          <KpiCard label="Active Gold Price" value={`$${DEFAULT_GOLD_PRICE.current.toFixed(2)}/g`} hint="USD · spot" icon="ri-coin-line" emphasis="gold" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Financial performance</div>
                <div className="font-display text-xl text-ink">Revenue vs. Expenses</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gold-500" /> Revenue</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-ink-faint" /> Expenses</div>
              </div>
            </div>
            <SalesVsExpensesChart />
          </div>

          <div className="surface p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Stock levels</div>
                <div className="font-display text-xl text-ink">Purity distribution</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 h-48">
                <StockByPurityChart />
              </div>
              <div className="md:col-span-2 space-y-4">
                {(stats?.stockByPurity || DEFAULT_STOCK_BY_PURITY).map((item: any) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink font-medium">{item.label}</span>
                      <span className="text-ink-muted font-numeric">{fmtWeight(item.value)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-paper-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-500 rounded-full" style={{ width: totalFineWeight > 0 ? `${(item.value / totalFineWeight) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <GoldPriceCard
            current={DEFAULT_GOLD_PRICE.current}
            delta={DEFAULT_GOLD_PRICE.delta}
            asOf={DEFAULT_GOLD_PRICE.asOf}
            history={DEFAULT_GOLD_PRICE.history as number[]}
            onUpdate={() => setPriceOpen(true)}
          />

          <div className="surface overflow-hidden">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Quick actions</div>
                <div className="font-display text-lg text-ink">Control center</div>
              </div>
            </div>
            <div className="grid grid-cols-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.href)}
                  className="p-5 border-r border-b border-line hover:bg-paper-50 transition text-left group"
                >
                  <i className={`${a.icon} text-xl text-ink-faint group-hover:text-gold-600 transition mb-3 block`} />
                  <div className="text-xs font-medium text-ink-soft">{a.label}</div>
                </button>
              ))}
            </div>
          </div>

          <AlertsPanel
            alerts={[]}
            onOpen={setAlertDetail}
          />
        </div>
      </div>

      <div className="surface">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Operational ledger</div>
            <div className="font-display text-xl text-ink">Recent transactions</div>
          </div>
          <Link href="/transactions" className="text-xs text-gold-700 hover:underline">View all ledger entries</Link>
        </div>
        <table className="ledger">
          <thead>
            <tr>
              <th>Ref</th><th>Date</th><th>Type</th><th>Counterparty</th>
              {isAdmin && <th>Personnel</th>}
              {isAdmin && <th className="text-right">Amount</th>}
              {!isAdmin && <th className="text-right">Weight</th>}
              <th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="text-center text-ink-faint py-12">Loading transactions...</td></tr>
            ) : (Array.isArray(filteredTx) && filteredTx.length === 0) ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="text-center text-ink-faint py-12">No transactions in this date range.</td></tr>
            ) : Array.isArray(filteredTx) ? filteredTx.map((t) => (
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
                  <td className="text-right font-numeric text-ink">240.5 g</td>
                )}
                <td><Badge tone={statusToTone(t.status)}>{t.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View details", icon: "ri-eye-line", onClick: () => setTx(t) },
                    { label: "Download receipt", icon: "ri-download-line", onClick: () => alert("Receipt") },
                    { label: "Archive", icon: "ri-archive-line", onClick: () => alert("Archived"), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>

      <Modal open={!!quickOpen} onClose={() => setQuickOpen(null)} title={quickOpen || ""} eyebrow="Quick Action">
        <p className="text-sm text-ink-muted">Action interface for <span className="text-ink font-medium">{quickOpen}</span> would appear here.</p>
      </Modal>

      <Modal open={!!alertDetail} onClose={() => setAlertDetail(null)} title={alertDetail?.title || ""} eyebrow="System Alert">
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">{alertDetail?.desc}</p>
          <div className="surface-flat p-4 rounded-lg text-xs text-ink-muted space-y-2">
            <div className="flex justify-between"><span>Timestamp</span><span>May 04, 2026 09:12 UTC</span></div>
            <div className="flex justify-between"><span>Module</span><span>Ledger Reconciler</span></div>
            <div className="flex justify-between"><span>Severity</span><Badge tone="terracotta">Critical</Badge></div>
          </div>
        </div>
      </Modal>

      <TransactionDetailModal tx={tx} onClose={() => setTx(null)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="ledger" rowCount={filteredTx.length} />
    </div>
  );
}
