'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api';
import { Calendar, Plus, Clock, ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';
import { cn, formatDateTime, getStatusColor } from '@/lib/utils';

const STATUS_OPTIONS = ['All', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AppointmentsPage() {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', status, date, page],
    queryFn: () => appointmentsApi.getAll({ status: status || undefined, date: date || undefined, page }).then((r) => r.data),
  });

  return (
    <div className="p-8 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage and track all patient appointments</p>
        </div>
        <Link href="/dashboard/appointments/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s === 'All' ? '' : s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                (s === 'All' ? !status : status === s)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-auto text-sm"
        />
        {(status || date) && (
          <button onClick={() => { setStatus(''); setDate(''); }} className="text-sm text-indigo-600 hover:text-indigo-700">
            Clear filters
          </button>
        )}
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
        ) : data?.data?.length === 0 ? (
          <div className="card text-center py-16">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No appointments found</p>
            <p className="text-slate-300 text-sm mt-1">Try adjusting your filters or create a new appointment</p>
          </div>
        ) : (
          data?.data?.map((appt: any) => (
            <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}
              className="card card-hover flex items-center gap-4 group">
              {/* Time Block */}
              <div className="w-14 h-14 rounded-xl bg-indigo-50 flex flex-col items-center justify-center shrink-0">
                <span className="text-lg font-bold text-indigo-600">
                  {new Date(appt.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-800">
                    {appt.patient.user.firstName} {appt.patient.user.lastName}
                  </p>
                  <span className={cn('badge text-xs', getStatusColor(appt.status))}>{appt.status}</span>
                </div>
                <p className="text-sm text-slate-500">
                  Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                  {appt.reason ? ` · ${appt.reason}` : ''}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(appt.scheduledAt)}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
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
