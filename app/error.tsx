'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('SEGMENT ERROR:', error)
  }, [error])

  return (
    <div className="surface p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
        <i className="ri-alert-line text-2xl text-rose-600" />
      </div>
      <h2 className="font-display text-xl text-ink mb-1">Module unavailable</h2>
      <p className="text-sm text-ink-soft mb-6 max-w-sm">
        This part of the system is temporarily offline due to a data error.
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-paper-100 rounded-lg text-left max-w-2xl overflow-auto max-h-48 border border-line">
          <div className="text-[10px] uppercase tracking-wider text-rose-700 font-bold mb-2">Error Diagnostic Output:</div>
          <pre className="text-[11px] text-ink-muted font-mono whitespace-pre-wrap">
            {error.message}
            {error.stack && `\n\nStack:\n${error.stack}`}
          </pre>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          Refresh page
        </button>
      </div>
    </div>
  )
}
