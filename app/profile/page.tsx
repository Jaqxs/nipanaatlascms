"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import { useAuth } from "../lib/auth-context";
import { useRole } from "../lib/role-context";
import { useCurrency, CURRENCIES, CurrencyCode } from "../lib/currency-context";

const COMMON_TABS = [
  { id: "account", label: "Account", icon: "ri-user-3-line" },
  { id: "security", label: "Security", icon: "ri-shield-keyhole-line" },
  { id: "notifications", label: "Notifications", icon: "ri-notification-3-line" },
  { id: "preferences", label: "Preferences", icon: "ri-palette-line" },
  { id: "activity", label: "Activity", icon: "ri-history-line" },
];

const OPS_EXTRA = { id: "field", label: "Field tools", icon: "ri-toolbox-line" };
const ADMIN_EXTRA = { id: "admin-shortcuts", label: "Admin shortcuts", icon: "ri-shield-star-line" };

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { isAdmin } = useRole();
  const { code, setCode } = useCurrency();
  const [tab, setTab] = useState("account");
  const [pwOpen, setPwOpen] = useState(false);
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newImage, setNewImage] = useState(user?.image || "");

  const TABS = [
    ...COMMON_TABS,
    isAdmin ? ADMIN_EXTRA : OPS_EXTRA,
  ];

  const initials = (user?.name || "JA").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleSave = () => {
    updateUser({ name: newName, image: newImage });
    alert("Profile updated successfully!");
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your account, security, and personal preferences."
      />

      {/* Identity card */}
      <div className="surface p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          {user?.image ? (
            <img src={user.image} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display text-3xl shrink-0"
              style={{ background: "#b8893d" }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-[24px] text-ink leading-tight">{user?.name}</h2>
              <Badge tone={isAdmin ? "amber" : "info"}>
                {isAdmin ? "Administrator" : "Sales & Ops"}
              </Badge>
              <Badge tone="sage" dot>Active</Badge>
            </div>
            <div className="text-sm text-ink-muted mt-1">{user?.email}</div>
            <div className="flex items-center gap-4 mt-3 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><i className="ri-map-pin-line" /> Mwanza, Tanzania</span>
              <span className="inline-flex items-center gap-1.5"><i className="ri-time-line" /> Last login Today 09:14</span>
              <span className="inline-flex items-center gap-1.5"><i className="ri-calendar-line" /> Member since Jan 2024</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setPwOpen(true)} className="btn-secondary">
              <i className="ri-lock-password-line" /> Change password
            </button>
            <button onClick={logout} className="btn-ghost text-rose-700 hover:bg-rose-100/40 justify-center">
              <i className="ri-logout-circle-r-line" /> Sign out
            </button>
          </div>
        </div>
      </div>

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
          {/* ACCOUNT */}
          {tab === "account" && (
            <div className="surface p-6">
              <SectionHeader eyebrow="Account" title="Personal information" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full name" full><input className="input" value={newName} onChange={e => setNewName(e.target.value)} /></Field>
                <Field label="Profile Image URL" full>
                  <div className="flex gap-2">
                    <input className="input flex-1" value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="https://unsplash.com/..." />
                    <button className="btn-secondary" onClick={() => setNewImage("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&h=120&auto=format&fit=crop")}>Random</button>
                  </div>
                </Field>
                <Field label="Email"><input className="input" defaultValue={user?.email} disabled /></Field>
                <Field label="Phone"><input className="input" defaultValue="+255 754 123 456" /></Field>
                <Field label="Role">
                  <div className="input flex items-center">
                    <Badge tone={isAdmin ? "amber" : "info"}>{isAdmin ? "Administrator" : "Sales & Ops"}</Badge>
                  </div>
                </Field>
                <Field label="Title / position"><input className="input" defaultValue={isAdmin ? "Chief Operations" : "Field Officer"} /></Field>
                <Field label="Location"><input className="input" defaultValue="Mwanza · HQ" /></Field>
                <Field label="Bio" full>
                  <textarea rows={2} className="input" defaultValue={isAdmin ? "Oversees daily operations across the Lake Zone." : "Records purchases, sales, and inventory movements in the field."} />
                </Field>
              </div>
              <div className="mt-6 flex gap-3"><button className="btn-primary" onClick={handleSave}>Save changes</button></div>
            </div>
          )}

          {/* SECURITY */}
          {tab === "security" && (
            <div className="space-y-6">
              <div className="surface p-6">
                <SectionHeader eyebrow="Security" title="Sign-in protection" />
                <div className="space-y-3">
                  <Toggle
                    label="Two-factor authentication"
                    desc={isAdmin ? "Required for administrators. Use a TOTP app." : "Recommended. Adds a one-time code at sign-in."}
                    enabled={isAdmin}
                    onClick={() => setTwoFAOpen(true)}
                    cta={isAdmin ? "Manage" : "Enable"}
                  />
                  <Toggle
                    label="Trust this device for 7 days"
                    desc="Skip 2FA on this device after a successful sign-in."
                    enabled={true}
                  />
                  {isAdmin && (
                    <Toggle
                      label="Require approval for high-value transactions"
                      desc="Anything over $10,000 needs a second admin to approve."
                      enabled={true}
                    />
                  )}
                </div>
                <div className="divider-rule my-5" />
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-medium text-ink">Password</div>
                    <div className="text-xs text-ink-muted">Last changed Mar 12, 2026 (53 days ago)</div>
                  </div>
                  <button onClick={() => setPwOpen(true)} className="btn-secondary"><i className="ri-lock-password-line" /> Change password</button>
                </div>
              </div>

              <div className="surface">
                <div className="px-5 pt-5">
                  <SectionHeader eyebrow="Active sessions" title="Where you're signed in" />
                </div>
                <table className="ledger mt-2">
                  <thead><tr><th>Device</th><th>Location</th><th>Last active</th><th /></tr></thead>
                  <tbody>
                    <tr>
                      <td className="text-ink"><i className="ri-macbook-line mr-1.5 text-ink-faint" /> MacBook · Chrome</td>
                      <td className="text-ink-muted">Mwanza · 102.219.xx.xx</td>
                      <td className="text-ink-muted">Now <Badge tone="sage">Current</Badge></td>
                      <td />
                    </tr>
                    <tr>
                      <td className="text-ink"><i className="ri-smartphone-line mr-1.5 text-ink-faint" /> iPhone · Safari</td>
                      <td className="text-ink-muted">Mwanza · 154.94.xx.xx</td>
                      <td className="text-ink-muted">2 hr ago</td>
                      <td className="text-right"><button className="text-xs text-rose-700 hover:underline">Revoke</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === "notifications" && (
            <div className="surface p-6">
              <SectionHeader eyebrow="Notifications" title="What you receive and how" />
              <div className="space-y-2.5">
                {(isAdmin ? [
                  { l: "Daily AI briefing", t: "Email at 06:00 every day", on: true },
                  { l: "Pending approvals", t: "When a Sales & Ops submission needs approval", on: true },
                  { l: "Anomaly flags", t: "Real-time alerts for unusual transactions", on: true },
                  { l: "Overdue invoice alerts", t: "When invoices pass due date by 7 days", on: true },
                  { l: "Low stock alerts", t: "When a grade falls below threshold", on: true },
                  { l: "Weekly P&L summary", t: "Mondays at 08:00", on: true },
                ] : [
                  { l: "My approval results", t: "When my submission is approved or rejected", on: true },
                  { l: "Daily task reminder", t: "Email at 07:30 with my open tasks", on: true },
                  { l: "Quotation expiring", t: "When my quotation is 24 hours from expiry", on: true },
                  { l: "Invoice paid", t: "When a customer pays an invoice I created", on: true },
                  { l: "Weekly recap", t: "My submissions this week, sent Friday 17:00", on: false },
                ]).map((n) => (
                  <Toggle key={n.l} label={n.l} desc={n.t} enabled={n.on} />
                ))}
              </div>
              <div className="divider-rule my-5" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Channel">
                  <select className="input"><option>Email</option><option>SMS</option><option>Email + SMS</option></select>
                </Field>
                <Field label="Quiet hours">
                  <select className="input"><option>None</option><option>22:00 — 06:00</option><option>Weekends</option></select>
                </Field>
              </div>
            </div>
          )}

          {/* PREFERENCES */}
          {tab === "preferences" && (
            <div className="surface p-6">
              <SectionHeader eyebrow="Preferences" title="Display and regional" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Default currency">
                  <select className="input" value={code} onChange={(e) => setCode(e.target.value as CurrencyCode)}>
                    {Object.values(CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>{c.code} · {c.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Language">
                  <select className="input"><option>English</option><option>Swahili</option></select>
                </Field>
                <Field label="Date format">
                  <select className="input"><option>4 May 2026</option><option>2026-05-04</option><option>05/04/2026</option></select>
                </Field>
                <Field label="Time zone">
                  <select className="input"><option>Africa/Dar_es_Salaam (EAT)</option><option>UTC</option></select>
                </Field>
                <Field label="Number format">
                  <select className="input"><option>1,234,567.89</option><option>1.234.567,89</option></select>
                </Field>
                <Field label="Weight units">
                  <select className="input"><option>Grams + Kilograms</option><option>Troy ounces</option></select>
                </Field>
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {tab === "activity" && (
            <div className="surface">
              <div className="px-5 pt-5">
                <SectionHeader eyebrow="Activity" title={isAdmin ? "Recent administrative actions" : "My recent submissions"} />
              </div>
              <table className="ledger mt-2">
                <thead><tr><th>When</th><th>Action</th><th>Reference</th><th>Status</th></tr></thead>
                <tbody>
                  {(isAdmin ? [
                    { t: "Today 09:14", a: "Set gold price", r: "Manual · $74.05/g", s: "ok" },
                    { t: "Today 09:02", a: "Approved transaction", r: "TX-018339", s: "ok" },
                    { t: "Yesterday 17:48", a: "Reset password for user", r: "p.mhando@nipana.tz", s: "ok" },
                    { t: "Yesterday 14:22", a: "Generated report", r: "Sales · April", s: "ok" },
                    { t: "May 02 10:11", a: "Rejected transaction", r: "TX-018333", s: "warn" },
                  ] : [
                    { t: "Today 08:52", a: "Submitted purchase", r: "TX-018340 · $22,800", s: "wait" },
                    { t: "Yesterday 17:48", a: "Submitted sale", r: "TX-018338 · $9,650", s: "ok" },
                    { t: "Yesterday 11:02", a: "Created invoice", r: "INV-2026-000482", s: "ok" },
                    { t: "May 02 14:33", a: "Logged inventory movement", r: "BATCH-...0040", s: "ok" },
                    { t: "May 02 09:18", a: "Created quotation", r: "QUO-2026-000091", s: "ok" },
                  ]).map((row, i) => (
                    <tr key={i}>
                      <td className="text-ink-muted">{row.t}</td>
                      <td className="text-ink">{row.a}</td>
                      <td className="font-numeric text-ink-soft">{row.r}</td>
                      <td>
                        <Badge tone={row.s === "ok" ? "sage" : row.s === "warn" ? "terracotta" : "amber"}>
                          {row.s === "ok" ? "Done" : row.s === "warn" ? "Rejected" : "Pending"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ROLE-SPECIFIC */}
          {tab === "field" && !isAdmin && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="My submissions" value="42" hint="this month" />
                <Stat label="Approval rate" value="95%" hint="last 30 days" tone="sage" />
                <Stat label="Avg approval time" value="4.2 hr" hint="from submission" />
                <Stat label="Pending review" value="3" hint="awaiting Admin" tone="amber" />
              </div>

              <div className="surface p-6">
                <SectionHeader eyebrow="Field tools" title="Operating preferences" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Default vault for receipts">
                    <select className="input"><option>Vault A</option><option>Vault B</option></select>
                  </Field>
                  <Field label="Default purity I work with">
                    <select className="input"><option>24K</option><option>22K</option><option>18K</option><option>Raw</option></select>
                  </Field>
                  <Field label="Quick-action shortcuts">
                    <select className="input"><option>Sale, Purchase, Invoice, Stock</option><option>Sale, Expense, Invoice</option></select>
                  </Field>
                  <Field label="Camera for receipt capture">
                    <select className="input"><option>Use device default</option><option>Always rear camera</option></select>
                  </Field>
                </div>
                <div className="divider-rule my-5" />
                <div className="space-y-2.5">
                  <Toggle label="Offline mode" desc="Allow drafting entries when network is unavailable; sync on reconnect." enabled={true} />
                  <Toggle label="Auto-attach last receipt photo" desc="When recording an expense, suggest the most recent unattached photo." enabled={true} />
                  <Toggle label="GPS tag movements" desc="Attach a coordinate to each inventory movement I log." enabled={false} />
                </div>
              </div>
            </div>
          )}

          {tab === "admin-shortcuts" && isAdmin && (
            <div className="space-y-4">
              <div className="surface p-6">
                <SectionHeader eyebrow="Admin shortcuts" title="System administration" />
                <p className="text-sm text-ink-muted mb-4">Personal profile keeps account-level controls. System-wide configuration lives in Settings.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ShortcutLink href="/settings" icon="ri-coin-line" title="Gold Price" desc="Set the manual price or switch to API." />
                  <ShortcutLink href="/settings" icon="ri-team-line" title="User management" desc="Invite, deactivate, or change roles." />
                  <ShortcutLink href="/settings" icon="ri-database-2-line" title="Backup & recovery" desc="Daily backups and restore tests." />
                  <ShortcutLink href="/settings" icon="ri-sparkling-2-line" title="AI configuration" desc="Anomaly threshold, briefing time, models." />
                  <ShortcutLink href="/ai-insights" icon="ri-radar-line" title="AI Insights" desc="Anomaly feed and forecast." />
                  <ShortcutLink href="/reports" icon="ri-file-text-line" title="Reports" desc="P&L, sales, audit, and exports." />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <Modal open={pwOpen} onClose={() => setPwOpen(false)}
        eyebrow="Security" title="Change password"
        footer={<><button className="btn-secondary" onClick={() => setPwOpen(false)}>Cancel</button><button className="btn-primary" onClick={() => setPwOpen(false)}>Update password</button></>}>
        <div className="space-y-4">
          <Field label="Current password"><input type="password" className="input" /></Field>
          <Field label="New password"><input type="password" className="input" /></Field>
          <Field label="Confirm new password"><input type="password" className="input" /></Field>
          <p className="text-xs text-ink-muted">Use at least 12 characters with a mix of letters, numbers, and symbols.</p>
        </div>
      </Modal>

      {/* 2FA */}
      <Modal open={twoFAOpen} onClose={() => setTwoFAOpen(false)}
        eyebrow="Two-factor authentication" title={isAdmin ? "Manage 2FA" : "Enable 2FA"}
        footer={<><button className="btn-secondary" onClick={() => setTwoFAOpen(false)}>Cancel</button><button className="btn-primary" onClick={() => setTwoFAOpen(false)}>{isAdmin ? "Save" : "Enable"}</button></>}>
        <p className="text-sm text-ink-soft mb-4">Scan the QR with an authenticator app (Authy, Google Authenticator, 1Password) and enter the 6-digit code below.</p>
        <div className="surface-flat p-6 text-center mb-4">
          <div className="w-32 h-32 mx-auto bg-paper-100 border border-line rounded-md flex items-center justify-center text-ink-faint">
            <i className="ri-qr-code-line text-5xl" />
          </div>
        </div>
        <Field label="6-digit code"><input className="input" placeholder="123 456" /></Field>
      </Modal>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{eyebrow}</div>
      <div className="font-display text-lg text-ink">{title}</div>
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

function Toggle({ label, desc, enabled, onClick, cta }: { label: string; desc: string; enabled: boolean; onClick?: () => void; cta?: string }) {
  return (
    <div className="surface-flat p-3.5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink font-medium">{label}</div>
        <div className="text-xs text-ink-muted">{desc}</div>
      </div>
      {cta ? (
        <button onClick={onClick} className="btn-secondary text-xs py-1.5 px-3">{cta}</button>
      ) : (
        <span className={`relative w-10 h-6 rounded-full transition cursor-pointer ${enabled ? "bg-gold-500" : "bg-paper-300"}`}>
          <span className={`absolute top-0.5 ${enabled ? "left-[18px]" : "left-0.5"} w-5 h-5 rounded-full bg-white shadow transition-all`} />
        </span>
      )}
    </div>
  );
}

function Stat({ label, value, hint, tone = "ink" }: { label: string; value: string; hint: string; tone?: "ink" | "sage" | "amber" }) {
  return (
    <div className="surface p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</div>
      <div className={`font-numeric text-2xl mt-1 ${tone === "sage" ? "text-sage-700" : tone === "amber" ? "text-gold-700" : "text-ink"}`}>{value}</div>
      <div className="text-xs text-ink-muted mt-1.5">{hint}</div>
    </div>
  );
}

function ShortcutLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="surface-flat p-4 flex items-start gap-3 hover:border-gold-500 transition group">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gold-50 text-gold-600 group-hover:bg-gold-100">
        <i className={`${icon} text-xl`} />
      </div>
      <div className="flex-1">
        <div className="text-sm text-ink font-medium">{title}</div>
        <div className="text-xs text-ink-muted">{desc}</div>
      </div>
      <i className="ri-arrow-right-line text-ink-faint group-hover:text-gold-600" />
    </Link>
  );
}
