"use client";
import { useState, useEffect } from "react";
import { PageHeader, FilterChip } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { MonthlyRevenueProfitChart, ReportRunsDonut } from "../components/Charts";

const REPORTS = [
  { name: "Profit & Loss Statement", category: "Financial", desc: "Revenue, COGS, gross profit, operating expenses, net profit", lastRun: "May 01, 06:00", schedule: "Monthly" },
  { name: "Sales Report", category: "Operations", desc: "All gold sales by date, customer, weight, purity", lastRun: "May 04, 06:00", schedule: "Daily" },
  { name: "Purchase Report", category: "Operations", desc: "All gold purchases by supplier, weight, purity, cost", lastRun: "May 04, 06:00", schedule: "Daily" },
  { name: "Inventory Report", category: "Inventory", desc: "Current stock by batch, purity, location, value", lastRun: "May 04, 09:14", schedule: "On demand" },
  { name: "Inventory Movement Log", category: "Inventory", desc: "Full audit trail of all stock movements", lastRun: "May 03, 23:55", schedule: "Daily" },
  { name: "Cash Flow Statement", category: "Financial", desc: "All inflows and outflows with running balance", lastRun: "May 01, 06:00", schedule: "Monthly" },
  { name: "Expense Summary", category: "Financial", desc: "Expenses grouped by category and period", lastRun: "May 01, 06:00", schedule: "Monthly" },
  { name: "Invoice Aging Report", category: "Financial", desc: "Receivables by age (0-30, 31-60, 61-90, 90+ days)", lastRun: "May 04, 06:00", schedule: "Weekly" },
  { name: "Customer Report", category: "Customers", desc: "Sales history, total spend, outstanding balance per customer", lastRun: "Apr 28, 06:00", schedule: "Weekly" },
  { name: "User Activity Log", category: "Audit", desc: "All actions by each user with timestamps", lastRun: "May 04, 09:14", schedule: "On demand" },
  { name: "Gold Price History", category: "Operations", desc: "Historical price entries and source", lastRun: "May 04, 09:14", schedule: "On demand" },
  { name: "AI Anomaly Report", category: "Audit", desc: "All flagged unusual transactions in period", lastRun: "May 03, 23:55", schedule: "Daily" },
];

const CATS = ["All", "Financial", "Operations", "Inventory", "Customers", "Audit"];

const RECENT = [
  { name: "P&L · April 2026", date: "May 01, 06:00", size: "412 KB", format: "PDF" },
  { name: "Inventory snapshot · Apr 30", date: "Apr 30, 23:55", size: "82 KB", format: "XLSX" },
  { name: "Sales report · Q1 2026", date: "Apr 03, 09:14", size: "1.2 MB", format: "PDF" },
];

