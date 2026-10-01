import { errorReportApi } from './api';

export type ClientErrorKind = 'boundary' | 'global-boundary' | 'window' | 'promise';

const MAX_REPORTS_PER_PAGE_LOAD = 10;
const reported = new Set<string>();

/**
 * Sends a browser-side crash to the backend, which emails the team.
 * Only the pathname is sent (never the query string) since URLs can carry
 * patient data. Never throws — a failing reporter must not cause more errors.
 */
export function reportClientError(error: unknown, kind: ClientErrorKind): void {
  try {
    if (typeof window === 'undefined') return;

    const err =
      error instanceof Error
        ? (error as Error & { digest?: string })
        : new Error(typeof error === 'string' ? error : 'Non-Error value thrown');
    const key = `${kind}|${err.name}|${err.message}`;
    if (reported.has(key) || reported.size >= MAX_REPORTS_PER_PAGE_LOAD) return;
    reported.add(key);

    errorReportApi
      .reportClientError({
        message: (err.message || '(no message)').slice(0, 500),
        name: err.name?.slice(0, 100),
        stack: err.stack?.slice(0, 5000),
        path: window.location.pathname.slice(0, 300),
        digest: err.digest?.slice(0, 100),
        kind,
        userAgent: navigator.userAgent.slice(0, 300),
      })
      .catch(() => undefined);
  } catch {
    // ignore
  }
}
