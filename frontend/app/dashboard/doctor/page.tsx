'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Calendar, Users, ClipboardList, Clock } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'doctor'],
    queryFn: () => dashboardApi.getDoctor().then((r) => r.data),
  });

  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-indigo-100 text-indigo-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dr. {user?.firstName}&apos;s Dashboard</h1>
        <p className="page-subtitle">Your appointments and patient overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Today's Appointments", value: stats?.todayAppointments || 0, icon: Calendar, color: 'bg-indigo-500' },
          { label: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: 'bg-emerald-500' },
          { label: 'Prescriptions Pending', value: stats?.pendingPrescriptions || 0, icon: ClipboardList, color: 'bg-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
            <p className="text-sm text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-800">Today&apos;s Schedule</h3>
          <span className="ml-auto text-sm text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 py-3 border-b border-slate-50">
                <div className="w-9 h-9 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-32 mb-1" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : stats?.todaySchedule?.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats?.todaySchedule?.map((appt: any) => (
              <div key={appt.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                  {appt.patient.user.firstName[0]}{appt.patient.user.lastName?.[0] || ''}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{appt.patient.user.firstName} {appt.patient.user.lastName}</p>
                  <p className="text-xs text-slate-400">{appt.reason || 'Consultation'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(appt.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={cn('badge text-xs', statusColors[appt.status] || 'bg-gray-100 text-gray-700')}>
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
