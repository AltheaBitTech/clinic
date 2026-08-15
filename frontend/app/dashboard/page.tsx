'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const routes: Record<string, string> = {
        SUPER_ADMIN: '/dashboard/super-admin',
        HOSPITAL_ADMIN: '/dashboard/hospital',
        DOCTOR: '/dashboard/doctor',
        RECEPTIONIST: '/dashboard/receptionist',
        PATIENT: '/dashboard/patient',
        PHARMACY: '/dashboard/pharmacy-portal',
      };
      router.replace(routes[user.role] || '/dashboard/patient');
    }
  }, [user, router]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
