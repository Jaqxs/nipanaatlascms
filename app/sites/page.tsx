"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, statusToTone } from "../components/Badge";
import { Modal } from "../components/Modal";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { getApiUrl } from "../lib/config";
import { usePersistence } from "../lib/persistence-context";

interface Site {
  id: string;
  name: string;
  location: string;
  manager: string;
  type: string;
  status: string;
  productionRate: number;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const { backupData, getBackup } = usePersistence();
  const [isUsingBackup, setIsUsingBackup] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    manager: "",
    type: "Mining",
    productionRate: "0"
  });

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/sites'));
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSites(data);
        backupData('sites', data);
        setIsUsingBackup(false);
      } else {
        const b = getBackup('sites');
        if (b) {
          setSites(b);
          setIsUsingBackup(true);
        } else {
          setSites([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sites:", err);
      const b = getBackup('sites');
      if (b) {
        setSites(b);
        setIsUsingBackup(true);
      } else {
        setSites([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/sites'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setCreating(false);
        setFormData({ name: "", location: "", manager: "", type: "Mining", productionRate: "0" });
        fetchSites();
        alert("Site added successfully!");
      } else {
        const err = await res.json().catch(() => ({ error: "Server failed" }));
        alert("Error: " + err.error);
      }
    } catch (err) {
      alert("Failed to create site. Check your connection.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(getApiUrl('/api/sites'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editing, action: 'update' })
      });
      if (res.ok) {
        setEditing(null);
        fetchSites();
      }
    } catch (err) {
      alert("Failed to update site");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this site?")) return;
    try {
      const res = await fetch(getApiUrl('/api/sites'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' })
      });
      if (res.ok) {
        fetchSites();
      }
    } catch (err) {
      alert("Failed to delete site");
    }
  }

  return (
    <div>
      <PageHeader
        title="Business Sites"
        description="Manage mining locations, processing centers, and offices"
        actions={
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <i className="ri-add-line" /> Add New Site
          </button>
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
          <button onClick={fetchSites} className="ml-auto btn-secondary py-1.5 text-xs">
            <i className="ri-refresh-line" /> Try reconnecting
          </button>
        </div>
      )}

      <div className="surface mt-6">
        <table className="ledger">
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Location</th>
              <th>Manager</th>
              <th>Type</th>
              <th>Production</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-ink-faint">Loading sites...</td></tr>
            ) : sites.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-ink-faint">No sites found.</td></tr>
            ) : (
              sites.map((site) => {
                if (!site) return null;
                return (
                  <tr key={site.id}>
                    <td className="font-medium text-ink">{site.name}</td>
                    <td className="text-ink-soft">{site.location}</td>
                    <td className="text-ink-soft">{site.manager}</td>
                    <td className="text-ink-muted">{site.type}</td>
                    <td className="font-numeric text-ink">{site.productionRate} g/day</td>
                    <td><Badge tone={statusToTone(site.status)}>{site.status}</Badge></td>
                    <td className="text-right">
                      <RowActionsMenu actions={[
                        { label: "Edit Site", icon: "ri-edit-line", onClick: () => setEditing(site) },
                        { label: "Delete Site", icon: "ri-delete-bin-line", onClick: () => handleDelete(site.id), danger: true },
                      ]} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Add New Site">
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <Field label="Site Name"><input className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></Field>
          <Field label="Location"><input className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></Field>
          <Field label="Manager"><input className="input" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} /></Field>
          <Field label="Type">
            <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option>Mining</option>
              <option>Refinery</option>
              <option>Office</option>
              <option>Warehouse</option>
            </select>
          </Field>
          <Field label="Production Rate (g/day)"><input type="number" className="input" value={formData.productionRate} onChange={e => setFormData({...formData, productionRate: e.target.value})} /></Field>
          <div className="flex gap-3 pt-4">
            <button type="button" className="btn-secondary flex-1" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Site</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Site">
        {editing && (
          <form onSubmit={handleUpdate} className="space-y-4 p-1">
            <Field label="Site Name"><input className="input" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} required /></Field>
            <Field label="Location"><input className="input" value={editing.location} onChange={e => setEditing({...editing, location: e.target.value})} /></Field>
            <Field label="Manager"><input className="input" value={editing.manager} onChange={e => setEditing({...editing, manager: e.target.value})} /></Field>
            <Field label="Type">
              <select className="input" value={editing.type} onChange={e => setEditing({...editing, type: e.target.value})}>
                <option>Mining</option>
                <option>Refinery</option>
                <option>Office</option>
                <option>Warehouse</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={editing.status} onChange={e => setEditing({...editing, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </Field>
            <div className="flex gap-3 pt-4">
              <button type="button" className="btn-secondary flex-1" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
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
