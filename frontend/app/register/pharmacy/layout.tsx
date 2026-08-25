import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Pharmacy Registration',
  description: 'Complete your invited pharmacy registration on Arogyix.',
  alternates: { canonical: '/register/pharmacy' },
  robots: { index: false, follow: false },
};

export default function PharmacyInviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
