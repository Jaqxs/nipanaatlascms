"use client";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { useCurrency } from "../lib/currency-context";
import { useDateRange } from "../lib/date-range-context";

const TABS = ["All", "Draft", "Pending", "Sent", "Paid", "Overdue"];

interface Invoice {
  no: string; customer: string; issued: string; due: string;
  amount: number; status: string;
}

const INVOICES: Invoice[] = [
  { no: "INV-2026-000482", customer: "Mwanza Refinery Ltd.", issued: "May 04", due: "May 11", amount: 18_400, status: "Sent" },
  { no: "INV-2026-000481", customer: "Patel Jewellers", issued: "May 03", due: "May 12", amount: 9_650, status: "Paid" },
  { no: "INV-2026-000480", customer: "Sukuma Gold Co.", issued: "May 03", due: "May 10", amount: 4_840, status: "Sent" },
  { no: "INV-2026-000479", customer: "Lake Zone Traders", issued: "May 02", due: "May 09", amount: 6_200, status: "Overdue" },
  { no: "INV-2026-000478", customer: "Coastal Buyers", issued: "May 02", due: "May 16", amount: 11_300, status: "Pending" },
  { no: "INV-2026-000477", customer: "Bulyanhulu Buyers", issued: "May 01", due: "May 08", amount: 3_210, status: "Overdue" },
  { no: "INV-2026-000476", customer: "Mara Refining", issued: "May 01", due: "May 14", amount: 7_800, status: "Draft" },
  { no: "INV-2026-000475", customer: "Geita Cooperative", issued: "Apr 30", due: "May 14", amount: 22_800, status: "Paid" },
  { no: "INV-2026-000474", customer: "Patel Jewellers", issued: "Apr 30", due: "May 14", amount: 5_420, status: "Sent" },
  { no: "INV-2026-000473", customer: "Mwanza Refinery Ltd.", issued: "Apr 29", due: "May 13", amount: 14_900, status: "Paid" },
  { no: "INV-2026-000472", customer: "Northern Crafts", issued: "Apr 29", due: "May 13", amount: 2_840, status: "Sent" },
  { no: "INV-2026-000471", customer: "Lake Zone Traders", issued: "Apr 28", due: "May 05", amount: 8_120, status: "Overdue" },
  { no: "INV-2026-000470", customer: "Sukuma Gold Co.", issued: "Apr 27", due: "May 11", amount: 3_980, status: "Paid" },
  { no: "INV-2026-000469", customer: "Coastal Buyers", issued: "Apr 26", due: "May 10", amount: 6_700, status: "Paid" },
  { no: "INV-2026-000468", customer: "Bulyanhulu Buyers", issued: "Apr 25", due: "May 09", amount: 4_300, status: "Pending" },
  { no: "INV-2026-000467", customer: "Patel Jewellers", issued: "Apr 25", due: "May 09", amount: 12_600, status: "Paid" },
  { no: "INV-2026-000466", customer: "Mara Refining", issued: "Apr 24", due: "May 08", amount: 8_900, status: "Paid" },
  { no: "INV-2026-000465", customer: "Northern Crafts", issued: "Apr 23", due: "May 07", amount: 1_540, status: "Sent" },
];

