"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { ExportModal } from "../components/ExportModal";
import { CUSTOMERS, SUPPLIERS, Customer, Supplier, fmtWeight } from "../lib/mockData";
import { useCurrency } from "../lib/currency-context";
import { getApiUrl } from "../lib/config";

type Tab = "customers" | "suppliers";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<(Customer | Supplier)[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    status: "active"
  });

  const [tab, setTab] = useState<Tab>("customers");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Customer | Supplier | null>(null);
  const [detail, setDetail] = useState<Customer | Supplier | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { format } = useCurrency();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/contacts'));
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/contacts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: tab === "customers" ? "customer" : "supplier"
        })
      });
      if (res.ok) {
        setCreating(false);
        fetchContacts();
        setFormData({ name: "", email: "", phone: "", location: "", status: "active" });
      }
    } catch (err) {
      alert("Failed to register contact");
    }
  };

  const contactsArray = Array.isArray(contacts) ? contacts : [];

  const customers = (contactsArray.filter(c => (c as any).type === 'customer') as Customer[])
    .filter((c) => statusFilter === "All" || c.status === statusFilter.toLowerCase())
    .filter((c) => !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()));

  const suppliers = (contactsArray.filter(c => (c as any).type === 'supplier') as Supplier[])
    .filter((s) => statusFilter === "All" || s.status === statusFilter.toLowerCase())
    .filter((s) => !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()));

  const totalReceivable = customers.reduce((a, b) => a + b.outstanding, 0);
  const totalPayable = suppliers.reduce((a, b) => a + b.outstanding, 0);
  const totalCustomerSpend = customers.reduce((a, b) => a + b.totalPurchases, 0);
  const totalSupplied_g = suppliers.reduce((a, b) => a + (b as any).totalSupplied_g || 0, 0);

  const filteredCount = tab === "customers" ? customers.length : suppliers.length;
  const resourceLabel = tab === "customers" ? "customers" : "suppliers";

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Customers and suppliers — assigned a unique ID for every transaction."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setExportOpen(true)}>
              <i className="ri-download-line" /> Export
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <i className="ri-user-add-line" /> Register {tab === "customers" ? "buyer" : "seller"}
            </button>
          </>
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Customers" value={customers.length.toString()} hint={`${customers.filter(c => c.status === "active").length} active`} icon="ri-user-3-line" />
        <Stat label="Suppliers" value={suppliers.length.toString()} hint={`${suppliers.filter(s => s.status === "active").length} active`} icon="ri-truck-line" />
        <Stat label="Customer receivable" value={format(totalReceivable)} hint="outstanding balance" icon="ri-arrow-right-down-line" tone="rose" />
        <Stat label="Supplier payable" value={format(totalPayable)} hint="awaiting payment" icon="ri-arrow-right-up-line" tone="rose" />
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="surface-flat p-1 inline-flex gap-1">
          <button
            onClick={() => setTab("customers")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${tab === "customers" ? "bg-gold-100 text-gold-700" : "text-ink-muted hover:bg-paper-100"}`}
          >
            <i className="ri-user-3-line mr-1.5" />
            Customers <span className="text-ink-faint ml-1">({customers.length})</span>
          </button>
          <button
            onClick={() => setTab("suppliers")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${tab === "suppliers" ? "bg-gold-100 text-gold-700" : "text-ink-muted hover:bg-paper-100"}`}
          >
            <i className="ri-truck-line mr-1.5" />
            Suppliers <span className="text-ink-faint ml-1">({suppliers.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 surface-flat px-3 py-1.5 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-ink-soft font-medium">
            <option>All</option><option>Active</option><option>Inactive</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm surface-flat">
          <i className="ri-search-line text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${resourceLabel}...`}
            className="bg-transparent outline-none w-56 placeholder:text-ink-faint"
          />
        </div>
      </div>

      {/* Customers table */}
      {tab === "customers" && (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Contact</th><th>Location</th>
                <th className="text-right">Total purchases</th>
                <th className="text-right">Outstanding</th>
                <th>Status</th><th>Last tx</th><th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">No customers match your filters.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => setDetail(c)}>
                  <td className="font-numeric text-ink">{c.id}</td>
                  <td className="text-ink font-medium">{c.name}</td>
                  <td className="text-ink-muted">
                    <div className="text-sm">{c.email}</div>
                    <div className="text-xs">{c.phone}</div>
                  </td>
                  <td className="text-ink-muted">{c.location}</td>
                  <td className="text-right font-numeric text-ink">{format(c.totalPurchases)}</td>
                  <td className={`text-right font-numeric ${c.outstanding > 0 ? "text-rose-700" : "text-ink-faint"}`}>
                    {c.outstanding > 0 ? format(c.outstanding) : "—"}
                  </td>
                  <td><Badge tone={c.status === "active" ? "sage" : "terracotta"} dot>{c.status}</Badge></td>
                  <td className="text-ink-muted">{c.lastTx}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(c) },
                      { label: "Edit", icon: "ri-edit-line", onClick: () => setEditing(c) },
                      { label: "Send invoice", icon: "ri-file-paper-2-line", onClick: () => alert(`New invoice for ${c.name}`) },
                      { label: "Send statement", icon: "ri-mail-send-line", onClick: () => alert("Statement sent") },
                      ...(c.outstanding > 0 ? [
                        { label: "Send reminder", icon: "ri-notification-line", onClick: () => alert("Reminder sent") },
                      ] : []),
                      { 
                        label: c.status === "active" ? "Deactivate" : "Activate", 
                        icon: c.status === "active" ? "ri-pause-line" : "ri-play-line", 
                        onClick: async () => {
                          const res = await fetch(getApiUrl('/api/contacts'), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: c.id, action: 'status' })
                          });
                          if (res.ok) fetchContacts();
                        }, 
                        divider: true 
                      },
                      { 
                        label: "Delete", 
                        icon: "ri-delete-bin-line", 
                        onClick: async () => {
                          if (confirm(`Delete ${c.name}?`)) {
                            const res = await fetch(getApiUrl('/api/contacts'), {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: c.id, action: 'delete' })
                            });
                            if (res.ok) fetchContacts();
                          }
                        }, 
                        danger: true, 
                        divider: true 
                      },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suppliers table */}
      {tab === "suppliers" && (
        <div className="surface">
          <table className="ledger">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Contact</th><th>Location</th>
                <th className="text-right">Total supplied</th>
                <th className="text-right">Outstanding</th>
                <th>Status</th><th>Last delivery</th><th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">Loading suppliers...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-ink-faint py-12">No suppliers match your filters.</td></tr>
              ) : suppliers.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => setDetail(s)}>
                  <td className="font-numeric text-ink">{s.id}</td>
                  <td className="text-ink font-medium">{s.name}</td>
                  <td className="text-ink-muted">
                    <div className="text-sm">{s.email}</div>
                    <div className="text-xs">{s.contact}</div>
                  </td>
                  <td className="text-ink-muted">{s.location}</td>
                  <td className="text-right font-numeric text-ink">{fmtWeight(s.totalSupplied_g)}</td>
                  <td className={`text-right font-numeric ${s.outstanding > 0 ? "text-rose-700" : "text-ink-faint"}`}>
                    {s.outstanding > 0 ? format(s.outstanding) : "—"}
                  </td>
                  <td><Badge tone={s.status === "active" ? "sage" : "terracotta"} dot>{s.status}</Badge></td>
                  <td className="text-ink-muted">{s.lastDelivery}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={[
                      { label: "View detail", icon: "ri-eye-line", onClick: () => setDetail(s) },
                      { label: "Edit", icon: "ri-edit-line", onClick: () => setEditing(s) },
                      { label: "Record purchase", icon: "ri-arrow-down-circle-line", onClick: () => alert(`New purchase from ${s.name}`) },
                      { label: "Record payment", icon: "ri-money-dollar-circle-line", onClick: () => alert("Payment recorded") },
                      { 
                        label: s.status === "active" ? "Deactivate" : "Activate", 
                        icon: s.status === "active" ? "ri-pause-line" : "ri-play-line", 
                        onClick: async () => {
                          const res = await fetch(getApiUrl('/api/contacts'), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: s.id, action: 'status' })
                          });
                          if (res.ok) fetchContacts();
                        }, 
                        divider: true 
                      },
                      { 
                        label: "Delete", 
                        icon: "ri-delete-bin-line", 
                        onClick: async () => {
                          if (confirm(`Delete ${s.name}?`)) {
                            const res = await fetch(getApiUrl('/api/contacts'), {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: s.id, action: 'delete' })
                            });
                            if (res.ok) fetchContacts();
                          }
                        }, 
                        danger: true, 
                        divider: true 
                      },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aggregates footer */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Customer lifetime value</div>
          <div className="font-numeric text-ink mt-0.5">{format(totalCustomerSpend)}</div>
        </div>
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Total gold sourced</div>
          <div className="font-numeric text-ink mt-0.5">{fmtWeight(totalSupplied_g)}</div>
        </div>
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Avg customer spend</div>
          <div className="font-numeric text-ink mt-0.5">{customers.length ? format(totalCustomerSpend / customers.length) : format(0)}</div>
        </div>
        <div className="surface-flat p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Avg supplier delivery</div>
          <div className="font-numeric text-ink mt-0.5">{suppliers.length ? fmtWeight(totalSupplied_g / suppliers.length) : "0g"}</div>
        </div>
      </div>

      {/* Detail modal */}
      <ContactDetailModal contact={detail} onClose={() => setDetail(null)} format={format} />

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} size="lg"
        eyebrow={tab === "customers" ? "New customer (buyer)" : "New supplier (seller)"}
        title={`Register a ${tab === "customers" ? "buyer" : "seller"}`}
        footer={<>
          <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>
            <i className="ri-check-line" /> Save & assign ID
          </button>
        </>}>
        <p className="text-xs text-ink-muted mb-4">
          A unique ID will be auto-generated:
          <span className="font-numeric text-ink-soft ml-1">{tab === "customers" ? "CUST-2026-NNNNNN" : "SUPP-2026-NNNNNN"}</span>
        </p>
        <ContactForm kind={tab} formData={formData} setFormData={setFormData} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} size="lg"
        eyebrow={editing && "id" in editing && editing.id.startsWith("CUST") ? "Edit customer" : "Edit supplier"}
        title={editing?.name}
        footer={<>
          <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => setEditing(null)}>Save changes</button>
        </>}>
        {editing && <ContactForm kind={"totalPurchases" in editing ? "customers" : "suppliers"} initial={editing} />}
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} resource={resourceLabel} rowCount={filteredCount} />
    </div>
  );
}

