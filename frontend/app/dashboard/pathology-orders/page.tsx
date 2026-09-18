'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  pathologyOrdersApi, pathologyLabsApi, hospitalLabLinksApi, patientsApi, doctorsApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import {
  ClipboardList, Plus, Loader2, ChevronRight, Search, FlaskConical, AlertCircle,
} from 'lucide-react';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'ALL' | 'ORDERED' | 'IN_PROGRESS' | 'REPORT_READY' | 'DELIVERED' | 'CANCELLED';

const tabs: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ORDERED', label: 'Ordered' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'REPORT_READY', label: 'Report Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const TAB_STATUSES: Record<Tab, string[] | null> = {
  ALL: null,
  ORDERED: ['ORDERED', 'SAMPLE_SCHEDULED', 'SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'ACCEPTED', 'SAMPLE_REJECTED', 'RECOLLECTION_REQUESTED'],
  IN_PROGRESS: ['IN_PROGRESS'],
  REPORT_READY: ['RESULT_READY', 'PENDING_VERIFICATION', 'VERIFIED'],
  DELIVERED: ['REPORT_DELIVERED'],
  CANCELLED: ['CANCELLED'],
};

const STATUS_STYLES: Record<string, string> = {
  ORDERED: 'bg-blue-50 text-blue-700',
  SAMPLE_SCHEDULED: 'bg-indigo-50 text-indigo-700',
  SAMPLE_COLLECTED: 'bg-indigo-50 text-indigo-700',
  RECEIVED_AT_LAB: 'bg-indigo-50 text-indigo-700',
  ACCEPTED: 'bg-indigo-50 text-indigo-700',
  SAMPLE_REJECTED: 'bg-red-50 text-red-700',
  RECOLLECTION_REQUESTED: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  RESULT_READY: 'bg-cyan-50 text-cyan-700',
  PENDING_VERIFICATION: 'bg-cyan-50 text-cyan-700',
  VERIFIED: 'bg-cyan-50 text-cyan-700',
  REPORT_DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

function PathologyOrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const labIdParam = searchParams.get('labId');
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(!!labIdParam);

  useEffect(() => {
    if (labIdParam) setIsModalOpen(true);
  }, [labIdParam]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['pathology-orders'],
    queryFn: () => pathologyOrdersApi.getAll().then((r) => r.data),
  });

  const list: any[] = Array.isArray(orders) ? orders : [];

  const filtered = useMemo(() => {
    const statuses = TAB_STATUSES[activeTab];
    return statuses ? list.filter((o) => statuses.includes(o.status)) : list;
  }, [list, activeTab]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (labIdParam) router.replace('/dashboard/pathology-orders');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-cyan-600 shrink-0" />
            Lab Orders
          </h1>
          <p className="page-subtitle">Track pathology test orders placed for your patients</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === key
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No orders in this queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order No</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lab</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Placed</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o: any) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/pathology-orders/${o.id}`} className="text-sm font-semibold text-cyan-600 hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{o.lab?.name || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{o.patient?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge text-[10px] font-bold ${STATUS_STYLES[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700 font-medium">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{formatDate(o.createdAt)}</td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/pathology-orders/${o.id}`}>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewOrderModal open={isModalOpen} onClose={closeModal} initialLabId={labIdParam || undefined} />
    </div>
  );
}

export default function PathologyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <PathologyOrdersContent />
    </Suspense>
  );
}

/* ── New Order Modal ─────────────────────────────────────────────────────── */

