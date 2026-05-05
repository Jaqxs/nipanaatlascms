"use client";
import { useState } from "react";
import { PageHeader, FilterChip } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { InventoryAreaChart, StockByPurityChart } from "../components/Charts";
import { INVENTORY_BATCHES, fmtWeight, GOLD_PRICE } from "../lib/mockData";
import { useCurrency } from "../lib/currency-context";

type Batch = typeof INVENTORY_BATCHES[number];

const MOVEMENTS = [
  { t: "May 04 09:12", b: "BATCH-20260503-0042", m: "Purchase In", before: 0, d: +1240.5, after: 1240.5, by: "J. Assey", l: "TX-018340" },
  { t: "May 03 17:48", b: "BATCH-20260502-0041", m: "Sale Out", before: 962.0, d: -82.0, after: 880.0, by: "M. Rweyemamu", l: "INV-2026-000482" },
  { t: "May 03 11:02", b: "BATCH-20260430-0039", m: "Processing In", before: 658.5, d: 0, after: 658.5, by: "System", l: "Refining #224" },
  { t: "May 02 14:33", b: "BATCH-20260501-0040", m: "Adjustment", before: 615.0, d: -2.8, after: 612.2, by: "Admin · J. Assey", l: "Reconciliation" },
];

export default function InventoryPage() {
  const [tab, setTab] = useState<"batches" | "movements">("batches");
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<Batch | null>(null);
  const [purity, setPurity] = useState("All");
  const [location, setLocation] = useState("All");
  const [confirm, setConfirm] = useState<{ batch: Batch; action: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { format, formatUSD } = useCurrency();

  const totalWeight = INVENTORY_BATCHES.reduce((a, b) => a + b.weight, 0);
  const fineWeight = INVENTORY_BATCHES.reduce((a, b) => a + b.fine, 0);
  const totalValue = INVENTORY_BATCHES.reduce((a, b) => a + b.value, 0);

  const PURITIES = ["All", "24K", "22K", "18K", "Raw"];
  const LOCATIONS = ["All", "Vault A", "Vault B", "Processing", "In Transit"];

  const batches = INVENTORY_BATCHES
    .filter((b) => purity === "All" || (purity === "Raw" ? !b.karat : `${b.karat}K` === purity))
    .filter((b) => location === "All" || b.location === location);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Batches across vaults and transit, auto-valued at the active gold price."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <i className="ri-add-line" /> Add batch
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total stock weight</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{fmtWeight(totalWeight)}</div>
          <div className="text-xs text-ink-muted mt-2">{INVENTORY_BATCHES.length} active batches</div>
        </div>
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Total fine weight</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{fmtWeight(fineWeight)}</div>
          <div className="text-xs text-ink-muted mt-2">Pure gold equivalent</div>
        </div>
        <div className="surface p-5" style={{ background: "#fdf6e4" }}>
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Stock value</div>
          <div className="font-numeric text-[30px] text-ink mt-2">{format(totalValue)}</div>
          <div className="text-xs text-gold-700 mt-2">@ {formatUSD(GOLD_PRICE.current)}/g (USD) · weighted avg {format(totalValue / fineWeight)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">By purity</div>
          <div className="font-display text-lg text-ink mb-2">Composition</div>
          <StockByPurityChart />
        </div>
        <div className="lg:col-span-2 surface p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">24-hour stock level</div>
          <div className="font-display text-lg text-ink mb-2">Movement over time</div>
          <InventoryAreaChart />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="surface-flat p-1 inline-flex gap-1">
          <FilterChip active={tab === "batches"} onClick={() => setTab("batches")}>Batches</FilterChip>
          <FilterChip active={tab === "movements"} onClick={() => setTab("movements")}>Movement log</FilterChip>
        </div>
        {tab === "batches" && (
          <>
            <div className="surface-flat p-1 inline-flex gap-1">
              {PURITIES.map((p) => <FilterChip key={p} active={purity === p} onClick={() => setPurity(p)}>{p}</FilterChip>)}
            </div>
            <div className="surface-flat p-1 inline-flex gap-1">
              {LOCATIONS.map((l) => <FilterChip key={l} active={location === l} onClick={() => setLocation(l)}>{l}</FilterChip>)}
            </div>
          </>
        )}
      </div>

      {tab === "batches" && (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr><th>Batch</th><th>Weight</th><th>Karat</th><th>Fine wt.</th><th>Source</th><th>Location</th><th>Status</th><th className="text-right">Value</th><th /></tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">No batches match these filters.</td></tr>
              ) : batches.map((b) => (
                <tr key={b.batch} className="clickable" onClick={() => setDetail(b)}>
                  <td className="font-numeric text-ink">{b.batch}</td>
                  <td className="font-numeric">{b.weight.toFixed(2)} g</td>
                  <td>{b.karat ? `${b.karat}K` : "Raw"}</td>
                  <td className="font-numeric">{b.fine.toFixed(2)} g</td>
                  <td className="text-ink-soft">{b.source}</td>
                  <td className="text-ink-muted">{b.location}</td>
                  <td><Badge tone={statusToTone(b.status)}>{b.status}</Badge></td>
                  <td className="text-right font-numeric text-ink">{b.value ? format(b.value) : "—"}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(b) },
                      { label: "Adjust weight", icon: "ri-edit-line", onClick: () => setConfirm({ batch: b, action: "adjust" }) },
                      { label: "Move location", icon: "ri-arrow-right-line", onClick: () => setConfirm({ batch: b, action: "move" }) },
                      { label: "Send to refinery", icon: "ri-fire-line", onClick: () => setConfirm({ batch: b, action: "refine" }) },
                      { label: "Print certificate", icon: "ri-printer-line", onClick: () => alert("Printing"), divider: true },
                      { label: "Archive batch", icon: "ri-archive-line", onClick: () => setConfirm({ batch: b, action: "archive" }), danger: true, divider: true },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "movements" && (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr><th>Time</th><th>Batch</th><th>Movement</th><th>Before</th><th>Δ</th><th>After</th><th>By</th><th>Linked</th><th /></tr>
            </thead>
            <tbody>
              {MOVEMENTS.map((r, i) => (
                <tr key={i}>
                  <td className="text-ink-muted">{r.t}</td>
                  <td className="font-numeric text-ink">{r.b}</td>
                  <td>{r.m}</td>
                  <td className="font-numeric text-ink-muted">{r.before.toFixed(1)}</td>
                  <td className={`font-numeric ${r.d < 0 ? "text-rose-700" : r.d > 0 ? "text-sage-700" : "text-ink-muted"}`}>
                    {r.d > 0 ? "+" : ""}{r.d.toFixed(1)} g
                  </td>
                  <td className="font-numeric text-ink">{r.after.toFixed(1)}</td>
                  <td className="text-ink-soft">{r.by}</td>
                  <td className="text-ink-muted">{r.l}</td>
                  <td className="text-right">
                    <RowActionsMenu actions={[
                      { label: "View linked record", icon: "ri-external-link-line", onClick: () => alert(`Open ${r.l}`) },
                      { label: "Open batch", icon: "ri-archive-line", onClick: () => alert(`Open ${r.b}`) },
                      { label: "Export entry", icon: "ri-download-line", onClick: () => alert("Export") },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add batch modal */}
      <Modal open={adding} onClose={() => setAdding(false)}
        eyebrow="Inventory" title="Add new batch"
        footer={<><button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button><button className="btn-primary" onClick={() => setAdding(false)}>Save batch</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Batch ID"><input className="input" placeholder="Auto-generated BATCH-20260504-NNNN" disabled /></Field>
          <Field label="Entry date"><input type="date" className="input" defaultValue="2026-05-04" /></Field>
          <Field label="Weight (grams)"><input className="input" placeholder="0.000" /></Field>
          <Field label="Purity">
            <select className="input">
              <option>24K</option><option>22K</option><option>21K</option><option>18K</option>
              <option>14K</option><option>9K</option><option>Raw</option>
            </select>
          </Field>
          <Field label="Location">
            <select className="input">
              <option>Vault A</option><option>Vault B</option><option>Processing</option><option>In Transit</option>
            </select>
          </Field>
          <Field label="Acquisition cost"><input className="input" placeholder="0.00" /></Field>
          <Field label="Source — purchase transaction" full>
            <input className="input" placeholder="TX-NNNNNN reference" />
          </Field>
          <Field label="Notes / quality" full>
            <textarea rows={2} className="input" placeholder="Optional assay notes" />
          </Field>
        </div>
      </Modal>

      {/* Batch detail — redesigned */}
      <BatchDetailModal batch={detail} onClose={() => setDetail(null)} format={format} formatUSD={formatUSD} />

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource="inventory batches" rowCount={batches.length} />

      {/* Action confirmation */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)}
        eyebrow={confirm?.action} title={confirm ? `${confirm.action[0].toUpperCase() + confirm.action.slice(1)} ${confirm.batch.batch}?` : ""}
        footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn-primary" onClick={() => setConfirm(null)}>Confirm</button></>}>
        <p className="text-sm text-ink-soft">A movement log entry will be created with full attribution.</p>
      </Modal>
    </div>
  );
}

function BatchDetailModal({ batch, onClose, format, formatUSD }: {
  batch: Batch | null;
  onClose: () => void;
  format: (n: number) => string;
  formatUSD: (n: number) => string;
}) {
  if (!batch) return null;
  const finePct = batch.weight > 0 ? (batch.fine / batch.weight) * 100 : 0;
  const alloyWeight = batch.weight - batch.fine;
  const movements = MOVEMENTS.filter((m) => m.b === batch.batch);

  return (
    <Modal open={!!batch} onClose={onClose} size="xl"
      eyebrow="Batch" title={batch.batch}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-secondary"><i className="ri-printer-line" />Print certificate</button>
        <button className="btn-secondary"><i className="ri-arrow-right-line" />Move location</button>
        <button className="btn-primary"><i className="ri-edit-line" />Adjust</button>
      </>}>
      {/* Hero */}
      <div className="surface-flat p-5 mb-5 flex items-start gap-5">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#fdf6e4" }}>
          <i className="ri-archive-2-line text-3xl text-gold-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge tone={statusToTone(batch.status)}>{batch.status}</Badge>
            <span className="text-xs text-ink-muted">{batch.location}</span>
            <span className="text-ink-faint">·</span>
            <span className="text-xs text-ink-muted">From {batch.source}</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="font-numeric text-[32px] text-ink leading-none">{batch.weight.toFixed(2)}<span className="text-base text-ink-muted ml-1">g gross</span></div>
            <div className="font-numeric text-lg text-ink-soft">{batch.fine.toFixed(2)}<span className="text-xs text-ink-muted ml-1">g fine</span></div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Current value</div>
          <div className="font-numeric text-[24px] text-ink leading-none mt-1">{batch.value ? format(batch.value) : "—"}</div>
          <div className="text-[11px] text-ink-muted mt-1">@ {formatUSD(74.05)}/g spot</div>
        </div>
      </div>

      {/* Composition + body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="surface-flat p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-3">Composition</div>
          {/* horizontal stacked bar */}
          <div className="h-3 rounded-full overflow-hidden bg-paper-200 flex">
            <div className="h-full" style={{ width: `${finePct}%`, background: "#b8893d" }} />
            <div className="h-full" style={{ width: `${100 - finePct}%`, background: "#dcb35a", opacity: 0.5 }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-500" />
                <span className="text-ink-muted text-xs">Fine gold</span>
              </div>
              <div className="font-numeric text-ink mt-0.5">{batch.fine.toFixed(2)} g</div>
              <div className="text-[11px] text-ink-faint">{finePct.toFixed(1)}%</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#dcb35a", opacity: 0.5 }} />
                <span className="text-ink-muted text-xs">Alloy</span>
              </div>
              <div className="font-numeric text-ink mt-0.5">{alloyWeight.toFixed(2)} g</div>
              <div className="text-[11px] text-ink-faint">{(100 - finePct).toFixed(1)}%</div>
            </div>
          </div>
          <div className="divider-rule my-4" />
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Acquisition</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">Cost</span><span className="font-numeric text-ink">{batch.value ? format(batch.value * 0.94) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Per gram</span><span className="font-numeric text-ink">{batch.value && batch.fine ? format((batch.value * 0.94) / batch.fine) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Mark-to-market</span><span className="font-numeric text-sage-700">+6.4%</span></div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Properties</div>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <Row label="Purity" value={batch.karat ? `${batch.karat}K` : "Raw"} />
              <Row label="Location" value={batch.location} />
              <Row label="Status" value={<Badge tone={statusToTone(batch.status)}>{batch.status}</Badge>} />
              <Row label="Source" value={batch.source} />
              <Row label="Entered" value="May 04, 2026" />
              <Row label="Last updated" value="May 04, 09:14" />
            </dl>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Movement timeline</div>
            <div className="surface-flat overflow-hidden">
              <table className="ledger">
                <thead>
                  <tr><th>When</th><th>Type</th><th>Δ</th><th>By</th><th>Linked</th></tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-ink-faint py-6">No movements recorded.</td></tr>
                  ) : movements.map((m, i) => (
                    <tr key={i}>
                      <td className="text-ink-muted">{m.t}</td>
                      <td>{m.m}</td>
                      <td className={`font-numeric ${m.d < 0 ? "text-rose-700" : m.d > 0 ? "text-sage-700" : "text-ink-muted"}`}>
                        {m.d > 0 ? "+" : ""}{m.d.toFixed(1)} g
                      </td>
                      <td className="text-ink-soft">{m.by}</td>
                      <td className="text-ink-muted">{m.l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Linked records</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <LinkedCard icon="ri-exchange-line" label="Source transaction" value="TX-018340" />
              <LinkedCard icon="ri-fire-line" label="Refining batch" value="Refining #224" />
              <LinkedCard icon="ri-file-pdf-line" label="Assay certificate" value="ASSAY-0042.pdf" clickable />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function LinkedCard({ icon, label, value, clickable }: { icon: string; label: string; value: string; clickable?: boolean }) {
  return (
    <div className={`surface-flat p-3 flex items-center gap-3 ${clickable ? "cursor-pointer hover:border-gold-500" : ""}`}>
      <div className="w-9 h-9 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
        <i className={`${icon} text-lg`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
        <div className="text-sm text-ink font-numeric truncate">{value}</div>
      </div>
      {clickable && <i className="ri-arrow-right-up-line text-ink-faint" />}
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
