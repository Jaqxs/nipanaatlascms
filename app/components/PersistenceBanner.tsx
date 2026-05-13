'use client'

import React from 'react';
import { usePersistence } from '@/app/lib/persistence-context';

export function PersistenceBanner({ onRetry }: { onRetry: () => void }) {
  const { isRecovering, errorDetail } = usePersistence();

  // In standalone mode, we only show the banner if the server is literally unreachable
  if (!isRecovering) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
        <i className="ri-error-warning-line text-xl text-rose-700" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-rose-900">
          Server Connection Lost
        </div>
        <div className="text-xs text-rose-700 mt-0.5">
          {errorDetail || "The GBMS server is currently offline. You are in read-only mode using browser backup data."}
        </div>
      </div>
      <button onClick={onRetry} className="btn-secondary py-1.5 text-xs whitespace-nowrap">
        <i className="ri-refresh-line" /> Reconnect
      </button>
    </div>
  );
}
