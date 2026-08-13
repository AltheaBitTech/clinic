'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Users, Calendar, Stethoscope, Receipt, TrendingUp,
  AlertCircle, UserCheck, Clock, AlertTriangle, RefreshCw
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

function StatCard({
  label, value, icon: Icon, color, subtext
}: { label: string; value: string | number; icon: React.ElementType; color: string; subtext?: string }) {
  return (
    <div className="card hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={cn('w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
          <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 truncate">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'hospital'],
    queryFn: () => dashboardApi.getHospital().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-200 rounded-xl mb-3 sm:mb-4" />
              <div className="h-7 sm:h-8 bg-slate-200 rounded mb-2 w-20 sm:w-24" />
              <div className="h-4 bg-slate-100 rounded w-28 sm:w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Couldn&apos;t load dashboard data</p>
          <p className="text-slate-400 text-sm mt-1">Something went wrong. Please try again.</p>
          <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-xl sm:text-2xl lg:text-[1.75rem]">
          Good {greeting}, {user?.firstName}! 👋
        </h1>
        <p className="page-subtitle">Here&apos;s what&apos;s happening at your hospital today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard label="Today's Appointments" value={stats?.todayAppointments || 0} icon={Calendar} color="bg-cyan-500" />
        <StatCard label="Total Patients" value={stats?.totalPatients || 0} icon={Users} color="bg-emerald-500" />
        <StatCard label="Active Doctors" value={stats?.totalDoctors || 0} icon={Stethoscope} color="bg-purple-500" />
        <StatCard label="Today's Revenue" value={formatCurrency(stats?.todayRevenue || 0)} icon={TrendingUp} color="bg-amber-500" subtext={`${stats?.pendingPayments || 0} pending invoices`} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Missed Follow-ups</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{stats?.missedFollowUps || 0}</p>
          <p className="text-sm text-slate-500 mt-1">Patients needing follow-up</p>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4 sm:mb-6">Today&apos;s Appointment Status</h3>
          <div className="flex items-end gap-2 sm:gap-3 h-24 overflow-x-auto">
            {(stats?.appointmentsByStatus || []).map((s: any) => {
              const colors: Record<string, string> = {
                CONFIRMED: 'bg-cyan-400', SCHEDULED: 'bg-blue-400',
                IN_PROGRESS: 'bg-yellow-400', COMPLETED: 'bg-emerald-400',
                CANCELLED: 'bg-red-400', NO_SHOW: 'bg-gray-400',
              };
              const maxCount = Math.max(...(stats?.appointmentsByStatus || []).map((x: any) => x._count.status), 1);
              const height = (s._count.status / maxCount) * 80;
              return (
                <div key={s.status} className="flex flex-col items-center gap-1 flex-1 min-w-12">
                  <span className="text-xs font-bold text-slate-600">{s._count.status}</span>
                  <div className={cn('w-full rounded-t-lg', colors[s.status])} style={{ height: `${height}px` }} />
                  <span className="text-[10px] text-slate-400 text-center leading-tight">{s.status.replace('_', ' ')}</span>
                </div>
              );
            })}
            {(!stats?.appointmentsByStatus || stats.appointmentsByStatus.length === 0) && (
              <p className="text-center text-slate-400 text-sm w-full">No appointments today</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-semibold text-slate-800">Recently Registered Patients</h3>
        </div>
        <div className="space-y-1">
          {(stats?.recentPatients || []).map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 text-xs font-bold shrink-0">
                {p.user.firstName[0]}{p.user.lastName?.[0] || ''}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 text-sm truncate">{p.user.firstName} {p.user.lastName}</p>
                <p className="text-xs text-slate-400 truncate">{p.patientCode}</p>
              </div>
              <div className="shrink-0 text-xs text-slate-400 hidden sm:block">{p.city || 'N/A'}</div>
            </div>
          ))}
          {(!stats?.recentPatients || stats.recentPatients.length === 0) && (
            <p className="text-center text-slate-400 py-4 text-sm">No patients registered yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
