import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Pathology Lab Registration',
  description: 'Complete your invited pathology lab registration on Arogyix.',
  alternates: { canonical: '/register/pathology-lab' },
  robots: { index: false, follow: false },
};

export default function PathologyLabInviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
