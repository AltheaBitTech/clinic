'use client';

import { useEffect } from 'react';

// Chrome/Android only shows the PWA install affordance (the install icon in
// the omnibox, the app menu entry, and the `beforeinstallprompt` event) once
// a service worker with a fetch handler is registered, on top of having a
// valid manifest. This component's only job is that registration.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  }, []);

  return null;
}
