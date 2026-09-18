'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalLabLinksApi } from '@/lib/api';
import { Share2, Loader2, Building2, Check, X, Ban } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  REVOKED: 'bg-slate-200 text-slate-600',
};

export default function PathologyHospitalLinksPage() {
  const qc = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ['pathology-hospital-links-incoming'],
    queryFn: () => hospitalLabLinksApi.getIncoming().then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => hospitalLabLinksApi.approve(id),
    onSuccess: () => {
      toast.success('Hospital link approved');
      qc.invalidateQueries({ queryKey: ['pathology-hospital-links-incoming'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => hospitalLabLinksApi.reject(id),
    onSuccess: () => {
      toast.success('Hospital link rejected');
      qc.invalidateQueries({ queryKey: ['pathology-hospital-links-incoming'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => hospitalLabLinksApi.revoke(id),
    onSuccess: () => {
      toast.success('Hospital link revoked');
      qc.invalidateQueries({ queryKey: ['pathology-hospital-links-incoming'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to revoke'),
  });

  const isMutating = approveMutation.isPending || rejectMutation.isPending || revokeMutation.isPending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Share2 className="w-6 h-6 text-cyan-600 shrink-0" />
          Hospital Links
        </h1>
        <p className="page-subtitle">Hospitals requesting to send lab orders to your facility.</p>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading link requests...
          </div>
        ) : !links || links.length === 0 ? (
          <div className="text-center py-16">
            <Share2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No hospital link requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {links.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between gap-3 py-3 px-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{l.hospitalTenant?.name}</p>
                    <p className="text-xs text-slate-400">
                      {l.hospitalTenant?.city ? `${l.hospitalTenant.city} · ` : ''}
                      Requested {formatDate(l.requestedAt)}
                      {l.respondedAt ? ` · Responded ${formatDate(l.respondedAt)}` : ''}
                    </p>
                    {l.notes && <p className="text-xs text-slate-500 mt-0.5">{l.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge text-[10px] font-bold ${statusStyles[l.status] || 'bg-slate-100 text-slate-600'}`}>
                    {l.status}
                  </span>
                  {l.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(l.id)}
                        disabled={isMutating}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(l.id)}
                        disabled={isMutating}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                  {l.status === 'ACTIVE' && (
                    <button
                      onClick={() => revokeMutation.mutate(l.id)}
                      disabled={isMutating}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 px-2.5 py-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" /> Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
