"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface RowAction {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

const MENU_WIDTH = 200;
const MENU_GAP = 6;

export function RowActionsMenu({ actions, align = "right" }: { actions: RowAction[]; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; openUp: boolean }>({ top: 0, left: 0, openUp: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const computePos = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuHeight = Math.min(actions.length * 38 + 16, 320);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < menuHeight + MENU_GAP;
    const top = openUp ? r.top - menuHeight - MENU_GAP : r.bottom + MENU_GAP;
    const left = align === "right"
      ? Math.max(8, r.right - MENU_WIDTH)
      : Math.min(window.innerWidth - MENU_WIDTH - 8, r.left);
    setPos({ top, left, openUp });
  };

  useLayoutEffect(() => {
    if (!open) return;
    computePos();
    const onScroll = () => setOpen(false);
    const onResize = () => computePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-paper-100 hover:text-ink transition"
        aria-label="Row actions"
      >
        <i className="ri-more-2-fill" />
      </button>
      {open && mounted && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-white border border-line rounded-lg overflow-hidden py-1"
          style={{
            top: pos.top,
            left: pos.left,
            width: MENU_WIDTH,
            zIndex: 100,
            boxShadow: "0 18px 38px -12px rgba(31,26,20,0.22), 0 4px 10px -4px rgba(31,26,20,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((a, i) => (
            <div key={a.label}>
              {a.divider && i > 0 && <div className="my-1 border-t border-line" />}
              <button
                onClick={() => { setOpen(false); a.onClick(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition text-left ${
                  a.danger ? "text-rose-700 hover:bg-rose-100/40" : "text-ink-soft hover:bg-paper-50"
                }`}
              >
                <i className={`${a.icon} ${a.danger ? "" : "text-ink-faint"} text-base shrink-0`} />
                <span className="truncate">{a.label}</span>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