export default function InvoicesPage() {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { format } = useCurrency();
  const { inRangeFromShortDate, label: rangeLabel } = useDateRange();

  const filtered = INVOICES
    .filter((i) => inRangeFromShortDate(i.issued))
    .filter((i) => tab === "All" || i.status === tab)
    .filter((i) => !search ||
      i.no.toLowerCase().includes(search.toLowerCase()) ||
      i.customer.toLowerCase().includes(search.toLowerCase()));

  const totalReceivable = INVOICES.filter((i) => ["Sent", "Pending", "Overdue"].includes(i.status))
    .reduce((a, b) => a + b.amount, 0);
  const overdue = INVOICES.filter((i) => i.status === "Overdue").reduce((a, b) => a + b.amount, 0);

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
              <i className="ri-mail-send-line" /> Send reminders
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-add-line" /> New invoice
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total receivable</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{format(totalReceivable)}</div>
          <div className="text-xs text-ink-muted mt-2">Pending + Sent + Overdue</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Overdue</div>
          <div className="font-numeric text-[30px] text-rose-700 mt-2">{format(overdue)}</div>
          <div className="text-xs text-ink-muted mt-2">2 invoices · longest 14 days</div>
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
            {filtered.length === 0 ? (
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
                    { label: "Download PDF", icon: "ri-download-line", onClick: () => alert(`Download ${i.no}`) },
                    { label: "Email to customer", icon: "ri-mail-send-line", onClick: () => alert(`Email ${i.customer}`) },
                    ...(i.status === "Overdue" || i.status === "Sent" ? [
                      { label: "Send reminder", icon: "ri-notification-line", onClick: () => alert("Reminder sent") },
                      { label: "Mark as paid", icon: "ri-check-double-line", onClick: () => alert("Marked paid") },
                    ] : []),
                    { label: "Duplicate", icon: "ri-file-copy-line", onClick: () => alert("Duplicated"), divider: true },
                    { label: "Cancel invoice", icon: "ri-close-circle-line", onClick: () => alert("Cancelled"), danger: true, divider: true },
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
            <button className="btn-secondary"><i className="ri-mail-send-line" />Email to customer</button>
            <button className="btn-primary"><i className="ri-download-line" />Download PDF</button>
          </>
        }>
        {preview && <InvoicePreview invoice={preview} />}
      </Modal>

      {/* New invoice modal */}
      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow="Section 7 · New invoice" title="Create invoice"
        footer={<><button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button><button className="btn-primary" onClick={() => setCreating(false)}>Save as draft</button></>}>
        <NewInvoiceForm />
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="invoices" rowCount={filtered.length} />

      {/* Reminders modal */}
      <Modal open={reminding} onClose={() => setReminding(false)}
        eyebrow="Receivables" title="Send overdue reminders"
        footer={<><button className="btn-secondary" onClick={() => setReminding(false)}>Cancel</button><button className="btn-primary" onClick={() => setReminding(false)}>Send to 2 customers</button></>}>
        <p className="text-sm text-ink-muted mb-4">A polite reminder will be emailed to customers with overdue invoices.</p>
        <ul className="space-y-2 text-sm">
          {INVOICES.filter((i) => i.status === "Overdue").map((i) => (
            <li key={i.no} className="flex items-center gap-3 surface-flat p-3">
              <i className="ri-mail-line text-gold-600" />
              <span className="text-ink">{i.customer}</span>
              <span className="text-ink-muted ml-auto font-numeric">{format(i.amount)}</span>
            </li>
          ))}
        </ul>
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
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "#b8893d" }}>
              <i className="ri-coin-line text-white text-2xl" />
            </div>
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

function NewInvoiceForm() {
  const [lines, setLines] = useState([{ desc: "", weight: "", karat: "24", price: "" }]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer"><input className="input" placeholder="Select or create customer" /></Field>
        <Field label="Customer ID"><input className="input" placeholder="Auto-generated" disabled /></Field>
        <Field label="Issue date"><input type="date" className="input" defaultValue="2026-05-04" /></Field>
        <Field label="Due date"><input type="date" className="input" defaultValue="2026-05-11" /></Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Line items</span>
          <button onClick={() => setLines([...lines, { desc: "", weight: "", karat: "24", price: "" }])} className="text-xs text-gold-700 hover:underline">+ Add line</button>
        </div>
        <div className="space-y-2">
          {lines.map((_, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <input className="input col-span-5" placeholder="Description" />
              <input className="input col-span-2" placeholder="Weight (g)" />
              <select className="input col-span-2"><option>24K</option><option>22K</option><option>18K</option></select>
              <input className="input col-span-2" placeholder="Unit price" />
              <button onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="btn-ghost col-span-1 justify-center">
                <i className="ri-delete-bin-line" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Field label="Notes / payment terms"><textarea rows={2} className="input" /></Field>
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
