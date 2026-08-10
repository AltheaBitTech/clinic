'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity, LayoutDashboard, Calendar, Users, FileText, Bell,
  MessageSquare, BarChart3, Receipt, Settings, LogOut, ChevronRight,
  Stethoscope, Building2, UserCheck, Package, ClipboardList, Pill, Store,
  Menu, X
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

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
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    enabled: !!user,
  });
  const unreadCount = notificationsData?.unread || 0;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Live notifications (e.g. new chat messages between patient <-> doctor)
  useEffect(() => {
    if (!user) return;
    const socket: Socket = io(`${SOCKET_URL}/chat`, { auth: { userId: user.id } });

    socket.on('new_notification', (notification: { title: string; body: string }) => {
      toast(notification.title, { icon: '🔔' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Prevent background scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

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
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 flex flex-col shrink-0',
          'transform transition-transform duration-300 ease-in-out',
          'lg:static lg:z-auto lg:w-64 lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* User / Hospital / Brand */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard/settings" className="flex items-center gap-3 min-w-0 group">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'}${user.avatarUrl}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold shrink-0">
                  {getInitials(user.firstName, user.lastName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-400 truncate">{user.role.replace('_', ' ')}</p>
              </div>
            </Link>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-50 rounded-lg"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 lg:hidden"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
          {user.tenant && (
            <div className="mt-3 flex items-center gap-3 px-2.5 py-2.5 bg-indigo-50 rounded-lg">
              {user.tenant.logoUrl ? (
                <img
                  src={user.tenant.logoUrl.startsWith('http') ? user.tenant.logoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'}${user.tenant.logoUrl}`}
                  alt={user.tenant.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : null}
              <p className="text-sm font-semibold text-indigo-600 truncate">{user.tenant.name}</p>
            </div>
          )}
          <Link href={getDashboardHref()} className="mt-3 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity w-fit">
            <Image src="/arogyix-logo.svg" alt="Arogyix" width={14} height={14} />
            <span className="text-[11px] font-medium text-slate-400">by Arogyix</span>
          </Link>
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
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {isActive && label !== 'Notifications' && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shrink-0 lg:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <Link href={getDashboardHref()} className="flex items-center gap-2">
            <Image src="/arogyix-logo.svg" alt="Arogyix" width={24} height={24} />
            <span className="text-base font-bold text-slate-900">Arogyix</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
