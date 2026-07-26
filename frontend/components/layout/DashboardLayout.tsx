'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity, LayoutDashboard, Calendar, Users, FileText, Bell,
  MessageSquare, BarChart3, Receipt, Settings, LogOut, ChevronRight,
  Stethoscope, Building2, UserCheck, Package, ClipboardList, Pill, Store
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
  { label: 'Hospitals', href: '/dashboard/hospitals', icon: Building2, roles: ['SUPER_ADMIN'] },
  { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
  { label: 'Patients', href: '/dashboard/patients', icon: Users, roles: ['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { label: 'Doctors', href: '/dashboard/doctors', icon: Stethoscope, roles: ['HOSPITAL_ADMIN'] },
  { label: 'Departments', href: '/dashboard/departments', icon: Package, roles: ['HOSPITAL_ADMIN'] },
  { label: 'Prescriptions', href: '/dashboard/prescriptions', icon: ClipboardList, roles: ['HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT'] },
  { label: 'Medicines Catalog', href: '/dashboard/medicines', icon: Pill, roles: ['HOSPITAL_ADMIN', 'DOCTOR'] },
  { label: 'Pharmacies', href: '/dashboard/pharmacies', icon: Store, roles: ['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT'] },
  { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare, roles: ['DOCTOR', 'PATIENT'] },
  { label: 'Billing', href: '/dashboard/billing', icon: Receipt, roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST'] },
  { label: 'Staff', href: '/dashboard/staff', icon: UserCheck, roles: ['HOSPITAL_ADMIN'] },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, roles: ['ALL'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['ALL'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Loading Arogyix...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter(
    (item) => item.roles.includes('ALL') || item.roles.includes(user.role),
  );

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  const getDashboardHref = () => {
    const map: Record<string, string> = {
      SUPER_ADMIN: '/dashboard/super-admin',
      HOSPITAL_ADMIN: '/dashboard/hospital',
      DOCTOR: '/dashboard/doctor',
      RECEPTIONIST: '/dashboard/receptionist',
      PATIENT: '/dashboard/patient',
    };
    return map[user.role] || '/dashboard/patient';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <Link href={getDashboardHref()} className="flex items-center gap-2.5">
            <Image src="/arogyix-logo.svg" alt="Arogyix" width={32} height={32} />
            <span className="text-lg font-bold text-slate-900">Arogyix</span>
          </Link>
          {user.tenant && (
            <div className="mt-3 px-2 py-1.5 bg-indigo-50 rounded-lg">
              <p className="text-xs font-semibold text-indigo-600 truncate">{user.tenant.name}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {filteredNav.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href ||
              (href === '/dashboard' && ['/dashboard/super-admin', '/dashboard/hospital', '/dashboard/doctor', '/dashboard/receptionist', '/dashboard/patient'].includes(pathname)) ||
              (href !== '/dashboard' && pathname.startsWith(href));
            return (

              <Link
                key={href}
                href={href}
                className={cn('sidebar-link', isActive && 'active')}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 cursor-pointer group">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'}${user.avatarUrl}`}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-100"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user.role.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
              <LogOut className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
