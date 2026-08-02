'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { prescriptionsApi } from '@/lib/api';
import { ClipboardList, Plus, FileText, Pill, ChevronRight, Stethoscope, ChevronLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function PrescriptionsPage() {
  const [page, setPage] = useState(1);
    const { user } = useAuth();
    console.log('Current user:', user);  
  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', page],
    queryFn: () => prescriptionsApi.getAll({ page, doctorId: user?.id }).then((r) => r.data),
  });
console.log('Fetched prescriptions data:', data);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="p-8 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="page-subtitle">Digital prescriptions with auto-generated PDFs</p>
        </div>
        <Link href="/dashboard/prescriptions/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Write Prescription
        </Link>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-slate-100 rounded w-48 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-64 mb-4" />
              <div className="flex gap-2">
                {[...Array(3)].map((_, j) => <div key={j} className="h-6 w-20 bg-slate-100 rounded-full" />)}
              </div>
            </div>
          ))
        ) : data?.data?.length === 0 ? (
          <div className="card text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No prescriptions found</p>
            <Link href="/dashboard/prescriptions/new" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Write First Prescription
            </Link>
          </div>
        ) : (
          data?.data?.map((rx: any) => {
            const oralMeds = (rx.medicines || []).filter((m: any) => m.type !== 'OINTMENT');
            const ointments = (rx.medicines || []).filter((m: any) => m.type === 'OINTMENT');

            return (
              <div key={rx.id} className="card card-hover">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {rx.patient?.user?.firstName} {rx.patient?.user?.lastName}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName} · {formatDate(rx.createdAt)}
                    </p>
                    {rx.diagnosis && <p className="text-xs text-slate-400 mt-1 italic">{rx.diagnosis}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {rx.pdfUrl && (
                      <a href={`${BASE_URL}${rx.pdfUrl}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors">
                        <FileText className="w-4 h-4" /> PDF
                      </a>
                    )}
                  </div>
                </div>

                {/* Oral Medicines */}
                {oralMeds.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Pill className="w-3 h-3 text-emerald-500" /> Prescribed Oral Medicines
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {oralMeds.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                          <Pill className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-slate-700">{m.name}</span>
                          <span className="text-xs text-slate-400">{m.dosage} · {m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ointments */}
                {ointments.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-violet-500" /> Prescribed Topical Ointments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ointments.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-lg px-3 py-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-violet-500" />
                          <span className="text-xs font-medium text-slate-700">{m.name}</span>
                          <span className="text-xs text-slate-400">{m.dosage} · {m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty medicines state */}
                {(rx.medicines || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">No medicines recorded</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
