'use client';

import { useEffect } from 'react';
import './globals.css';
import { reportClientError } from '@/lib/error-reporter';

// Replaces the root layout when it crashes, so it must render its own <html>/<body>.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportClientError(error, 'global-boundary');
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <title>Something went wrong | Arogyix</title>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-600">
              Arogyix ran into an unexpected problem. Our team has been notified automatically and
              is looking into it.
            </p>
            <button
              onClick={() => unstable_retry()}
              className="mt-6 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Try again
            </button>
            {error.digest && (
              <p className="mt-4 text-xs text-slate-400">Reference: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
