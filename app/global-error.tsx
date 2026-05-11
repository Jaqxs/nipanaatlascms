'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('CRITICAL CLIENT ERROR:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-6">
            <i className="ri-error-warning-line text-3xl text-rose-600" />
          </div>
          <h2 className="font-display text-2xl text-ink mb-2">A technical error occurred</h2>
          <p className="text-sm text-ink-muted max-w-md mb-8">
            The GBMS Stability Engine has intercepted a client-side exception. 
            We've logged the details and are ready to attempt a safe recovery.
          </p>
          
          <div className="surface-flat p-4 rounded-lg text-left mb-8 max-w-xl w-full">
            <div className="text-[10px] uppercase tracking-wider text-ink-faint mb-2">Error telemetry</div>
            <code className="text-xs text-rose-700 break-all">
              {error.message || 'Unknown runtime exception'}
              {error.digest && <div className="mt-1 opacity-50">Digest: {error.digest}</div>}
            </code>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="btn-primary px-8"
            >
              Recover session
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary"
            >
              Return to safety
            </button>
          </div>
          
          <p className="mt-12 text-[10px] text-ink-faint uppercase tracking-widest">
            v6.0-CYBERPUNK · STABILITY MODE
          </p>
        </div>
      </body>
    </html>
  )
}
