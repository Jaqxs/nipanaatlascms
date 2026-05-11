"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";
import { getApiUrl } from "../lib/config";
import { usePersistence } from "../lib/persistence-context";

const TABS = ["All", "Draft", "Pending", "Sent", "Paid", "Overdue"];

interface Invoice {
  no: string; customer: string; issued: string; due: string;
  amount: number; status: string;
}

// Initial data is now handled by the backend API
const INITIAL_INVOICES: Invoice[] = [];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchInvoices();
    if (searchParams.get("action") === "new") {
      setCreating(true);
    }
  }, [searchParams]);

  const [confirming, setConfirming] = useState<{ inv: any; action: string } | null>(null);

  const { backupData, getBackup } = usePersistence();
  const [isUsingBackup, setIsUsingBackup] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/invoices'));
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setInvoices(data);
        backupData('invoices', data);
        setIsUsingBackup(false);
      } else {
        const b = getBackup('invoices');
        if (b) {
          setInvoices(b);
          setIsUsingBackup(true);
        } else {
          setInvoices([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      const b = getBackup('invoices');
      if (b) {
        setInvoices(b);
        setIsUsingBackup(true);
      } else {
        setInvoices([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirming) return;
    try {
      const res = await fetch(getApiUrl('/api/invoices'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirming.inv.id, action: confirming.action })
      });
      if (res.ok) {
        setConfirming(null);
        fetchInvoices();
      }
    } catch (err) {
      alert("Error updating invoice");
    }
  };

  const invoiceArray = Array.isArray(invoices) ? invoices : [];

  const filtered = invoiceArray
    .filter((i) => inRangeFromShortDate(i.issued || i.due))
    .filter((i) => tab === "All" || i.status === tab)
    .filter((i) => !search ||
      (i.no || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.customer || "").toLowerCase().includes(search.toLowerCase()));

  const totalReceivable = invoiceArray.filter((i) => ["Sent", "Pending", "Overdue"].includes(i.status))
    .reduce((a, b) => a + b.amount, 0);
  const overdueValue = invoiceArray.filter((i) => i.status === "Overdue").reduce((a, b) => a + b.amount, 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`Customer invoices and payment status · ${rangeLabel}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-secondary" onClick={() => setReminding(true)}>
              <i className="ri-mail-send-line" /> Remind all
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> Create invoice
            </button>
          </>
        }
      />

      {isUsingBackup && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <i className="ri-shield-check-line text-xl text-amber-700" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-900">Operating in Safe Mode (Browser Backup)</div>
            <div className="text-xs text-amber-700">The primary cloud storage is currently offline. You are viewing your last recorded session from this browser.</div>
          </div>
          <button onClick={fetchInvoices} className="ml-auto btn-secondary py-1.5 text-xs">
            <i className="ri-refresh-line" /> Try reconnecting
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total receivable</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{format(totalReceivable)}</div>
          <div className="text-xs text-ink-muted mt-2">Pending + Sent + Overdue</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Overdue</div>
          <div className="font-numeric text-[30px] text-rose-700 mt-2">{format(overdueValue)}</div>
          <div className="text-xs text-ink-muted mt-2">{invoiceArray.filter(i => i.status === "Overdue").length} invoices · longest 14 days</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Days Sales Outstanding</div>
          <div className="font-numeric text-[30px] text-ink mt-2">23.4 <span className="text-base text-ink-muted">days</span></div>
          <div className="text-xs text-sage-700 mt-2">▼ 2.1 vs last month</div>
        </div>
      </div>

      <div className="surface-flat p-3 flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-ink-muted" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Filters</span>
        </div>
        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={tab} onChange={(e) => setTab(e.target.value)} className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            {TABS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {(tab !== "All" || search) && (
          <button onClick={() => { setTab("All"); setSearch(""); }} className="text-xs text-gold-700 hover:underline">
            Clear all
          </button>
        )}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or customer..."
            className="bg-transparent outline-none w-56 placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="surface">
        <table className="ledger">
          <thead>
            <tr>
              <th>Invoice</th><th>Customer</th><th>Issued</th><th>Due</th>
              <th className="text-right">Amount</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-ink-faint py-12">Loading invoices...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-ink-faint py-12">No invoices match your filters.</td></tr>
            ) : filtered.map((i) => (
              <tr key={i.no} className="clickable" onClick={() => setPreview(i)}>
                <td className="font-numeric text-ink">{i.no}</td>
                <td className="text-ink-soft">{i.customer}</td>
                <td className="text-ink-muted">{i.issued}</td>
                <td className="text-ink-muted">{i.due}</td>
                <td className="text-right font-numeric text-ink">{format(i.amount)}</td>
                <td><Badge tone={statusToTone(i.status)}>{i.status}</Badge></td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu actions={[
                    { label: "View invoice", icon: "ri-eye-line", onClick: () => setPreview(i) },
                    { label: "Print / Download", icon: "ri-printer-line", onClick: () => { setPreview(i); setTimeout(() => window.print(), 100); } },
                    { label: "Email to customer", icon: "ri-mail-send-line", onClick: () => alert(`Email ${i.customer}`) },
                    ...(i.status === "Overdue" || i.status === "Sent" || i.status === "pending" ? [
                      { label: "Send reminder", icon: "ri-notification-line", onClick: () => alert("Reminder sent") },
                      { label: "Mark as paid", icon: "ri-check-double-line", onClick: () => setConfirming({ inv: i, action: 'pay' }) },
                    ] : []),
                    { label: "Duplicate", icon: "ri-file-copy-line", onClick: () => alert("Duplicated"), divider: true },
                    { label: "Cancel invoice", icon: "ri-close-circle-line", onClick: () => setConfirming({ inv: i, action: 'void' }), danger: true, divider: true },
                    { label: "Delete", icon: "ri-delete-bin-line", onClick: () => setConfirming({ inv: i, action: 'delete' }), danger: true, divider: true },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} size="xl"
        eyebrow="Invoice preview" title={preview?.no}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPreview(null)}>Close</button>
            <button className="btn-secondary" onClick={() => window.print()}><i className="ri-printer-line" /> Print Invoice</button>
            <button className="btn-primary" onClick={() => window.print()}><i className="ri-download-line" /> Download PDF</button>
          </>
        }>
        {preview && <InvoicePreview invoice={preview} />}
      </Modal>

      {/* New invoice modal */}
      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="Section 7 · New invoice" title="Create invoice"
        footer={<><button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button><button className="btn-primary" onClick={() => (document.getElementById('new-invoice-form') as any)?.requestSubmit()}>Create invoice</button></>}>
        <NewInvoiceForm onSuccess={() => { setCreating(false); fetchInvoices(); }} />
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="invoices" rowCount={filtered.length} />

      {/* Reminders modal */}
      <Modal open={reminding} onClose={() => setReminding(false)}
        eyebrow="Receivables" title="Send overdue reminders"
        footer={<><button className="btn-secondary" onClick={() => setReminding(false)}>Cancel</button><button className="btn-primary" onClick={() => setReminding(false)}>Send to 2 customers</button></>}>
        <p className="text-sm text-ink-muted mb-4">A polite reminder will be emailed to customers with overdue invoices.</p>
        <ul className="space-y-2 text-sm">
          {invoices.filter((i) => i.status === "Overdue").map((i) => (
            <li key={i.no} className="flex items-center gap-3 surface-flat p-3">
              <i className="ri-mail-line text-gold-600" />
              <span className="text-ink">{i.customer}</span>
              <span className="text-ink-muted ml-auto font-numeric">{format(i.amount)}</span>
            </li>
          ))}
        </ul>
      </Modal>

      {/* Action confirmation */}
      <Modal open={!!confirming} onClose={() => setConfirming(null)}
        eyebrow="Confirm Action" title={confirming ? `${confirming.action[0].toUpperCase() + confirming.action.slice(1)} Invoice ${confirming.inv.no}?` : ""}
        footer={<><button className="btn-secondary" onClick={() => setConfirming(null)}>Cancel</button><button className="btn-primary" onClick={handleConfirmAction}>Confirm</button></>}>
        <p className="text-sm text-ink-soft">This will update the invoice status and update the linked ledger entries.</p>
      </Modal>
    </div>
  );
}

function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const { format } = useCurrency();
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/asset/logo.jpeg"
              alt="NIPANA Logo"
              className="w-12 h-12 object-contain rounded-lg"
            />
            <div>
              <div className="font-display text-xl text-ink">NIPANA Atlas</div>
              <div className="text-xs text-ink-muted">Mwanza, Tanzania · TIN 109-204-883</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-ink">Invoice</div>
          <div className="text-sm text-ink-muted font-numeric">{invoice.no}</div>
          <div className="mt-2"><Badge tone={statusToTone(invoice.status)}>{invoice.status}</Badge></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Bill to</div>
          <div className="font-medium text-ink">{invoice.customer}</div>
          <div className="text-sm text-ink-muted">PO Box 1284, Mwanza<br />acct@example.tz</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Issued · Due</div>
          <div className="text-ink">{invoice.issued}, 2026</div>
          <div className="text-ink">{invoice.due}, 2026</div>
        </div>
      </div>

      <table className="ledger">
        <thead>
          <tr><th>Description</th><th>Weight</th><th>Purity</th><th className="text-right">Unit price</th><th className="text-right">Subtotal</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Refined gold — Batch reference</td>
            <td className="font-numeric">240.5 g</td>
            <td>24K</td>
            <td className="text-right font-numeric">$74.05</td>
            <td className="text-right font-numeric text-ink">{format(invoice.amount * 0.97)}</td>
          </tr>
          <tr>
            <td>Assay & certification</td>
            <td>—</td><td>—</td>
            <td className="text-right font-numeric">{format(invoice.amount * 0.03)}</td>
            <td className="text-right font-numeric text-ink">{format(invoice.amount * 0.03)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mt-6">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span className="font-numeric">{format(invoice.amount)}</span></div>
          <div className="flex justify-between text-ink-muted"><span>Tax</span><span className="font-numeric">$0.00</span></div>
          <div className="divider-rule" />
          <div className="flex justify-between text-ink"><span>Total due</span><span className="font-numeric text-lg">{format(invoice.amount)}</span></div>
        </div>
      </div>
    </div>
  );
}

function NewInvoiceForm({ onSuccess }: { onSuccess: () => void }) {
  const [customer, setCustomer] = useState("");
  const [issued, setIssued] = useState(new Date().toISOString().split('T')[0]);
  const [due, setDue] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [lines, setLines] = useState([{ desc: "Refined Gold", weight: "100", karat: "24K", price: "75.50" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = lines.reduce((acc, line) => acc + (parseFloat(line.weight) || 0) * (parseFloat(line.price) || 0), 0);
    
    // Format date as "May 11" for the legacy short-date parser if needed
    const dateObj = new Date(issued);
    const shortIssued = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    try {
      const res = await fetch(getApiUrl('/api/invoices'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          issued: shortIssued,
          due,
          amount: total,
          status: 'Sent'
        })
      });
      if (res.ok) onSuccess();
    } catch (err) {
      alert("Failed to create invoice");
    }
  };

  return (
    <form id="new-invoice-form" onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer"><input className="input" placeholder="Select or create customer" value={customer} onChange={e => setCustomer(e.target.value)} required /></Field>
        <Field label="Customer ID"><input className="input" placeholder="Auto-generated" disabled /></Field>
        <Field label="Issue date"><input type="date" className="input" value={issued} onChange={e => setIssued(e.target.value)} /></Field>
        <Field label="Due date"><input type="date" className="input" value={due} onChange={e => setDue(e.target.value)} /></Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Line items</span>
          <button type="button" onClick={() => setLines([...lines, { desc: "", weight: "", karat: "24", price: "" }])} className="text-xs text-gold-700 hover:underline">+ Add line</button>
        </div>
        <div className="space-y-2">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <input className="input col-span-5" placeholder="Description" value={line.desc} onChange={e => {
                const nl = [...lines]; nl[idx].desc = e.target.value; setLines(nl);
              }} />
              <input className="input col-span-2" placeholder="Weight (g)" value={line.weight} onChange={e => {
                const nl = [...lines]; nl[idx].weight = e.target.value; setLines(nl);
              }} />
              <select className="input col-span-2" value={line.karat} onChange={e => {
                const nl = [...lines]; nl[idx].karat = e.target.value; setLines(nl);
              }}><option>24K</option><option>22K</option><option>18K</option></select>
              <input className="input col-span-2" placeholder="Unit price" value={line.price} onChange={e => {
                const nl = [...lines]; nl[idx].price = e.target.value; setLines(nl);
              }} />
              <button type="button" onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="btn-ghost col-span-1 justify-center">
                <i className="ri-delete-bin-line" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Field label="Notes / payment terms"><textarea rows={2} className="input" /></Field>
    </form>
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
