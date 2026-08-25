import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arogyix.altheabit.in';
const title = 'Arogyix — Healthcare management made simple.';
const description = 'Arogyix: All-in-one clinic management platform — appointments, digital prescriptions, medicine reminders, and patient timelines for hospitals and clinics.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s | Arogyix',
  },
  description,
  keywords: 'clinic management, hospital software, patient portal, medical records, Arogyix',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Arogyix',
    title,
    description,
    images: [{ url: '/arogyix-logo.svg', width: 512, height: 512, alt: 'Arogyix' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/arogyix-logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#1e293b', color: '#f8fafc', borderRadius: '12px' },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
