"use client";
import { ReactNode, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  children: ReactNode;
}

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({ open, onClose, title, eyebrow, size = "md", footer, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-panel ${SIZES[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || eyebrow) && (
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-line">
            <div>
              {eyebrow && (
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-1">
                  {eyebrow}
                </div>
              )}
              {title && <div className="font-display text-2xl text-ink">{title}</div>}
            </div>
            <button onClick={onClose} className="btn-ghost -mr-2 -mt-1 text-xl">
              <i className="ri-close-line" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-line bg-paper-50/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
