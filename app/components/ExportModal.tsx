"use client";
import { useState } from "react";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Title of the dataset, e.g. "transactions" */
  resource: string;
  rowCount: number;
}

const FORMATS = [
  { id: "pdf", label: "PDF", icon: "ri-file-pdf-line", desc: "Branded, print-ready report" },
  { id: "xlsx", label: "Excel", icon: "ri-file-excel-2-line", desc: "Raw data with formulas preserved" },
  { id: "csv", label: "CSV", icon: "ri-file-text-line", desc: "Plain text for any tool" },
];

export function ExportModal({ open, onClose, resource, rowCount }: Props) {
  const [format, setFormat] = useState("xlsx");
  const [scope, setScope] = useState<"filtered" | "all">("filtered");
  const [includeMeta, setIncludeMeta] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Export"
      title={`Export ${resource}`}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={onClose}>
          <i className="ri-download-line" /> {emailing ? "Email & download" : "Download"}
        </button>
      </>}
    >
      <div className="space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Format</div>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={`p-3 rounded-lg text-left transition border ${
                  format === f.id ? "border-gold-500 bg-gold-50/40" : "border-line bg-white hover:bg-paper-50"
                }`}
              >
                <i className={`${f.icon} text-2xl ${format === f.id ? "text-gold-600" : "text-ink-muted"}`} />
                <div className={`font-medium mt-1 ${format === f.id ? "text-ink" : "text-ink-soft"}`}>{f.label}</div>
                <div className="text-[11px] text-ink-muted leading-tight mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-2">Scope</div>
          <div className="grid grid-cols-2 gap-2">
            <label className={`p-3 rounded-lg text-left cursor-pointer border ${scope === "filtered" ? "border-gold-500 bg-gold-50/40" : "border-line"}`}>
              <input type="radio" name="scope" checked={scope === "filtered"} onChange={() => setScope("filtered")} className="mr-2" />
              <span className="text-sm font-medium text-ink">Current view</span>
              <div className="text-[11px] text-ink-muted">{rowCount} rows · respects filters & date range</div>
            </label>
            <label className={`p-3 rounded-lg text-left cursor-pointer border ${scope === "all" ? "border-gold-500 bg-gold-50/40" : "border-line"}`}>
              <input type="radio" name="scope" checked={scope === "all"} onChange={() => setScope("all")} className="mr-2" />
              <span className="text-sm font-medium text-ink">All records</span>
              <div className="text-[11px] text-ink-muted">Every row in this module</div>
            </label>
          </div>
        </div>

        <label className="flex items-center gap-3 surface-flat p-3 cursor-pointer">
          <input type="checkbox" checked={includeMeta} onChange={(e) => setIncludeMeta(e.target.checked)} />
          <div className="flex-1">
            <div className="text-sm text-ink font-medium">Include metadata</div>
            <div className="text-[11px] text-ink-muted">Generated-at timestamp, user, filter summary, and totals.</div>
          </div>
        </label>

        <label className="flex items-center gap-3 surface-flat p-3 cursor-pointer">
          <input type="checkbox" checked={emailing} onChange={(e) => setEmailing(e.target.checked)} />
          <div className="flex-1">
            <div className="text-sm text-ink font-medium">Also email a copy</div>
            <div className="text-[11px] text-ink-muted">Useful for archival or a teammate.</div>
          </div>
        </label>

        {emailing && (
          <input className="input" placeholder="recipient@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
      </div>
    </Modal>
  );
}
