import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arogyix — Healthcare Management',
    short_name: 'Arogyix',
    description:
      'All-in-one clinic management platform — appointments, digital prescriptions, medicine reminders, and patient timelines for hospitals and clinics.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0fdf4',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
