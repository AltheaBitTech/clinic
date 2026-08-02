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

export const metadata: Metadata = {
  title: 'Arogyix — Healthcare management made simple.',
  description: 'Arogyix: All-in-one clinic management platform — appointments, prescriptions, reminders, and patient timelines.',
  keywords: 'clinic management, hospital software, patient portal, medical records, Arogyix',
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
