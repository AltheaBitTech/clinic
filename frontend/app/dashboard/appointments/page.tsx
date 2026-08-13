'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api';
import { Calendar, Plus, Clock, ChevronRight, Filter, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { cn, formatDateTime, getStatusColor } from '@/lib/utils';

const STATUS_OPTIONS = ['All', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AppointmentsPage() {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments', status, date, page],
    queryFn: () => appointmentsApi.getAll({ status: status || undefined, date: date || undefined, page }).then((r) => r.data),
  });

  const STATUS_PRIORITY: Record<string, number> = {
    CONFIRMED: 0,
    SCHEDULED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4,
  };

  const sortedAppointments = data?.data
    ? [...data.data].sort((a: any, b: any) => {
        const aPriority = STATUS_PRIORITY[a.status] ?? 5;
        const bPriority = STATUS_PRIORITY[b.status] ?? 5;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      })
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage and track all patient appointments</p>
        </div>
        <Link href="/dashboard/appointments/new" className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto max-w-full">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s === 'All' ? '' : s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap',
                (s === 'All' ? !status : status === s)
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto text-sm"
          />
          {(status || date) && (
            <button onClick={() => { setStatus(''); setDate(''); }} className="text-sm text-cyan-600 hover:text-cyan-700 shrink-0">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-48" />
                <div className="h-3 bg-slate-100 rounded w-32" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="card text-center py-16">
            <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Couldn&apos;t load appointments</p>
            <p className="text-slate-400 text-sm mt-1">Something went wrong. Please try again.</p>
            <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="card text-center py-16">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No appointments found</p>
            <p className="text-slate-300 text-sm mt-1">Try adjusting your filters or create a new appointment</p>
          </div>
        ) : (
          sortedAppointments.map((appt: any) => (
            <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}
              className="card card-hover flex items-center gap-3 sm:gap-4 group">
              {/* Time Block */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-cyan-50 flex flex-col items-center justify-center shrink-0">
                <span className="text-sm sm:text-lg font-bold text-cyan-600">
                  {new Date(appt.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-slate-800 truncate max-w-full">
                    {appt.patient.user.firstName} {appt.patient.user.lastName}
                  </p>
                  <span className={cn('badge text-xs shrink-0', getStatusColor(appt.status))}>{appt.status}</span>
                </div>
                <p className="text-sm text-slate-500 truncate">
                  Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                  {appt.reason ? ` · ${appt.reason}` : ''}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 truncate">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {formatDateTime(appt.scheduledAt)}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors shrink-0" />
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
          <p className="text-sm text-slate-500">{data.total} appointments total</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-600 px-3">{page} / {data.pages}</span>
            <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