function NewOrderModal({
  open,
  onClose,
  initialLabId,
}: {
  open: boolean;
  onClose: () => void;
  initialLabId?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';

  const [labId, setLabId] = useState(initialLabId || '');
  const [patient, setPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [testIds, setTestIds] = useState('');
  const [collectionType, setCollectionType] = useState<'WALK_IN' | 'HOME'>('WALK_IN');
  const [scheduledAt, setScheduledAt] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [referringDoctorId, setReferringDoctorId] = useState('');
  const [referringDoctorName, setReferringDoctorName] = useState('');
  const [referringDoctorPhone, setReferringDoctorPhone] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialLabId) setLabId(initialLabId);
  }, [initialLabId]);

  const { data: labs = [] } = useQuery({
    queryKey: ['pathology-labs-all'],
    queryFn: () => pathologyLabsApi.getAll().then((r) => r.data),
    enabled: open,
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
    enabled: open,
  });

  const activeLabIds = new Set(links.filter((l: any) => l.status === 'ACTIVE').map((l: any) => l.labId));
  // Admins can see real link status, so filter strictly to ACTIVE-linked labs.
  // Other roles can't call the links endpoint (403) — fall back to showing all active
  // labs and let the create call's 403 (surfaced via toast) tell the user if unlinked.
  const linkedLabs = isAdmin || links.length > 0
    ? labs.filter((l: any) => activeLabIds.has(l.id))
    : labs;

  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-search-lab-order', patientSearch],
    queryFn: () => patientsApi.getAll({ search: patientSearch, limit: 8 }).then((r) => r.data),
    enabled: open,
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-lab-order'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
    enabled: open,
  });

  const reset = () => {
    setLabId(initialLabId || '');
    setPatient(null);
    setPatientSearch('');
    setTestIds('');
    setCollectionType('WALK_IN');
    setScheduledAt('');
    setCollectionAddress('');
    setReferringDoctorId('');
    setReferringDoctorName('');
    setReferringDoctorPhone('');
    setDiscount('');
    setNotes('');
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => pathologyOrdersApi.createForHospital(data),
    onSuccess: () => {
      toast.success('Lab order placed');
      qc.invalidateQueries({ queryKey: ['pathology-orders'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 403) {
        toast.error(message || "This hospital doesn't have an active link with that lab yet");
      } else {
        toast.error(message || 'Failed to place order');
      }
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTestIds = testIds.split(',').map((t) => t.trim()).filter(Boolean);
    if (!labId) {
      toast.error('Select a lab');
      return;
    }
    if (!patient) {
      toast.error('Select a patient');
      return;
    }
    if (parsedTestIds.length === 0) {
      toast.error('Enter at least one test ID');
      return;
    }

    createMutation.mutate({
      labId,
      hospitalPatientId: patient.id,
      testIds: parsedTestIds,
      ...(referringDoctorId ? { referringDoctorId } : {}),
      ...(!referringDoctorId && referringDoctorName ? { referringDoctorName } : {}),
      ...(!referringDoctorId && referringDoctorPhone ? { referringDoctorPhone } : {}),
      collectionType,
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      ...(collectionType === 'HOME' && collectionAddress ? { collectionAddress } : {}),
      ...(discount ? { discount: Number(discount) } : {}),
      ...(notes ? { notes } : {}),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogTitle>
          <FlaskConical className="w-5 h-5 text-cyan-600" /> New Lab Order
        </DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Lab</label>
            <select value={labId} onChange={(e) => setLabId(e.target.value)} className="input" required>
              <option value="">Select a linked lab…</option>
              {linkedLabs.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.city ? ` — ${l.city}` : ''}
                </option>
              ))}
            </select>
            {linkedLabs.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> No actively linked labs. Request a link first from the
                Pathology Labs page.
              </p>
            )}
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Patient</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={patientSearch}
                onFocus={() => setIsPatientDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsPatientDropdownOpen(false), 150)}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setPatient(null);
                  setIsPatientDropdownOpen(true);
                }}
                placeholder="Search patient by name, email, or code…"
                className="input pl-10"
              />
            </div>
            {isPatientDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-52 overflow-y-auto divide-y divide-slate-50">
                {isLoadingPatients ? (
                  <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Searching...
                  </div>
                ) : patientsData?.data?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No patients found.</div>
                ) : (
                  patientsData?.data?.map((p: any) => (
                    <div
                      key={p.id}
                      onMouseDown={() => {
                        setPatient(p);
                        setPatientSearch(`${p.user.firstName} ${p.user.lastName}`);
                        setIsPatientDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0">
                        {getInitials(p.user.firstName, p.user.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {p.user.firstName} {p.user.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{p.user.phone || p.user.email || 'No contact'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Test IDs (comma-separated)
            </label>
            <input
              type="text"
              value={testIds}
              onChange={(e) => setTestIds(e.target.value)}
              placeholder="e.g. cltest123, cltest456"
              className="input"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Ask the lab for their catalog test IDs — the lab will confirm exact tests during processing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Collection Type
              </label>
              <select
                value={collectionType}
                onChange={(e) => setCollectionType(e.target.value as 'WALK_IN' | 'HOME')}
                className="input"
              >
                <option value="WALK_IN">Walk-in</option>
                <option value="HOME">Home Collection</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Scheduled At
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {collectionType === 'HOME' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Collection Address
              </label>
              <input
                type="text"
                value={collectionAddress}
                onChange={(e) => setCollectionAddress(e.target.value)}
                className="input"
                placeholder="Address for home sample collection"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Referring Doctor (optional)
            </label>
            <select value={referringDoctorId} onChange={(e) => setReferringDoctorId(e.target.value)} className="input">
              <option value="">None</option>
              {(doctorsData?.data ?? []).map((d: any) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.firstName} {d.user.lastName}
                </option>
              ))}
            </select>
            {!referringDoctorId && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <input
                  type="text"
                  value={referringDoctorName}
                  onChange={(e) => setReferringDoctorName(e.target.value)}
                  placeholder="Or doctor name"
                  className="input text-sm"
                />
                <input
                  type="text"
                  value={referringDoctorPhone}
                  onChange={(e) => setReferringDoctorPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="input text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Discount</label>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={2}
              placeholder="Optional notes for the lab"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
