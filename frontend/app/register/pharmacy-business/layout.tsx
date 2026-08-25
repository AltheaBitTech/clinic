import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Your Pharmacy',
  description: 'Register your pharmacy independently on Arogyix to connect with hospitals and manage prescriptions digitally.',
  alternates: { canonical: '/register/pharmacy-business' },
};

export default function PharmacyBusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
