'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { prescriptionsApi, doctorsApi } from '@/lib/api';
import { ClipboardList, Plus, FileText, Pill, ChevronRight, Stethoscope, ChevronLeft, AlertTriangle, RefreshCw, Store, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function PrescriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';
  const canFilterByDoctor = !isPatient && !isDoctor;

  // Reset to page 1 whenever a filter changes so a narrower result set
  // doesn't strand the user on a now-empty later page.
  useEffect(() => {
    setPage(1);
  }, [search, date, doctorId]);

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
    enabled: canFilterByDoctor,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['prescriptions', page, search, date, doctorId, user?.id],
    queryFn: () =>
      prescriptionsApi
        .getAll({
          page,
          search: search || undefined,
          date: date || undefined,
          doctorId: isDoctor ? user?.doctor?.id : (doctorId || undefined),
        })
        .then((r) => r.data),
    enabled: !!user,
  });

  const hasFilters = !!(search || date || doctorId);
  const clearFilters = () => { setSearch(''); setDate(''); setDoctorId(''); };
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (rx: any) => {
    try {
      setDownloadingId(rx.id);
      const res = await prescriptionsApi.downloadPdf(rx.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${rx.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      // Backend not redeployed with the /pdf endpoint yet: fall back to the old static link.
      if (err?.response?.status === 404 && rx.pdfUrl) {
        window.open(`${BASE_URL}${rx.pdfUrl}`, '_blank', 'noreferrer');
        return;
      }
      // responseType is 'blob', so the JSON error body arrives as a Blob.
      const body = await err?.response?.data?.text?.().catch(() => '');
      let message = 'Failed to download prescription';
      try { message = JSON.parse(body).message || message; } catch {}
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className={`p-4 sm:p-6 lg:p-8 animate-fade-in ${!isPatient ? 'pb-24 sm:pb-28 lg:pb-28' : ''}`}>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{isPatient ? 'My Prescriptions' : 'Prescriptions'}</h1>
          <p className="page-subtitle">
            {isPatient ? 'Prescriptions issued to you, with downloadable PDFs' : 'Digital prescriptions with auto-generated PDFs'}
          </p>
        </div>
        {!isPatient && (
          <Link href="/dashboard/prescriptions/new" className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Write Prescription
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isPatient ? 'Search by doctor or diagnosis...' : 'Search by patient, doctor, or diagnosis...'}
            className="input pl-10"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-auto text-sm"
        />
        {canFilterByDoctor && (
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="">All Doctors</option>
            {doctorsData?.data?.map((d: any) => (
              <option key={d.id} value={d.id}>
                Dr. {d.user?.firstName} {d.user?.lastName}
              </option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 font-medium shrink-0">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
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
        ) : isError ? (
          <div className="card text-center py-16">
            <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Couldn&apos;t load prescriptions</p>
            <p className="text-slate-400 text-sm mt-1">Something went wrong. Please try again.</p>
            <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="card text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No prescriptions found</p>
            {hasFilters ? (
              <p className="text-slate-400 text-sm mt-1">Try adjusting or clearing your filters</p>
            ) : (
              !isPatient && (
                <Link href="/dashboard/prescriptions/new" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Write First Prescription
                </Link>
              )
            )}
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
                      {isPatient
                        ? `Dr. ${rx.doctor?.user?.firstName} ${rx.doctor?.user?.lastName}`
                        : `${rx.patient?.user?.firstName} ${rx.patient?.user?.lastName}`}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {isPatient
                        ? formatDate(rx.createdAt)
                        : <>Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName} · {formatDate(rx.createdAt)}</>}
                    </p>
                    {rx.diagnosis && <p className="text-xs text-slate-400 mt-1 italic">{rx.diagnosis}</p>}
                    {rx.pharmacy && (
                      <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" /> Sent to {rx.pharmacy.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleDownload(rx)} disabled={downloadingId === rx.id}
                      className="flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-700 border border-cyan-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                      <FileText className="w-4 h-4" /> {downloadingId === rx.id ? 'Downloading…' : 'PDF'}
                    </button>
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
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isPatient && (
        <Link
          href="/dashboard/prescriptions/new"
          className="btn-primary fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm shadow-lg sm:bottom-8 sm:right-8"
        >
          <Plus className="w-4 h-4" /> Write Prescription
        </Link>
      )}
    </div>
  );
}