export default function ReportsPage() {
  const [cat, setCat] = useState("All");
  const [period, setPeriod] = useState("This Month");
  const [generating, setGenerating] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const filtered = cat === "All" ? REPORTS : REPORTS.filter((r) => r.category === cat);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/reports/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch report stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate, schedule, and download business reports."
        actions={
          <div className="surface-flat px-3 py-2 flex items-center gap-2 text-sm text-ink-soft">
            <i className="ri-calendar-2-line text-ink-faint" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-transparent outline-none cursor-pointer">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Quarter</option>
              <option>Year to date</option>
              <option>Custom</option>
            </select>
          </div>
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Metric label="Live Revenue" value={stats ? `$${(stats.revenue / 1000).toFixed(1)}k` : "..."} hint="total all-time sales" />
        <Metric label="Net Profit" value={stats ? `$${((stats.revenue - stats.expenses) / 1000).toFixed(1)}k` : "..."} hint="total all-time profit" />
        <Metric label="Stock Weight" value={stats ? `${(stats.stockWeight / 1000).toFixed(2)}kg` : "..."} hint="current inventory" />
        <Metric label="Total Invoices" value={stats ? stats.invoiceCount.toString() : "..."} hint="pending + paid" />
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="surface p-5 lg:col-span-2">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Performance</div>
              <div className="font-display text-lg text-ink">Revenue & net profit · last 6 months</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gold-500" /> Revenue</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sage-500" /> Net profit</span>
            </div>
          </div>
          <MonthlyRevenueProfitChart data={stats?.monthlyTrend} />
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Distribution</div>
          <div className="font-display text-lg text-ink mb-2">Reports run · last 30 days</div>
          <ReportRunsDonut />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-xs">
            {[
              { name: "Financial", value: stats?.txCount || 24, color: "#b8893d" },
              { name: "Operations", value: 12, color: "#dcb35a" },
              { name: "Inventory", value: 8, color: "#c89b62" },
              { name: "Audit", value: 6, color: "#7a8c6b" },
              { name: "Customers", value: 4, color: "#a85944" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-ink-soft">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span>{s.name}</span>
                <span className="ml-auto font-numeric text-ink">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="surface-flat p-1 inline-flex gap-1">
          {CATS.map((c) => (
            <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</FilterChip>
          ))}
        </div>
      </div>

      {/* Reports as table */}
      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Report</th>
              <th>Category</th>
              <th>Description</th>
              <th>Schedule</th>
              <th>Last run</th>
              <th className="text-right">Action</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.name}>
                <td className="text-ink font-medium">{r.name}</td>
                <td><Badge tone="info">{r.category}</Badge></td>
                <td className="text-ink-muted max-w-md">{r.desc}</td>
                <td className="text-ink-soft">{r.schedule}</td>
                <td className="text-ink-muted font-numeric">{r.lastRun}</td>
                <td className="text-right">
                  <button onClick={() => setGenerating(r.name)} className="text-gold-700 hover:underline text-xs font-medium">
                    Generate →
                  </button>
                </td>
                <td className="text-right">
                  <RowActionsMenu actions={[
                    { label: "Generate now", icon: "ri-play-line", onClick: () => setGenerating(r.name) },
                    { label: "View last run", icon: "ri-eye-line", onClick: () => alert(`Open last ${r.name}`) },
                    { label: "Schedule", icon: "ri-time-line", onClick: () => alert(`Schedule ${r.name}`) },
                    { label: "Set recipients", icon: "ri-mail-line", onClick: () => alert("Recipients") },
                    { label: "Pin to dashboard", icon: "ri-pushpin-line", onClick: () => alert("Pinned"), divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent downloads */}
      <div className="mt-6 surface">
        <div className="px-5 pt-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Recent downloads</div>
          <div className="font-display text-lg text-ink">Last generated</div>
        </div>
        <table className="ledger mt-2">
          <thead>
            <tr><th>File</th><th>Generated</th><th>Size</th><th>Format</th><th className="text-right">Action</th><th /></tr>
          </thead>
          <tbody>
            {RECENT.map((r) => (
              <tr key={r.name}>
                <td className="text-ink font-medium">{r.name}</td>
                <td className="text-ink-muted font-numeric">{r.date}</td>
                <td className="text-ink-muted font-numeric">{r.size}</td>
                <td><span className="kbd">{r.format}</span></td>
                <td className="text-right">
                  <button className="text-gold-700 hover:underline text-xs font-medium">
                    <i className="ri-download-line" /> Download
                  </button>
                </td>
                <td className="text-right">
                  <RowActionsMenu actions={[
                    { label: "Download", icon: "ri-download-line", onClick: () => alert(`Download ${r.name}`) },
                    { label: "Email a copy", icon: "ri-mail-send-line", onClick: () => alert("Emailing") },
                    { label: "Regenerate", icon: "ri-refresh-line", onClick: () => alert("Regenerating") },
                    { label: "Delete", icon: "ri-delete-bin-line", onClick: () => alert("Deleted"), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!generating} onClose={() => setGenerating(null)}
        eyebrow="Generate report" title={generating || ""}
        footer={<><button className="btn-secondary" onClick={() => setGenerating(null)}>Cancel</button><button className="btn-primary" onClick={() => setGenerating(null)}>Generate</button></>}>
        <div className="space-y-4">
          <Field label="Period">
            <select className="input" defaultValue={period}>
              <option>Today</option><option>This Week</option><option>This Month</option>
              <option>Quarter</option><option>Year to date</option><option>Custom</option>
            </select>
          </Field>
          <Field label="Format">
            <div className="flex gap-2">
              {["PDF", "XLSX", "CSV"].map((f, i) => (
                <button key={f} type="button" className={`px-3 py-2 rounded-md text-sm border ${i === 0 ? "border-gold-500 bg-gold-50 text-gold-700" : "border-line text-ink-muted"}`}>
                  {f}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Email when ready">
            <input className="input" placeholder="recipient@example.com" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="surface p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
      <div className="font-numeric text-[28px] text-ink mt-2">{value}</div>
      <div className="text-xs text-ink-muted mt-2">{hint}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">{label}</div>
      {children}
    </label>
  );
}
