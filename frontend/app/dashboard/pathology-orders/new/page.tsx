'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  pathologyOrdersApi, pathologyLabsApi, pathologyCatalogApi, hospitalLabLinksApi, patientsApi, doctorsApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft, FlaskConical, Loader2, Search, AlertCircle, Check,
} from 'lucide-react';
import { formatCurrency, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

function NewLabOrderContent() {
  const searchParams = useSearchParams();
  const initialLabId = searchParams.get('labId') || undefined;
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';

  const [labId, setLabId] = useState(initialLabId || '');
  const [patient, setPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
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

  const activeLabIds = new Set(links.filter((l: any) => l.status === 'ACTIVE').map((l: any) => l.labId));
  // Admins can see real link status, so filter strictly to ACTIVE-linked labs.
  // Other roles can't call the links endpoint (403) — fall back to showing all active
  // labs and let the create call's 403 (surfaced via toast) tell the user if unlinked.
  const linkedLabs = isAdmin || links.length > 0
    ? labs.filter((l: any) => activeLabIds.has(l.id))
    : labs;

  const { data: catalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['lab-catalog', labId],
    queryFn: () => pathologyCatalogApi.getForLab(labId).then((r) => r.data),
    enabled: !!labId,
  });

  useEffect(() => {
    setSelectedTestIds([]);
  }, [labId]);

  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
    );
  };

  const selectedTests = catalog.filter((t: any) => selectedTestIds.includes(t.id));
  const testsSubtotal = selectedTests.reduce((sum: number, t: any) => sum + Number(t.price), 0);

  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-search-lab-order', patientSearch],
    queryFn: () => patientsApi.getAll({ search: patientSearch, limit: 8 }).then((r) => r.data),
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-lab-order'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => pathologyOrdersApi.createForHospital(data),
    onSuccess: () => {
      toast.success('Lab order placed');
      qc.invalidateQueries({ queryKey: ['pathology-orders'] });
      router.push('/dashboard/pathology-orders');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId) {
      toast.error('Select a lab');
      return;
    }
    if (!patient) {
      toast.error('Select a patient');
      return;
    }
    if (selectedTestIds.length === 0) {
      toast.error('Select at least one test');
      return;
    }

    createMutation.mutate({
      labId,
      hospitalPatientId: patient.id,
      testIds: selectedTestIds,
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-5 sm:mb-8">
        <Link
          href="/dashboard/pathology-orders"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-cyan-600 shrink-0" /> New Lab Order
        </h1>
        <p className="page-subtitle">Place a pathology test order for one of your patients.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
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
            Tests
          </label>
          {!labId ? (
            <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-3">
              Select a lab to browse its test catalog.
            </p>
          ) : isLoadingCatalog ? (
            <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2 border border-slate-100 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Loading catalog...
            </div>
          ) : catalog.length === 0 ? (
            <p className="text-xs text-amber-600 border border-dashed border-amber-200 rounded-xl p-3">
              This lab hasn&apos;t published any tests yet.
            </p>
          ) : (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-50 max-h-56 overflow-y-auto">
              {catalog.map((t: any) => {
                const checked = selectedTestIds.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggleTest(t.id)}
                    className="w-full flex items-center justify-between gap-3 p-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          checked ? 'bg-cyan-600 border-cyan-600' : 'border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
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
                  </button>
                );
              })}
            </div>
          )}
          {selectedTests.length > 0 && (
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-slate-500">{selectedTests.length} test(s) selected</span>
              <span className="font-semibold text-slate-800">Subtotal: {formatCurrency(testsSubtotal)}</span>
            </div>
          )}
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
          <Link href="/dashboard/pathology-orders" className="btn-secondary flex-1 justify-center">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
            {createMutation.isPending ? 'Placing Order…' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewLabOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <NewLabOrderContent />
    </Suspense>
  );
}
