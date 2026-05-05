import { ReactNode } from "react";

export function PageHeader({
  title, description, actions,
}: { title?: string; description?: string; actions?: ReactNode }) {
  if (!title && !description && !actions) return null;
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
      <div className="min-w-0">
        {title && (
          <h1 className="font-display text-[28px] leading-tight text-ink">{title}</h1>
        )}
        {description && (
          <p className="text-ink-muted text-sm mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="surface-flat p-3 flex items-center gap-2 flex-wrap mb-5">
      {children}
    </div>
  );
}

export function FilterChip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-md text-sm transition ${
        active
          ? "bg-gold-100 text-gold-700"
          : "text-ink-muted hover:bg-paper-100"
      }`}
    >
      {active ? children : children}
    </button>
  );
}
