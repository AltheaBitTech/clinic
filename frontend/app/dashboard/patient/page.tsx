'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Calendar, Pill, FileText, ClipboardList, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn, formatDateTime, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'patient'],
    queryFn: () => dashboardApi.getPatient().then((r) => r.data),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Hello, {user?.firstName}! 👋</h1>
        <p className="page-subtitle">Your health overview and upcoming schedule</p>
      </div>

      {isError ? (
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Couldn&apos;t load your dashboard</p>
          <p className="text-slate-400 text-sm mt-1">Something went wrong. Please try again.</p>
          <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Upcoming Appointments</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : stats?.upcomingAppointments?.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No upcoming appointments</p>
              <Link href="/dashboard/appointments" className="btn-primary mt-4 inline-block text-sm">
                Book Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.upcomingAppointments?.map((appt: any) => (
                <div key={appt.id} className="flex items-center gap-4 p-4 bg-cyan-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 text-xs font-bold shrink-0">
                    Dr
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(appt.scheduledAt)}</p>
                  </div>
                  <span className="badge bg-cyan-100 text-cyan-700 text-xs">{appt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medicine Reminders */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Pill className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Medicines Due</h3>
          </div>
          {(stats?.activeMedicines || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No medicines due</p>
          ) : (
            <div className="space-y-3">
              {stats.activeMedicines.map((rem: any) => (
                <div key={rem.id} className="p-3 bg-amber-50 rounded-xl">
                  <p className="font-semibold text-slate-800 text-sm">{rem.medicine.name}</p>
                  <p className="text-xs text-slate-500">{rem.medicine.dosage} · {rem.medicine.timing?.replace('_', ' ')}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {new Date(rem.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Recent Prescriptions</h3>
          </div>
          {(stats?.recentPrescriptions || []).length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">No prescriptions yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPrescriptions.map((rx: any) => (
                <div key={rx.id} className="flex items-start gap-3 p-4 border border-slate-100 rounded-xl">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      Dr. {rx.doctor.user.firstName} {rx.doctor.user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{rx.diagnosis || 'General consultation'}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rx.medicines.slice(0, 3).map((m: any) => (
                        <span key={m.id} className="badge bg-slate-100 text-slate-600">{m.name}</span>
                      ))}
                      {rx.medicines.length > 3 && (
                        <span className="badge bg-slate-100 text-slate-500">+{rx.medicines.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(rx.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Recent Reports</h3>
          </div>
          {(stats?.recentReports || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No reports uploaded</p>
          ) : (
            <div className="space-y-2">
              {stats.recentReports.map((r: any) => (
                <a key={r.id} href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${r.fileUrl}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400">{r.type.replace('_', ' ')}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
