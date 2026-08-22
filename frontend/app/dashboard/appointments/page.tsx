'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api';
import {
  Calendar, Plus, Clock, ChevronRight, ChevronLeft, AlertTriangle, RefreshCw,
  CheckCircle2, CalendarClock, Loader2, CheckCheck, XCircle, Stethoscope,
  SlidersHorizontal, X,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatDateTime, getStatusColor, getInitials } from '@/lib/utils';

const STATUS_OPTIONS = ['All', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const STATUS_META: Record<string, { icon: React.ElementType; accent: string; iconBg: string; iconColor: string }> = {
  CONFIRMED: { icon: CheckCircle2, accent: 'bg-cyan-500', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
  SCHEDULED: { icon: CalendarClock, accent: 'bg-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  IN_PROGRESS: { icon: Loader2, accent: 'bg-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  COMPLETED: { icon: CheckCheck, accent: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  CANCELLED: { icon: XCircle, accent: 'bg-red-500', iconBg: 'bg-red-50', iconColor: 'text-red-600' },
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function AppointmentsPage() {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Prevent background scroll while the mobile filter sheet is open
  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

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

  const counts = sortedAppointments.reduce((acc: Record<string, number>, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  let lastStatus: string | null = null;

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-cyan-900/10">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">Appointments</h1>
            <p className="page-subtitle">Manage and track all patient appointments</p>
          </div>
        </div>
        <Link href="/dashboard/appointments/new" className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Appointment
        </Link>
      </div>

      {/* Filters - Desktop / Tablet */}
      <div className="hidden sm:flex sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-200 p-1.5 overflow-x-auto max-w-full shadow-sm">
          {STATUS_OPTIONS.map((s) => {
            const isActive = s === 'All' ? !status : status === s;
            const meta = STATUS_META[s];
            const Icon = meta?.icon;
            return (
              <button
                key={s}
                onClick={() => setStatus(s === 'All' ? '' : s)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap',
                  isActive
                    ? 'gradient-primary text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                {Icon && <Icon className={cn('w-3.5 h-3.5', s === 'IN_PROGRESS' && !isActive && 'animate-spin')} />}
                {s === 'All' ? 'All' : STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto text-sm"
          />
          {(status || date) && (
            <button onClick={() => { setStatus(''); setDate(''); }} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium shrink-0">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Filters - Mobile trigger */}
      <div className="flex sm:hidden items-center gap-2 mb-6">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-between gap-2 bg-white rounded-xl border border-slate-200 pl-3.5 pr-3 py-2.5 shadow-sm active:scale-[0.98] transition-transform min-w-0"
        >
          <span className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="text-sm font-semibold text-slate-700 truncate">
              {status ? STATUS_LABELS[status] : 'All Statuses'}
            </span>
            {date && (
              <span className="text-xs text-slate-400 shrink-0">
                · {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </span>
          {(status || date) && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full gradient-primary text-white text-[11px] font-bold shrink-0">
              {(status ? 1 : 0) + (date ? 1 : 0)}
            </span>
          )}
        </button>
        {(status || date) && (
          <button
            onClick={() => { setStatus(''); setDate(''); }}
            aria-label="Clear filters"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-xl" />
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
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-cyan-300" />
            </div>
            <p className="text-slate-500 font-semibold">No appointments found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or create a new appointment</p>
            <Link href="/dashboard/appointments/new" className="btn-primary mt-5 inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Appointment
            </Link>
          </div>
        ) : (
          sortedAppointments.map((appt: any, idx: number) => {
            const meta = STATUS_META[appt.status] || STATUS_META.SCHEDULED;
            const StatusIcon = meta.icon;
            const showGroupHeader = !status && appt.status !== lastStatus;
            lastStatus = appt.status;

            return (
              <div key={appt.id}>
                {showGroupHeader && (
                  <div className={cn('flex items-center gap-2 px-1 mb-2', idx !== 0 && 'mt-6')}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', meta.accent)} />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {STATUS_LABELS[appt.status] || appt.status}
                    </p>
                    <span className="text-xs text-slate-300 font-medium">({counts[appt.status]})</span>
                  </div>
                )}
                <Link
                  href={`/dashboard/appointments/${appt.id}`}
                  className="card card-hover flex items-center gap-3 sm:gap-4 group relative overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms`, opacity: 0 }}
                >
                  <span className={cn('absolute left-0 top-0 bottom-0 w-1', meta.accent)} />

                  {/* Time Block */}
                  <div className={cn('w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ml-1', meta.iconBg)}>
                    <span className={cn('text-sm sm:text-lg font-bold', meta.iconColor)}>
                      {new Date(appt.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>

                  {/* Patient Avatar */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 hidden sm:flex">
                    {getInitials(appt.patient.user.firstName, appt.patient.user.lastName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-800 truncate max-w-full">
                        {appt.patient.user.firstName} {appt.patient.user.lastName}
                      </p>
                      <span className={cn('badge text-xs shrink-0 gap-1', getStatusColor(appt.status))}>
                        <StatusIcon className={cn('w-3 h-3', appt.status === 'IN_PROGRESS' && 'animate-spin')} />
                        {STATUS_LABELS[appt.status] || appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                      {appt.reason ? ` · ${appt.reason}` : ''}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 truncate">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {formatDateTime(appt.scheduledAt)}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{data.total}</span> appointments total
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="btn-secondary text-sm px-3.5 py-2 disabled:opacity-40 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-slate-600 px-3 font-medium">{page} / {data.pages}</span>
            <button disabled={page === data.pages} onClick={() => setPage((p) => p + 1)}
              className="btn-secondary text-sm px-3.5 py-2 disabled:opacity-40 flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Filters - Mobile sheet (rendered outside the page wrapper so `fixed` stays pinned to the viewport, not the scrollable content) */}
    {mobileFiltersOpen && (
      <>
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] sm:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        />
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl sm:hidden max-h-[80vh] flex flex-col animate-sheet-up">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
            <p className="font-bold text-slate-800">Filter Appointments</p>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="px-5 py-4 overflow-y-auto space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const isActive = s === 'All' ? !status : status === s;
                  const meta = STATUS_META[s];
                  const Icon = meta?.icon;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s === 'All' ? '' : s)}
                      className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                        isActive
                          ? 'gradient-primary text-white border-transparent shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200'
                      )}
                    >
                      {Icon && <Icon className={cn('w-4 h-4 shrink-0', s === 'IN_PROGRESS' && !isActive && 'animate-spin')} />}
                      <span className="truncate">{s === 'All' ? 'All' : STATUS_LABELS[s]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input text-sm"
              />
            </div>
          </div>

          <div
            className="flex items-center gap-4 px-5 py-4 border-t border-slate-100 shrink-0"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={() => { setStatus(''); setDate(''); }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 shrink-0"
            >
              Clear all
            </button>
            <button onClick={() => setMobileFiltersOpen(false)} className="btn-primary flex-1 text-sm">
              Show results
            </button>
          </div>
        </div>
      </>
    )}
    </>
  );
}
