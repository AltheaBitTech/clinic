'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/error-reporter';

// Catches errors that escape React error boundaries (event handlers, async
// code, unhandled promise rejections) and reports them to the backend.
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      // Ignore cross-origin "Script error." with no details — not actionable.
      if (!event.error && event.message === 'Script error.') return;
      reportClientError(event.error ?? event.message, 'window');
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      // Failed API calls reject too; the backend already alerts on its own 5xx,
      // and 4xx are expected user errors, so skip axios errors entirely.
      if ((event.reason as { isAxiosError?: boolean })?.isAxiosError) return;
      reportClientError(event.reason, 'promise');
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
