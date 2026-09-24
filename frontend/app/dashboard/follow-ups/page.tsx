'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { appointmentsApi } from '@/lib/api';
import {
  AlertCircle, Phone, CalendarPlus, RefreshCw, Loader2,
  Stethoscope, ArrowLeft, CheckCircle2, BellRing,
} from 'lucide-react';
import { cn, formatDateTime, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

function daysOverdue(followUpDate: string) {
  const diffMs = Date.now() - new Date(followUpDate).getTime();
  return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

export default function FollowUpsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['appointments', 'missed-followups'],
    queryFn: () => appointmentsApi.getMissedFollowUps().then((r) => r.data),
  });

  const notifyMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.notifyFollowUp(id),
    onSuccess: () => {
      toast.success('Follow-up reminder sent to patient');
      qc.invalidateQueries({ queryKey: ['appointments', 'missed-followups'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    },
  });

  const followUps = data || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 text-sm font-medium mb-5 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            Missed Follow-ups
          </h1>
          <p className="page-subtitle">
            Patients whose follow-up date has passed with no new visit booked. Reach out or schedule their next appointment.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary shrink-0 flex items-center gap-2 text-sm"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="card mt-6">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Couldn&apos;t load missed follow-ups</p>
            <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
            <p className="text-slate-700 font-semibold">No missed follow-ups</p>
            <p className="text-slate-400 text-sm mt-1">Every patient due for a follow-up has been rebooked or is on schedule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Follow-up Was Due</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {followUps.map((appt: any) => {
                  const patientUser = appt.patient?.user;
                  const doctorUser = appt.doctor?.user;
                  const phone = patientUser?.phone;
                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(patientUser?.firstName || '', patientUser?.lastName || '')}
                          </div>
                          <div className="min-w-0">
                            <Link href="/dashboard/patients" className="font-semibold text-slate-900 hover:text-cyan-600 transition-colors truncate block">
                              {patientUser?.firstName} {patientUser?.lastName}
                            </Link>
                            <p className="text-xs text-slate-400">{phone || 'No phone on file'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                          Dr. {doctorUser?.firstName} {doctorUser?.lastName}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-800">{formatDateTime(appt.followUpDate)}</p>
                        <span className="badge bg-red-100 text-red-800 text-[10px] mt-1 inline-block">
                          {daysOverdue(appt.followUpDate)} day{daysOverdue(appt.followUpDate) === 1 ? '' : 's'} overdue
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 max-w-[220px] truncate">
                        {appt.followUpNotes || '—'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="btn bg-slate-50 hover:bg-slate-100 text-slate-700 py-1.5 px-2.5 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all"
                              title="Call patient"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Call
                            </a>
                          )}
                          <button
                            onClick={() => notifyMutation.mutate(appt.id)}
                            disabled={notifyMutation.isPending && notifyMutation.variables === appt.id}
                            className="btn bg-amber-50 hover:bg-amber-100 text-amber-700 py-1.5 px-2.5 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                            title="Send the patient a reminder to book their follow-up"
                          >
                            {notifyMutation.isPending && notifyMutation.variables === appt.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <BellRing className="w-3.5 h-3.5" />
                            )}
                            Notify
                          </button>
                          <Link
                            href={`/dashboard/appointments/new?patientId=${appt.patient?.id}&doctorId=${appt.doctor?.id}`}
                            className="btn bg-cyan-600 hover:bg-cyan-700 text-white py-1.5 px-2.5 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            Schedule Follow-up
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
