'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pathologyLabsApi, hospitalLabLinksApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  FlaskConical, Search, Phone, MapPin, Truck, ChevronRight, Link2, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const LINK_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  REVOKED: 'bg-slate-100 text-slate-500',
};

export default function PathologyLabsPage() {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';
  const queryClient = useQueryClient();

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ['pathology-labs', search],
    queryFn: () => pathologyLabsApi.getAll(search || undefined).then((r) => r.data),
  });

  // Link requests/approvals are a HOSPITAL_ADMIN-only endpoint on the backend.
  // For other roles the call 403s — treat that as "unknown status" rather than an error.
  const { data: links = [] } = useQuery({
    queryKey: ['hospital-lab-links'],
    queryFn: () =>
      hospitalLabLinksApi
        .getForHospital()
        .then((r) => r.data)
        .catch((err: any) => {
          if (err?.response?.status === 403) return [];
          throw err;
        }),
  });

  const linkByLabId = new Map<string, any>(links.map((l: any) => [l.labId, l]));

  const requestMutation = useMutation({
    mutationFn: (labId: string) => hospitalLabLinksApi.request({ labId }),
    onSuccess: () => {
      toast.success('Link request sent to the lab');
      queryClient.invalidateQueries({ queryKey: ['hospital-lab-links'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to request link'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => hospitalLabLinksApi.revoke(id),
    onSuccess: () => {
      toast.success('Link revoked');
      queryClient.invalidateQueries({ queryKey: ['hospital-lab-links'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to revoke link'),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-cyan-600 shrink-0" />
          Pathology Labs
        </h1>
        <p className="page-subtitle">
          Browse partner labs and manage your hospital&apos;s lab partnerships
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, city, or phone…"
          className="input pl-10"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : labs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-cyan-300" />
          </div>
          <h3 className="text-slate-700 font-semibold text-lg mb-1">No pathology labs found</h3>
          <p className="text-slate-400 text-sm max-w-xs">
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {labs.map((lab: any) => (
            <LabCard
              key={lab.id}
              lab={lab}
              link={linkByLabId.get(lab.id)}
              isAdmin={isAdmin}
              onRequest={() => requestMutation.mutate(lab.id)}
              onRevoke={(id: string) => revokeMutation.mutate(id)}
              requesting={requestMutation.isPending}
              revoking={revokeMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Lab Card ─────────────────────────────────────────────────────────────── */

function LabCard({
  lab,
  link,
  isAdmin,
  onRequest,
  onRevoke,
  requesting,
  revoking,
}: {
  lab: any;
  link: any;
  isAdmin: boolean;
  onRequest: () => void;
  onRevoke: (id: string) => void;
  requesting: boolean;
  revoking: boolean;
}) {
  const status = link?.status as string | undefined;

  return (
    <div className="card group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <Link href={`/dashboard/pathology-labs/${lab.id}`} className="block">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm leading-tight">{lab.name}</h3>
              {lab.ownerName && (
                <p className="text-xs text-slate-400 mt-0.5">{lab.ownerName}</p>
              )}
            </div>
          </div>
          {lab.homeCollectionAvailable && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
              <Truck className="w-3 h-3" />
              Home Collection
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{lab.phone}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {lab.address}
              {lab.city ? `, ${lab.city}` : ''}
              {lab.pincode ? ` - ${lab.pincode}` : ''}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs text-cyan-600 font-medium group-hover:underline">
          View details <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </Link>

      {isAdmin && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {status ? (
            <span className={`badge text-[10px] font-bold ${LINK_STATUS_STYLES[status] || 'bg-slate-100 text-slate-500'}`}>
              {status}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">No link yet</span>
          )}

          {status === 'ACTIVE' ? (
            <button
              onClick={() => onRevoke(link.id)}
              disabled={revoking}
              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" /> Revoke
            </button>
          ) : status === 'PENDING' ? (
            <span className="text-xs text-slate-400 font-medium px-2.5 py-1.5">Requested</span>
          ) : (
            <button
              onClick={onRequest}
              disabled={requesting}
              className="flex items-center gap-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              {requesting ? 'Requesting…' : status ? 'Request Again' : 'Request Link'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
