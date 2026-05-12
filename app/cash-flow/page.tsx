"use client";
import { useState, useEffect } from "react";
import { PageHeader, FilterChip } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { CashFlowWaterfall } from "../components/Charts";
import { PersistenceBanner } from "../components/PersistenceBanner";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";

import { getApiUrl } from "../lib/config";
import { usePersistence } from "../lib/persistence-context";

const SUMMARY = [
  { label: "Gross Revenue", value: 364_900, tone: "ink" },
  { label: "Total COGS", value: 198_300, tone: "ink" },
  { label: "Gross Profit", value: 166_600, tone: "sage" },
  { label: "Operating Expenses", value: 81_000, tone: "ink" },
  { label: "Net Profit", value: 85_600, tone: "sage" },
  { label: "Net Cash Position", value: 178_220, tone: "ink" },
  { label: "Burn Rate", value: 64_900, tone: "terra" },
  { label: "Runway", value: 0, tone: "ink", display: "27.5 mo" },
];

interface Flow { date: string; type: "in" | "out"; category: string; desc: string; amount: number; }

export default function CashFlowPage() {
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [detail, setDetail] = useState<Flow | null>(null);
  const [adding, setAdding] = useState<"in" | "out" | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { backupData, getBackup, setRecovering, setError } = usePersistence();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/transactions'));
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTransactions(data);
        backupData('transactions', data);
        setRecovering(false);
      } else {
        const statusErr = res.status !== 200 ? `Server Error: ${res.status}` : "Invalid data format";
        setError(statusErr);
        const b = getBackup('transactions');
        if (b) {
          setTransactions(b);
          setRecovering(true);
        } else {
          setTransactions([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);

      const b = getBackup('transactions');
      if (b) {
        setTransactions(b);
        setRecovering(true);
      } else {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "Gold Sale Proceeds",
    currency: "USD",
    party: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(formData.amount);
      const finalAmount = adding === "out" ? -amount : amount;
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: finalAmount,
          type: formData.category
        })
      });
      if (res.ok) {
        setAdding(null);
        fetchTransactions();
        setFormData({ ...formData, amount: "", party: "", description: "" });
      }
    } catch (err) {
      alert("Failed to save entry");
    }
  };

  const flows: Flow[] = transactions.map(t => ({
    date: t.date,
    type: (t.amount >= 0 ? "in" : "out") as "in" | "out",
    category: t.type,
    desc: t.party + (t.ref ? ` · ${t.ref}` : ''),
    amount: Math.abs(t.amount)
  })).filter((f) => inRangeFromShortDate(f.date))
     .filter((f) => filter === "all" || f.type === filter);

  const stats = transactions.reduce((acc, t) => {
    if (t.amount > 0) acc.inflow += t.amount;
    else acc.outflow += Math.abs(t.amount);
    return acc;
  }, { inflow: 0, outflow: 0 });

  const dynamicSummary = [
    { label: "Gross Inflow", value: stats.inflow, tone: "sage" },
    { label: "Total Outflow", value: stats.outflow, tone: "terra" },
    { label: "Net Cash Flow", value: stats.inflow - stats.outflow, tone: "ink" },
    { label: "Burn Rate", value: stats.outflow / 4, tone: "terra", display: format(stats.outflow / 4) + " /wk" },
  ];

  return (
    <div>
      <PageHeader
        title="Cash Flow"
        description={`Inflows, outflows, and current liquidity · ${rangeLabel}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-secondary" onClick={() => setAdding("in")}>
              <i className="ri-arrow-down-line" /> Inflow
            </button>
            <button className="btn-primary" onClick={() => setAdding("out")}>
              <i className="ri-arrow-up-line" /> Outflow
            </button>
          </>
        }
      />

      <PersistenceBanner onRetry={fetchTransactions} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {dynamicSummary.map((s) => (
          <div key={s.label} className="surface p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{s.label}</div>
            <div className={`font-numeric text-2xl mt-1 ${
              s.tone === "sage" ? "text-sage-700" : s.tone === "terra" ? "text-terracotta-700" : "text-ink"
            }`}>
              {s.display ?? format(s.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="surface p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Weekly liquidity</div>
            <div className="font-display text-lg text-ink">Inflow vs outflow · last 4 weeks</div>
          </div>
        </div>
        <CashFlowWaterfall />
      </div>

      <div className="surface-flat p-1 inline-flex gap-1 mb-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
        <FilterChip active={filter === "in"} onClick={() => setFilter("in")}>Inflows</FilterChip>
        <FilterChip active={filter === "out"} onClick={() => setFilter("out")}>Outflows</FilterChip>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr><th>Date</th><th>Direction</th><th>Category</th><th>Description</th><th className="text-right">Amount</th><th /></tr>
          </thead>
          <tbody>
            {flows.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-ink-faint py-12">No cash flow entries in this date range.</td></tr>
            ) : flows.map((f, i) => (
              <tr key={i} className="clickable" onClick={() => setDetail(f)}>
                <td className="text-ink-muted">{f.date}</td>
                <td>
                  <span className={`inline-flex items-center gap-1.5 ${f.type === "in" ? "text-sage-700" : "text-rose-700"}`}>
                    <i className={f.type === "in" ? "ri-arrow-down-line" : "ri-arrow-up-line"} />
                    {f.type === "in" ? "Inflow" : "Outflow"}
                  </span>
                </td>
                <td>{f.category}</td>
                <td className="text-ink-soft">{f.desc}</td>
                <td className={`text-right font-numeric ${f.type === "in" ? "text-sage-700" : "text-rose-700"}`}>
                  {f.type === "in" ? "+" : "−"}{format(f.amount)}
                </td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(f) },
                    { label: "Open linked record", icon: "ri-external-link-line", onClick: () => alert(`Open ${f.desc}`) },
                    { label: "Reclassify category", icon: "ri-edit-line", onClick: () => alert("Reclassify") },
                    { label: "Export entry", icon: "ri-download-line", onClick: () => alert("Export"), divider: true },
                    { label: "Reverse entry", icon: "ri-arrow-go-back-line", onClick: () => alert("Reverse"), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CashFlowDetailModal flow={detail} onClose={() => setDetail(null)} format={format} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="cash flow entries" rowCount={flows.length} />

      <Modal open={!!adding} onClose={() => setAdding(null)}
        eyebrow={`Cash ${adding === "in" ? "inflow" : "outflow"}`}
        title={`Record ${adding === "in" ? "inflow" : "outflow"}`}
        footer={<><button className="btn-secondary" onClick={() => setAdding(null)}>Cancel</button><button className="btn-primary" onClick={handleSubmit}>Save entry</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date"><input type="date" className="input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></Field>
          <Field label="Amount"><input className="input" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></Field>
          <Field label="Category">
            <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {adding === "in"
                ? ["Gold Sale Proceeds", "Investor Capital", "Loan Receipt", "Other Income"].map((c) => <option key={c} value={c}>{c}</option>)
                : ["Staff Salaries", "Operational", "Processing", "Logistics & Security", "Loan Repayment", "Tax", "Capital Expenditure"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Currency"><select className="input" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}><option>USD</option><option>TZS</option></select></Field>
          <Field label={adding === "in" ? "Source" : "Payee"} full><input className="input" value={formData.party} onChange={e => setFormData({...formData, party: e.target.value})} /></Field>
          <Field label="Description / reference" full><textarea rows={2} className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></Field>
        </div>
      </Modal>
    </div>
  );
}

function CashFlowDetailModal({ flow, onClose, format }: { flow: Flow | null; onClose: () => void; format: (n: number) => string }) {
  if (!flow) return null;
  const inflow = flow.type === "in";
  const tint = inflow ? "#7a8c6b" : "#b56b4a";

  return (
    <Modal open={!!flow} onClose={onClose} size="lg"
      eyebrow={inflow ? "Cash inflow" : "Cash outflow"} title={flow.category}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-secondary" onClick={() => window.print()}><i className="ri-printer-line" />Print</button>
        <button className="btn-secondary" onClick={() => alert("Reclassification engine initialized. Select new category.")}><i className="ri-edit-line" />Reclassify</button>
        <button className="btn-primary" onClick={() => {
          const txRef = flow.desc.split("·").pop()?.trim();
          if (txRef && txRef.startsWith("TX-")) {
            window.location.href = `/transactions?search=${txRef}`;
          } else {
            alert(`Linked record: ${flow.desc}`);
          }
        }}><i className="ri-external-link-line" />Open linked record</button>
      </>}>
      {/* Hero */}
      <div className="surface-flat p-5 mb-5"
        style={{ background: `linear-gradient(180deg, ${tint}0d 0%, transparent 100%)`, borderColor: `${tint}33` }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${tint}1f`, color: tint }}>
            <i className={`${inflow ? "ri-arrow-down-line" : "ri-arrow-up-line"} text-3xl`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-medium uppercase tracking-wider"
                style={{ color: tint }}>
                {inflow ? "Inflow" : "Outflow"}
              </span>
              <span className="text-ink-faint">·</span>
              <span className="text-xs text-ink-muted">{flow.date}, 2026</span>
            </div>
            <div className="text-base font-medium text-ink truncate">{flow.desc}</div>
            <div className="text-xs text-ink-muted mt-0.5">Category · {flow.category}</div>
          </div>
          <div className="text-right shrink-0">
            <div className={`font-numeric text-[32px] leading-none ${inflow ? "text-sage-700" : "text-rose-700"}`}>
              {inflow ? "+" : "−"}{format(flow.amount)}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">live FX · base USD</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Details</div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
            <DetailRow label="Direction" value={inflow ? "Inflow" : "Outflow"} />
            <DetailRow label="Category" value={flow.category} />
            <DetailRow label="Date" value={`${flow.date}, 2026`} />
            <DetailRow label="Method" value={inflow ? "Bank transfer" : "Bank transfer"} />
            <DetailRow label="Logged by" value="Julius Assey" />
            <DetailRow label="Approved by" value="Julius Assey" />
          </dl>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Linked records</div>
          <div className="space-y-2">
            <Link2 icon="ri-exchange-line" label="Source transaction" value="TX-018340" />
            <Link2 icon="ri-bank-line" label="Bank account" value="CRDB · ****8217" />
            {flow.desc.includes("INV") && (
              <Link2 icon="ri-file-paper-2-line" label="Invoice" value={flow.desc.split("·")[1]?.trim() || "INV-2026-000482"} />
            )}
            <Link2 icon="ri-file-pdf-line" label="Document" value={`receipt-${flow.date.replace(" ", "")}.pdf`} clickable />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Description</div>
        <p className="text-sm text-ink-soft leading-relaxed">{flow.desc}. Auto-linked to the confirmed transaction; appears in P&L and Cash Flow Statement reports for this period.</p>
      </div>

      {/* Running balance impact */}
      <div className="mt-5 surface-flat p-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Impact on cash position</div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-ink-muted">Before</div>
            <div className="font-numeric text-ink mt-0.5">{format(178220 - (inflow ? flow.amount : -flow.amount))}</div>
          </div>
          <div>
            <div className="text-xs text-ink-muted">Change</div>
            <div className={`font-numeric mt-0.5 ${inflow ? "text-sage-700" : "text-rose-700"}`}>
              {inflow ? "+" : "−"}{format(flow.amount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-muted">After</div>
            <div className="font-numeric text-ink mt-0.5">{format(178220)}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function Link2({ icon, label, value, clickable }: { icon: string; label: string; value: string; clickable?: boolean }) {
  return (
    <div className={`surface-flat p-2.5 flex items-center gap-3 ${clickable ? "cursor-pointer hover:border-gold-500" : ""}`}>
      <div className="w-9 h-9 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
        <i className={`${icon} text-base`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
        <div className="text-sm text-ink font-numeric truncate">{value}</div>
      </div>
      {clickable && <i className="ri-arrow-right-up-line text-ink-faint" />}
    </div>
  );
}

function Row({ label, value, full, valueClass }: { label: string; value: React.ReactNode; full?: boolean; valueClass?: string }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">{label}</dt>
      <dd className={`text-ink ${valueClass || ""}`}>{value}</dd>
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