function ContactDetailModal({
  contact, onClose, format,
}: { contact: Customer | Supplier | null; onClose: () => void; format: (n: number) => string }) {
  if (!contact) return null;
  const isCustomer = "totalPurchases" in contact;
  const tint = isCustomer ? "#7a8c6b" : "#b8893d";

  return (
    <Modal open onClose={onClose} size="lg"
      eyebrow={isCustomer ? "Customer" : "Supplier"}
      title={contact.name}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-secondary"><i className="ri-edit-line" />Edit</button>
        {isCustomer ? (
          <button className="btn-primary"><i className="ri-file-paper-2-line" />Create invoice</button>
        ) : (
          <button className="btn-primary"><i className="ri-arrow-down-circle-line" />Record purchase</button>
        )}
      </>}>
      {/* Hero */}
      <div className="surface-flat p-5 mb-5"
        style={{ background: `linear-gradient(180deg, ${tint}0d 0%, transparent 100%)`, borderColor: `${tint}33` }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${tint}1f`, color: tint }}>
            <i className={`${isCustomer ? "ri-user-3-line" : "ri-truck-line"} text-3xl`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-numeric text-sm text-ink-soft">{contact.id}</span>
              <Badge tone={contact.status === "active" ? "sage" : "terracotta"} dot>{contact.status}</Badge>
            </div>
            <div className="text-base font-medium text-ink">{contact.name}</div>
            <div className="text-xs text-ink-muted mt-1">{contact.location}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {isCustomer ? "Lifetime spend" : "Total supplied"}
            </div>
            <div className="font-numeric text-2xl text-ink leading-none mt-1">
              {isCustomer
                ? format((contact as Customer).totalPurchases)
                : fmtWeight((contact as Supplier).totalSupplied_g)}
            </div>
            {(contact.outstanding > 0) && (
              <div className="text-[11px] text-rose-700 mt-1">{format(contact.outstanding)} outstanding</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Contact">
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
            <Row label="Email" value={isCustomer ? (contact as Customer).email : (contact as Supplier).email} />
            <Row label="Phone" value={isCustomer ? (contact as Customer).phone : (contact as Supplier).contact} />
            <Row label="Location" value={contact.location} />
            <Row label="Joined" value={isCustomer ? (contact as Customer).joined : (contact as Supplier).joined} />
            <Row label={isCustomer ? "Last transaction" : "Last delivery"} value={isCustomer ? (contact as Customer).lastTx : (contact as Supplier).lastDelivery} />
            <Row label="Status" value={<Badge tone={contact.status === "active" ? "sage" : "terracotta"} dot>{contact.status}</Badge>} />
          </dl>
        </Section>

        <Section title="Activity summary">
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
            {isCustomer ? (
              <>
                <Row label="Total purchases" value={format((contact as Customer).totalPurchases)} mono />
                <Row label="Outstanding" value={format(contact.outstanding)} mono valueClass={contact.outstanding > 0 ? "text-rose-700" : "text-ink-faint"} />
                <Row label="Customer rank" value="#1 of 8" />
                <Row label="Avg invoice" value={format((contact as Customer).totalPurchases / 12)} mono />
              </>
            ) : (
              <>
                <Row label="Gold supplied" value={fmtWeight((contact as Supplier).totalSupplied_g)} mono />
                <Row label="Total paid" value={format((contact as Supplier).totalPaid)} mono />
                <Row label="Outstanding" value={format(contact.outstanding)} mono valueClass={contact.outstanding > 0 ? "text-rose-700" : "text-ink-faint"} />
                <Row label="Supplier rank" value="#2 of 6" />
              </>
            )}
          </dl>
        </Section>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Recent {isCustomer ? "invoices" : "deliveries"}</div>
        <div className="surface-flat overflow-hidden">
          <table className="ledger">
            <thead>
              <tr>
                <th>{isCustomer ? "Invoice" : "Reference"}</th>
                <th>Date</th>
                <th>{isCustomer ? "Items" : "Weight"}</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(isCustomer ? [
                { ref: "INV-2026-000482", date: "May 04", q: "240.5g · 24K", a: 18_400 },
                { ref: "INV-2026-000473", date: "Apr 29", q: "190g · 22K", a: 14_900 },
                { ref: "INV-2026-000465", date: "Apr 23", q: "20g · 24K", a: 1_540 },
              ] : [
                { ref: "TX-018340", date: "May 04", q: "1240.5g · Raw", a: 22_800 },
                { ref: "TX-018289", date: "Apr 18", q: "880g · Raw", a: 15_700 },
                { ref: "TX-018254", date: "Apr 02", q: "640g · 22K", a: 11_400 },
              ]).map((r, i) => (
                <tr key={i}>
                  <td className="font-numeric text-ink">{r.ref}</td>
                  <td className="text-ink-muted">{r.date}</td>
                  <td className="text-ink-soft">{r.q}</td>
                  <td className="text-right font-numeric text-ink">{format(r.a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

function ContactForm({ kind, initial, formData, setFormData }: { kind: Tab; initial?: Customer | Supplier, formData?: any, setFormData?: any }) {
  const isCustomer = kind === "customers";
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label={`${isCustomer ? "Customer" : "Supplier"} ID`}>
        <input className="input" placeholder={isCustomer ? "Auto-generated CUST-2026-NNNNNN" : "Auto-generated SUPP-2026-NNNNNN"} disabled defaultValue={initial?.id} />
      </Field>
      <Field label="Status">
        <select className="input" value={formData?.status || initial?.status || "active"} onChange={e => setFormData && setFormData({...formData, status: e.target.value})}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Field>
      <Field label={isCustomer ? "Customer / business name" : "Supplier / cooperative name"} full>
        <input className="input" placeholder="Mwanza Refinery Ltd." value={formData?.name || initial?.name || ""} onChange={e => setFormData && setFormData({...formData, name: e.target.value})} required />
      </Field>
      <Field label="Email">
        <input className="input" type="email" placeholder="contact@example.tz" value={formData?.email || (isCustomer ? (initial as Customer)?.email : (initial as Supplier)?.email) || ""} onChange={e => setFormData && setFormData({...formData, email: e.target.value})} />
      </Field>
      <Field label="Phone">
        <input className="input" placeholder="+255 ..." value={formData?.phone || (isCustomer ? (initial as Customer)?.phone : (initial as Supplier)?.contact) || ""} onChange={e => setFormData && setFormData({...formData, phone: e.target.value})} />
      </Field>
      <Field label="Location" full>
        <input className="input" placeholder="Region · City" value={formData?.location || initial?.location || ""} onChange={e => setFormData && setFormData({...formData, location: e.target.value})} />
      </Field>
      {isCustomer ? (
        <>
          <Field label="Tax / TIN">
            <input className="input" placeholder="109-204-883" />
          </Field>
          <Field label="Payment terms">
            <select className="input">
              <option>Net 7</option><option>Net 14</option><option>Net 30</option><option>On receipt</option>
            </select>
          </Field>
        </>
      ) : (
        <>
          <Field label="License number">
            <input className="input" placeholder="ML-XXXXX-2024" />
          </Field>
          <Field label="Default purity">
            <select className="input">
              <option>Raw</option><option>24K</option><option>22K</option><option>18K</option>
            </select>
          </Field>
        </>
      )}
      <Field label="Notes" full>
        <textarea rows={2} className="input" placeholder="Optional internal notes" />
      </Field>
    </div>
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

function Row({ label, value, mono, valueClass }: { label: string; value: React.ReactNode; mono?: boolean; valueClass?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">{label}</dt>
      <dd className={`text-ink ${mono ? "font-numeric" : ""} ${valueClass || ""}`}>{value}</dd>
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

function Stat({ label, value, hint, icon, tone = "ink" }: { label: string; value: string; hint: string; icon: string; tone?: "ink" | "rose" | "sage" }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
        <i className={`${icon} text-gold-600 text-base opacity-70`} />
      </div>
      <div className={`font-numeric text-[26px] leading-none ${tone === "rose" ? "text-rose-700" : tone === "sage" ? "text-sage-700" : "text-ink"}`}>{value}</div>
      <div className="text-xs text-ink-muted mt-2">{hint}</div>
    </div>
  );
}
