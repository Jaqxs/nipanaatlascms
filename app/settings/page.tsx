"use client";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { GOLD_PRICE } from "../lib/mockData";

const TABS = [
  { id: "general", label: "General", icon: "ri-settings-3-line" },
  { id: "price", label: "Gold Price", icon: "ri-coin-line" },
  { id: "users", label: "Users", icon: "ri-team-line" },
  { id: "notifications", label: "Notifications", icon: "ri-notification-3-line" },
  { id: "backup", label: "Backup", icon: "ri-database-2-line" },
  { id: "ai", label: "AI Configuration", icon: "ri-sparkling-2-line" },
];

const PRICE_HISTORY = [
  { date: "May 04 09:14", price: 74.05, source: "Manual · J. Assey", change: +0.42 },
  { date: "May 03 09:08", price: 73.63, source: "Manual · J. Assey", change: -0.17 },
  { date: "May 02 09:11", price: 73.80, source: "Manual · J. Assey", change: +0.20 },
  { date: "May 01 09:02", price: 73.60, source: "Manual · J. Assey", change: +0.40 },
  { date: "Apr 30 09:05", price: 73.20, source: "Manual · J. Assey", change: -0.10 },
];

interface User { name: string; email: string; role: string; lastLogin: string; active: boolean; }

