import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Account',
  description: 'Register your hospital or clinic on Arogyix and get started with appointments, digital prescriptions, and patient management.',
  alternates: { canonical: '/register' },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
