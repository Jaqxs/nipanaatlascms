'use client'

import React from 'react';
import { usePersistence } from '@/app/lib/persistence-context';
import { API_BASE_URL } from '@/app/lib/config';

export function PersistenceBanner({ onRetry }: { onRetry: () => void }) {
  const { isRecovering, errorDetail } = usePersistence();

  if (!isRecovering) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <i className="ri-shield-flash-line text-xl text-amber-700" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-amber-900 flex items-center gap-2">
          Operating in Safe Mode (Browser Backup)
          <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter">Local Persistence Active</span>
        </div>
        <div className="text-xs text-amber-700 mt-0.5">
          {errorDetail ? (
            <span className="flex flex-col gap-0.5">
              <span>Primary cloud storage unreachable: <strong>{errorDetail}</strong></span>
              <span className="opacity-70">Target: {API_BASE_URL} (Check Dokploy & DNS)</span>
            </span>
          ) : (
            "The primary cloud storage is currently offline. You are viewing your last recorded session from this browser."
          )}
        </div>
      </div>
      <button onClick={onRetry} className="btn-secondary py-1.5 text-xs whitespace-nowrap">
        <i className="ri-refresh-line" /> Try reconnecting
      </button>
    </div>
  );
}
