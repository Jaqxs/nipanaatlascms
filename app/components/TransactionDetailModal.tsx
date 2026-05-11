"use client";
import { Modal } from "./Modal";
import { Badge, statusToTone } from "./Badge";
import { useCurrency } from "../lib/currency-context";

export interface TransactionLike {
  ref: string;
  date: string;
  type: string;
  party: string;
  amount: number;
  status: string;
}

const TYPE_META: Record<string, { icon: string; tint: string }> = {
  "Gold Sale":     { icon: "ri-arrow-up-circle-line",   tint: "#7a8c6b" },
  "Gold Purchase": { icon: "ri-arrow-down-circle-line", tint: "#b56b4a" },
  "Op. Expense":   { icon: "ri-coin-line",              tint: "#b56b4a" },
  "Processing":    { icon: "ri-fire-line",              tint: "#b56b4a" },
  "Logistics":     { icon: "ri-truck-line",             tint: "#b56b4a" },
  "Cash Inflow":   { icon: "ri-arrow-down-line",        tint: "#7a8c6b" },
  "Cash Outflow":  { icon: "ri-arrow-up-line",          tint: "#b56b4a" },
};

export function TransactionDetailModal({ tx, onClose, onApprove, onReject }: { 
  tx: TransactionLike | null; 
  onClose: () => void;
  onApprove?: (tx: TransactionLike) => void;
  onReject?: (tx: TransactionLike) => void;
}) {
  const { format } = useCurrency();
  if (!tx) return null;

  const meta = TYPE_META[tx.type] || { icon: "ri-exchange-line", tint: "#b8893d" };
  const negative = tx.amount < 0;

  const timeline = [
    { label: "Submitted", time: "May 04, 08:52", actor: "Maria Rweyemamu", role: "Sales & Ops", done: true },
    { label: "Reviewed",  time: "May 04, 09:08", actor: "Julius Assey",     role: "Administrator", done: tx.status !== "pending" },
    { label: tx.status === "rejected" ? "Rejected" : "Confirmed", time: "May 04, 09:14", actor: "Julius Assey", role: "Administrator", done: tx.status === "confirmed" || tx.status === "rejected" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={!!tx} onClose={onClose} size="lg"
      eyebrow="Transaction"
      title={tx.ref}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-secondary" onClick={handlePrint}><i className="ri-printer-line" />Print</button>
        <button className="btn-primary" onClick={handlePrint}><i className="ri-file-text-line" />Receipt</button>
        {tx.status === "pending" && (
          <div className="flex gap-2 ml-auto">
            <button className="btn-secondary text-rose-700 border-rose-200 hover:bg-rose-50" onClick={() => onReject?.(tx)}>
              <i className="ri-close-line" /> Reject
            </button>
            <button className="btn-primary" onClick={() => onApprove?.(tx)}>
              <i className="ri-check-line" /> Approve
            </button>
          </div>
        )}
      </>}>
      {/* Hero */}
      <div className="surface-flat p-5 mb-5"
        style={{ background: `linear-gradient(180deg, ${meta.tint}0d 0%, transparent 100%)`, borderColor: `${meta.tint}33` }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${meta.tint}1f`, color: meta.tint }}>
            <i className={`${meta.icon} text-3xl`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">{tx.type}</span>
              <span className="text-ink-faint">·</span>
              <span className="text-xs text-ink-muted">{tx.date}, 2026</span>
              <Badge tone={statusToTone(tx.status)}>{tx.status}</Badge>
            </div>
            <div className="text-base font-medium text-ink truncate">{tx.party}</div>
          </div>
          <div className="text-right shrink-0">
            <div className={`font-numeric text-[32px] leading-none ${negative ? "text-rose-700" : "text-sage-700"}`}>
              {negative ? "−" : "+"}{format(Math.abs(tx.amount))}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">live FX · base USD</div>
          </div>
        </div>
      </div>

      {/* Body — stacked sections */}
      <div className="space-y-5">
        {/* Workflow timeline */}
        <Section title="Workflow">
          <div className="grid grid-cols-3 gap-2">
            {timeline.map((step, i) => (
              <div key={step.label} className="surface-flat p-3 relative">
                {i < timeline.length - 1 && (
                  <div className="absolute top-1/2 -right-1 w-2 h-px bg-line hidden md:block" />
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step.done ? "bg-gold-500 text-white" : "bg-paper-200 text-ink-faint"
                  }`}>
                    <i className={step.done ? "ri-check-line" : "ri-time-line"} />
                  </div>
                  <span className={`text-sm font-medium ${step.done ? "text-ink" : "text-ink-faint"}`}>
                    {step.label}
                  </span>
                </div>
                {step.done ? (
                  <>
                    <div className="text-xs text-ink-muted">{step.time}</div>
                    <div className="text-xs text-ink-soft mt-0.5">{step.actor}</div>
                    <div className="text-[10px] text-ink-faint uppercase tracking-wider mt-0.5">{step.role}</div>
                  </>
                ) : (
                  <div className="text-xs text-ink-faint">Awaiting</div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Details + linked records side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="Details">
            <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
              <Row label="Reference" value={tx.ref} mono />
              <Row label="Type" value={tx.type} />
              <Row label="Counterparty" value={tx.party} />
              <Row label="Currency" value="USD (base)" />
              <Row label="Submitted by" value="Maria Rweyemamu" />
              <Row label="Decision" value={tx.status === "pending" ? "—" : "Julius Assey"} />
            </dl>
          </Section>

          <Section title="Linked records">
            <div className="space-y-2">
              <LinkedCard icon="ri-archive-line" label="Inventory batch" value="BATCH-20260503-0042" />
              <LinkedCard icon="ri-water-flash-line" label="Cash flow" value="CF-2026-001284" />
              <LinkedCard icon="ri-file-paper-2-line" label="Invoice" value={negative ? "—" : "INV-2026-000482"} />
              <LinkedCard icon="ri-file-pdf-line" label="Receipt" value={`receipt-${tx.ref}.pdf`} clickable />
            </div>
          </Section>
        </div>

        <Section title="Description">
          <p className="text-sm text-ink-soft leading-relaxed">
            Field-entry submitted from a mobile device with attached scan of the supplier receipt.
            AI-suggested category was accepted by the submitter at 92% confidence.
          </p>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">{label}</dt>
      <dd className={`text-ink ${mono ? "font-numeric" : ""}`}>{value}</dd>
    </div>
  );
}

function LinkedCard({ icon, label, value, clickable }: { icon: string; label: string; value: string; clickable?: boolean }) {
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