const USERS: User[] = [
  { name: "Julius Assey", email: "j.assey@nipana.tz", role: "admin", lastLogin: "Today 09:14", active: true },
  { name: "Maria Rweyemamu", email: "m.rwey@nipana.tz", role: "sales_ops", lastLogin: "Today 08:52", active: true },
  { name: "Patrick Mhando", email: "p.mhando@nipana.tz", role: "sales_ops", lastLogin: "Yesterday 17:48", active: true },
  { name: "Salma Khamis", email: "s.khamis@nipana.tz", role: "sales_ops", lastLogin: "Apr 28", active: false },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("price");
  const [inviting, setInviting] = useState(false);
  const [managing, setManaging] = useState<User | null>(null);

  return (
    <div>
      <PageHeader title="Settings" description="Pricing, users, notifications, backups, and AI." />

      <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-6">
        <div className="surface-flat p-2 h-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                tab === t.id ? "bg-gold-100 text-gold-700" : "text-ink-muted hover:bg-paper-100"
              }`}
            >
              <i className={`${t.icon} text-base`} />
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === "price" && (
            <div className="space-y-6">
              <div className="surface p-6" style={{ background: "#fdf6e4" }}>
                <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700">Active Gold Price</div>
                <div className="flex items-baseline gap-3 mt-2">
                  <div className="font-numeric text-[44px] text-ink leading-none">${GOLD_PRICE.current.toFixed(2)}</div>
                  <div className="text-ink-muted">per gram · USD</div>
                </div>
                <div className="text-xs text-gold-700 mt-2">Set on {GOLD_PRICE.asOf} · {GOLD_PRICE.source}</div>

                <div className="divider-rule my-5" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="New price /g"><input className="input" placeholder="74.50" /></Field>
                  <Field label="Currency"><select className="input"><option>USD</option><option>TZS</option></select></Field>
                  <Field label="Source / reference"><input className="input" placeholder="LBMA · Reuters · Manual" /></Field>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button className="btn-primary">Save new price</button>
                  <label className="flex items-center gap-2 text-sm text-ink-muted">
                    <input type="checkbox" /> Use API mode (refresh every 15 min)
                  </label>
                </div>
              </div>

              <div className="surface">
                <div className="px-5 pt-5">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Price history</div>
                  <div className="font-display text-lg text-ink">Audit log · never deleted</div>
                </div>
                <table className="ledger mt-2">
                  <thead><tr><th>Set at</th><th>Price /g</th><th>Source</th><th>Δ vs prior</th></tr></thead>
                  <tbody>
                    {PRICE_HISTORY.map((p, i) => (
                      <tr key={i}>
                        <td className="text-ink-muted">{p.date}</td>
                        <td className="font-numeric text-ink">${p.price.toFixed(2)}</td>
                        <td className="text-ink-soft">{p.source}</td>
                        <td className={`font-numeric ${p.change >= 0 ? "text-sage-700" : "text-rose-700"}`}>
                          {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="surface">
              <div className="px-5 pt-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Team members</div>
                  <div className="font-display text-lg text-ink">{USERS.length} accounts</div>
                </div>
                <button className="btn-primary" onClick={() => setInviting(true)}>
                  <i className="ri-add-line" />Invite user
                </button>
              </div>
              <table className="ledger mt-2">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last login</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {USERS.map((u) => (
                    <tr key={u.email}>
                      <td className="font-medium text-ink">{u.name}</td>
                      <td className="text-ink-soft">{u.email}</td>
                      <td>
                        <Badge tone={u.role === "admin" ? "amber" : "info"}>
                          {u.role === "admin" ? "Admin" : "Sales & Ops"}
                        </Badge>
                      </td>
                      <td className="text-ink-muted">{u.lastLogin}</td>
                      <td>{u.active ? <Badge tone="sage" dot>Active</Badge> : <Badge tone="terracotta" dot>Inactive</Badge>}</td>
                      <td className="text-right"><button onClick={() => setManaging(u)} className="text-xs text-gold-700 hover:underline">Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "general" && (
            <div className="surface p-6">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">General</div>
              <div className="font-display text-lg text-ink mb-5">Company profile</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company name"><input className="input" defaultValue="NIPANA Atlas" /></Field>
                <Field label="Trade registration"><input className="input" defaultValue="109-204-883" /></Field>
                <Field label="Address"><input className="input" defaultValue="Mwanza, Tanzania" /></Field>
                <Field label="Contact email"><input className="input" defaultValue="ops@nipana.tz" /></Field>
                <Field label="Base currency"><select className="input"><option>USD</option><option>TZS</option></select></Field>
                <Field label="Fiscal year start"><select className="input"><option>January</option><option>July</option></select></Field>
              </div>
              <div className="mt-6"><button className="btn-primary">Save changes</button></div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="surface p-6">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Notifications</div>
              <div className="font-display text-lg text-ink mb-5">Delivery preferences</div>
              <div className="space-y-3">
                {[
                  { l: "Daily AI briefing email", t: "06:00 every day" },
                  { l: "Overdue invoice alerts", t: "When invoice is 7+ days past due" },
                  { l: "Low stock alerts", t: "When grade falls below threshold" },
                  { l: "Weekly P&L summary", t: "Monday 08:00" },
                  { l: "Anomaly flags", t: "Real-time" },
                ].map((n) => (
                  <label key={n.l} className="flex items-center gap-3 surface-flat p-3 cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <div className="flex-1">
                      <div className="text-sm text-ink font-medium">{n.l}</div>
                      <div className="text-xs text-ink-muted">{n.t}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === "backup" && (
            <div className="surface p-6">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Backup & recovery</div>
              <div className="font-display text-lg text-ink mb-5">Automated retention</div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Row label="Daily backup" value="Active · 30-day retention" />
                <Row label="Last backup" value="May 04, 03:00 UTC" />
                <Row label="Restore point" value="May 04, 03:00 UTC" />
                <Row label="Cross-region copy" value="us-east-1 → eu-west-1" />
                <Row label="RPO" value="5 minutes (point-in-time)" />
                <Row label="Last restore test" value="Apr 12, 2026 · Passed" />
              </dl>
              <div className="mt-6 flex gap-3">
                <button className="btn-secondary"><i className="ri-history-line" />View backup log</button>
                <button className="btn-secondary"><i className="ri-download-line" />Download latest</button>
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div className="surface p-6">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">AI Configuration</div>
              <div className="font-display text-lg text-ink mb-5">Advisor settings</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Anomaly threshold (σ)"><input className="input" defaultValue="2.5" /></Field>
                <Field label="Briefing delivery time"><input type="time" className="input" defaultValue="06:00" /></Field>
                <Field label="Categorisation model"><select className="input"><option>TF-IDF + Logistic Regression</option><option>OpenAI Embeddings</option></select></Field>
                <Field label="Summary model"><select className="input"><option>GPT-4o</option><option>Llama 3 (local)</option></select></Field>
                <Field label="Training data scope" full>
                  <select className="input"><option>Last 90 days · This company only</option><option>Last 12 months · This company only</option></select>
                </Field>
              </div>
              <div className="mt-6"><button className="btn-primary">Save AI settings</button></div>
            </div>
          )}
        </div>
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)}
        eyebrow="Users" title="Invite a team member"
        footer={<><button className="btn-secondary" onClick={() => setInviting(false)}>Cancel</button><button className="btn-primary" onClick={() => setInviting(false)}>Send invitation</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name"><input className="input" placeholder="First Last" /></Field>
          <Field label="Email"><input className="input" type="email" placeholder="user@nipana.tz" /></Field>
          <Field label="Role"><select className="input"><option>Sales & Ops</option><option>Admin</option></select></Field>
          <Field label="Send onboarding"><select className="input"><option>Email link</option><option>SMS</option></select></Field>
        </div>
      </Modal>

      <Modal open={!!managing} onClose={() => setManaging(null)}
        eyebrow="Manage user" title={managing?.name}
        footer={<>
          <button className="btn-secondary" onClick={() => setManaging(null)}>Cancel</button>
          {managing?.active
            ? <button className="btn-secondary"><i className="ri-pause-line" />Deactivate</button>
            : <button className="btn-secondary"><i className="ri-play-line" />Reactivate</button>}
          <button className="btn-primary">Save changes</button>
        </>}>
        {managing && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name"><input className="input" defaultValue={managing.name} /></Field>
            <Field label="Email"><input className="input" defaultValue={managing.email} /></Field>
            <Field label="Role">
              <select className="input" defaultValue={managing.role}>
                <option value="sales_ops">Sales & Ops</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Status"><div className="input flex items-center"><Badge tone={managing.active ? "sage" : "terracotta"} dot>{managing.active ? "Active" : "Inactive"}</Badge></div></Field>
            <Field label="Last login" full><div className="text-sm text-ink">{managing.lastLogin}</div></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">{label}</dt><dd className="text-ink">{value}</dd></div>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">{label}</div>
      {children}
    </label>
  );
}
