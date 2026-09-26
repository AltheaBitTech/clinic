'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pathologyLabsApi, hospitalLabLinksApi, pathologyCatalogApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft, FlaskConical, Phone, Mail, MapPin, Building2, Clock, Truck,
  FileText, User, Link2, XCircle, Loader2, ClipboardList, Timer, TestTube,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const LINK_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  REVOKED: 'bg-slate-100 text-slate-500',
};

export default function PathologyLabDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';
  const qc = useQueryClient();

  const { data: lab, isLoading } = useQuery({
    queryKey: ['pathology-lab', id],
    queryFn: () => pathologyLabsApi.getOne(id).then((r) => r.data),
  });

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

  const link = links.find((l: any) => l.labId === id);
  const status = link?.status as string | undefined;

  const { data: stats } = useQuery({
    queryKey: ['pathology-lab-stats', id],
    queryFn: () => pathologyLabsApi.getStats(id).then((r) => r.data),
  });

  const { data: catalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['lab-catalog', id],
    queryFn: () => pathologyCatalogApi.getForLab(id).then((r) => r.data),
    enabled: status === 'ACTIVE',
  });

  const requestMutation = useMutation({
    mutationFn: () => hospitalLabLinksApi.request({ labId: id }),
    onSuccess: () => {
      toast.success('Link request sent to the lab');
      qc.invalidateQueries({ queryKey: ['hospital-lab-links'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to request link'),
  });

  const revokeMutation = useMutation({
    mutationFn: () => hospitalLabLinksApi.revoke(link.id),
    onSuccess: () => {
      toast.success('Link revoked');
      qc.invalidateQueries({ queryKey: ['hospital-lab-links'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to revoke link'),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!lab) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-3xl mx-auto">
      <Link
        href="/dashboard/pathology-labs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pathology Labs
      </Link>

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="page-title">{lab.name}</h1>
            {lab.licenseNumber && <p className="page-subtitle">License: {lab.licenseNumber}</p>}
          </div>
        </div>
        {status && (
          <span className={`badge text-xs font-bold ${LINK_STATUS_STYLES[status] || 'bg-slate-100 text-slate-500'}`}>
            {status}
          </span>
        )}
      </div>

      <div className="card mb-6 flex flex-wrap gap-2">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
            lab.homeCollectionAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          {lab.homeCollectionAvailable
            ? `Home Collection Available${lab.homeCollectionFee ? ` · ₹${lab.homeCollectionFee}` : ''}`
            : 'No Home Collection'}
        </span>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
            lab.isActive ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {lab.isActive ? 'Active' : 'Inactive'}
        </span>
        {stats && stats.averageTurnaroundHours != null && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
            <Timer className="w-3.5 h-3.5" />
            Avg. turnaround: {stats.averageTurnaroundHours}h ({stats.sampleSize} reports)
          </span>
        )}
      </div>

      <div className="card mb-6 space-y-6">
        <Section title="Contact Information">
          <InfoRow icon={Phone} label="Phone" value={lab.phone} />
          {lab.email && <InfoRow icon={Mail} label="Email" value={lab.email} />}
          {lab.ownerName && <InfoRow icon={User} label="Owner / Manager" value={lab.ownerName} />}
        </Section>

        <Section title="Location">
          <InfoRow icon={MapPin} label="Address" value={lab.address} />
          {lab.city && <InfoRow icon={Building2} label="City" value={lab.city} />}
          {lab.state && <InfoRow icon={Building2} label="State" value={lab.state} />}
          {lab.pincode && <InfoRow icon={MapPin} label="Pincode" value={lab.pincode} />}
        </Section>

        {(lab.openingHours || lab.closingHours) && (
          <Section title="Operating Hours">
            {lab.openingHours && <InfoRow icon={Clock} label="Opens" value={lab.openingHours} />}
            {lab.closingHours && <InfoRow icon={Clock} label="Closes" value={lab.closingHours} />}
          </Section>
        )}

        {lab.accreditationNo && (
          <Section title="Regulatory">
            <InfoRow icon={FileText} label="Accreditation No." value={lab.accreditationNo} />
          </Section>
        )}

        {status === 'ACTIVE' && (
          <Section title="Test Catalog">
            {isLoadingCatalog ? (
              <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Loading catalog...
              </div>
            ) : catalog.length === 0 ? (
              <p className="text-sm text-slate-400">This lab hasn&apos;t published any tests yet.</p>
            ) : (
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {catalog.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <TestTube className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                        {t.turnaroundHours && (
                          <p className="text-[11px] text-slate-400">~{t.turnaroundHours}h turnaround</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 shrink-0">
                      {formatCurrency(t.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {lab.notes && (
          <Section title="Notes">
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{lab.notes}</p>
          </Section>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {status === 'ACTIVE' && (
          <Link
            href={`/dashboard/pathology-orders/new?labId=${lab.id}`}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <ClipboardList className="w-4 h-4" /> Place Order
          </Link>
        )}
        {isAdmin &&
          (status === 'ACTIVE' ? (
            <button
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              className="btn-secondary flex items-center gap-2 text-sm text-red-600"
            >
              <XCircle className="w-4 h-4" /> {revokeMutation.isPending ? 'Revoking…' : 'Revoke Link'}
            </button>
          ) : status === 'PENDING' ? (
            <button disabled className="btn-secondary flex items-center gap-2 text-sm opacity-60 cursor-not-allowed">
              <Link2 className="w-4 h-4" /> Link Requested
            </button>
          ) : (
            <button
              onClick={() => requestMutation.mutate()}
              disabled={requestMutation.isPending}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Link2 className="w-4 h-4" />
              {requestMutation.isPending ? 'Requesting…' : status ? 'Request Again' : 'Request Link'}
            </button>
          ))}
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
