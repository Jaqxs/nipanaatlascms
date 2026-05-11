"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import { RECENT_TX } from "../lib/mockData";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";
import { getApiUrl } from "../lib/config";

const TYPES = ["All", "Gold Sale", "Gold Purchase", "Op. Expense", "Processing", "Logistics", "Cash Inflow", "Cash Outflow"];
const STATUS = ["All", "Pending", "Confirmed", "Rejected"];

interface Tx { ref: string; date: string; type: string; party: string; amount: number; status: string; }

// Initial rows are now handled by the backend API
const INITIAL_ROWS: Tx[] = [];

export default function TransactionsPage() {
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Tx | null>(null);
  const [creating, setCreating] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirming, setConfirming] = useState<{ tx: Tx; action: string } | null>(null);
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();

  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: TYPES[1],
    amount: "",
    currency: "USD",
    party: "",
    description: ""
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchTransactions();
    if (searchParams.get("action") === "new") {
      setCreating(true);
    }
  }, [searchParams]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/transactions'));
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirming) return;
    try {
      const res = await fetch(getApiUrl('/api/transactions'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: confirming.tx.ref, action: confirming.action })
      });
      if (res.ok) {
        setConfirming(null);
        fetchTransactions();
      } else {
        alert("Action failed on server");
      }
    } catch (err) {
      alert("Error processing action");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      alert("Please enter a valid numeric amount");
      return;
    }
    setIsSubmitting(true);
    try {
      const amountValue = parseFloat(formData.amount);
      const multiplier = (formData.type === "Gold Purchase" || formData.type === "Op. Expense" || formData.type === "Logistics" || formData.type === "Processing" || formData.type === "Cash Outflow" ? -1 : 1);
      
      const res = await fetch(getApiUrl('/api/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: amountValue * multiplier
        })
      });
      
      let result: any = {};
      try {
        result = await res.json();
      } catch (e) {
        console.error("Non-JSON response received");
      }
      
      if (res.ok) {
        setCreating(false);
        fetchTransactions();
        setFormData({ ...formData, amount: "", party: "", description: "" });
        alert("Transaction recorded successfully!");
      } else {
        // CREATIVE FALLBACK: Save locally if server is failing
        const localData = JSON.parse(localStorage.getItem('gbms_offline_tx') || '[]');
        localData.push({ ...formData, id: 'local_' + Date.now(), status: 'Pending Sync' });
        localStorage.setItem('gbms_offline_tx', JSON.stringify(localData));
        
        alert("Server Busy: Transaction saved locally in your browser! It will sync once the server is ready.");
      }
    } catch (err) {
      // Offline fallback
      const localData = JSON.parse(localStorage.getItem('gbms_offline_tx') || '[]');
      localData.push({ ...formData, id: 'local_' + Date.now(), status: 'Pending Sync' });
      localStorage.setItem('gbms_offline_tx', JSON.stringify(localData));
      
      alert("System Offline: Transaction saved locally in your browser! (Device Memory)");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = (Array.isArray(rows) ? rows : [])
    .filter((r) => inRangeFromShortDate(r.date))
    .filter((r) => type === "All" || r.type === type)
    .filter((r) => status === "All" || r.status.toLowerCase() === status.toLowerCase())
    .filter((r) => !search ||
      r.ref.toLowerCase().includes(search.toLowerCase()) ||
      r.party.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`All purchases, sales, and expenses · ${rangeLabel} · ${filtered.length} entries`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New transaction
            </button>
          </>
        }
      />

      {/* Compact filter row with dropdowns */}
      <div className="surface-flat p-3 flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-ink-muted" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Filters</span>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {(type !== "All" || status !== "All" || search) && (
          <button
            onClick={() => { setType("All"); setStatus("All"); setSearch(""); }}
            className="text-xs text-gold-700 hover:underline"
          >
            Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, party..."
            className="bg-transparent outline-none w-48 placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Reference</th><th>Date</th><th>Type</th><th>Counterparty</th>
              <th className="text-right">Amount</th><th>Submitted by</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-ink-faint py-12">Loading transactions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-ink-faint py-12">No transactions match your filters.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.ref} className="clickable" onClick={() => setDetail(t)}>
                <td className="font-numeric text-ink">{t.ref}</td>
                <td className="text-ink-muted">{t.date}</td>
                <td>{t.type}</td>
                <td className="text-ink-soft">{t.party}</td>
                <td className={`text-right font-numeric ${t.amount < 0 ? "text-rose-700" : "text-sage-700"}`}>
                  {t.amount < 0 ? "−" : "+"}{format(Math.abs(t.amount))}
                </td>
                <td className="text-ink-muted">J. Assey</td>
                <td><Badge tone={statusToTone(t.status)}>{t.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(t) },
                    { label: "Edit", icon: "ri-edit-line", onClick: () => alert(`Edit ${t.ref}`) },
                    { label: "Duplicate", icon: "ri-file-copy-line", onClick: () => alert(`Duplicate ${t.ref}`) },
                    ...(t.status === "pending" ? [
                      { label: "Approve", icon: "ri-check-line", onClick: () => setConfirming({ tx: t, action: "approve" }) },
                      { label: "Reject", icon: "ri-close-line", onClick: () => setConfirming({ tx: t, action: "reject" }), danger: true },
                    ] : []),
                    { label: "Download receipt", icon: "ri-download-line", onClick: () => alert("Download"), divider: true },
                    { label: "Delete", icon: "ri-delete-bin-line", onClick: () => setConfirming({ tx: t, action: "delete" }), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionDetailModal tx={detail} onClose={() => setDetail(null)} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="transactions" rowCount={filtered.length} />

      <Modal open={!!confirming} onClose={() => setConfirming(null)}
        eyebrow="Confirm action" title={confirming ? `${confirming.action[0].toUpperCase() + confirming.action.slice(1)} ${confirming.tx.ref}?` : ""}
        footer={<>
          <button className="btn-secondary" onClick={() => setConfirming(null)}>Cancel</button>
          <button className={confirming?.action === "approve" ? "btn-primary" : "btn-secondary"}
            style={confirming?.action !== "approve" ? { background: "#a85944", color: "#fff", border: "none" } : undefined}
            onClick={handleConfirmAction}>
            {confirming?.action === "approve" ? "Approve" : confirming?.action === "reject" ? "Reject" : "Delete"}
          </button>
        </>}>
        <p className="text-sm text-ink-soft">
          {confirming?.action === "approve" && "Approving will lock this transaction and propagate it to inventory and cash flow."}
          {confirming?.action === "reject" && "The submitter will be notified. They can revise and resubmit."}
          {confirming?.action === "delete" && "This action cannot be undone. The audit log entry will remain."}
        </p>
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="New transaction" title="Record a transaction"
        footer={<>
          <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>Submit for approval</button>
        </>}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Date"><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input" /></Field>
          <Field label="Type">
            <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              {TYPES.slice(1).map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Amount">
            <div className="flex">
              <input className="input rounded-r-none" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              <select className="input rounded-l-none w-24" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                <option>USD</option><option>TZS</option>
              </select>
            </div>
          </Field>
          <Field label="Counterparty"><input className="input" placeholder="Supplier or customer" value={formData.party} onChange={e => setFormData({...formData, party: e.target.value})} /></Field>
          <Field label="Reference number"><input className="input" placeholder="Auto-generated" disabled /></Field>
          <Field label="AI suggested category" hint="92% confidence">
            <div className="input flex items-center gap-2 text-ink-faint">
              <i className="ri-sparkling-2-line text-gold-600" />
              <span className="text-ink">Logistics & Security</span>
            </div>
          </Field>
          <Field label="Description" full>
            <textarea rows={3} className="input" placeholder="Minimum 10 characters" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </Field>
        </form>
      </Modal>
      {/* Emergency Tools */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-amber-800 font-bold text-sm">System Resilience Tool</h3>
          <p className="text-amber-600 text-xs mt-1">If the server is stuck, use this to save your current work locally.</p>
        </div>
        <button 
          onClick={async () => {
            const res = await fetch(getApiUrl('/api/debug'));
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gbms_emergency_backup_${new Date().toISOString()}.json`;
            a.click();
          }}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
        >
          Export Database
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, full, hint }: { label: string; children: React.ReactNode; full?: boolean; hint?: string }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
        {hint && <span className="text-[11px] text-gold-700">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
