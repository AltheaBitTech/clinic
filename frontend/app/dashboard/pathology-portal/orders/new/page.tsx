'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pathologyOrdersApi, pathologyCatalogApi } from '@/lib/api';
import { ArrowLeft, Loader2, Sparkles, UserPlus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

type NewPatientForm = {
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
};

const emptyPatient: NewPatientForm = { name: '', phone: '', email: '', dateOfBirth: '', gender: '', address: '' };

export default function NewWalkInOrderPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [patientMode, setPatientMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingPatientId, setExistingPatientId] = useState('');
  const [patient, setPatient] = useState<NewPatientForm>(emptyPatient);
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [collectionType, setCollectionType] = useState('WALK_IN');
  const [scheduledAt, setScheduledAt] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [referringDoctorName, setReferringDoctorName] = useState('');
  const [referringDoctorPhone, setReferringDoctorPhone] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');

  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['pathology-tests-active'],
    queryFn: () => pathologyCatalogApi.getAll().then((r) => r.data),
  });

  const activeTests = useMemo(
    () => (tests || []).filter((t: any) => t.isActive !== false),
    [tests],
  );

  const visibleTests = useMemo(() => {
    if (!testSearch.trim()) return activeTests;
    const q = testSearch.trim().toLowerCase();
    return activeTests.filter((t: any) => t.name.toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q));
  }, [activeTests, testSearch]);

  const toggleTest = (id: string) => {
    setSelectedTestIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => pathologyOrdersApi.createWalkIn(payload),
    onSuccess: () => {
      toast.success('Walk-in order created');
      qc.invalidateQueries({ queryKey: ['pathology-orders'] });
      router.push('/dashboard/pathology-portal/orders');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create order'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestIds.length === 0) {
      toast.error('Select at least one test');
      return;
    }
    if (patientMode === 'EXISTING' && !existingPatientId.trim()) {
      toast.error('Enter the existing patient ID');
      return;
    }
    if (patientMode === 'NEW' && !patient.name.trim()) {
      toast.error('Patient name is required');
      return;
    }

    const payload: any = {
      testIds: selectedTestIds,
      collectionType: collectionType || undefined,
      scheduledAt: scheduledAt || undefined,
      collectionAddress: collectionAddress || undefined,
      referringDoctorName: referringDoctorName || undefined,
      referringDoctorPhone: referringDoctorPhone || undefined,
      commissionPercent: commissionPercent ? Number(commissionPercent) : undefined,
      discount: discount ? Number(discount) : undefined,
      notes: notes || undefined,
    };

    if (patientMode === 'EXISTING') {
      payload.patientId = existingPatientId.trim();
    } else {
      payload.patient = {
        name: patient.name.trim(),
        phone: patient.phone || undefined,
        email: patient.email || undefined,
        dateOfBirth: patient.dateOfBirth || undefined,
        gender: patient.gender || undefined,
        address: patient.address || undefined,
      };
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-5 sm:mb-8">
        <Link
          href="/dashboard/pathology-portal/orders"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 shrink-0" /> New Walk-in Order
        </h1>
        <p className="page-subtitle">Create a lab order for a walk-in patient.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</label>
            <div className="flex gap-1 ml-auto">
              <button
                type="button"
                onClick={() => setPatientMode('NEW')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  patientMode === 'NEW' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                New Patient
              </button>
              <button
                type="button"
                onClick={() => setPatientMode('EXISTING')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  patientMode === 'EXISTING' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                Existing Patient
              </button>
            </div>
          </div>

          {patientMode === 'EXISTING' ? (
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={existingPatientId}
                onChange={(e) => setExistingPatientId(e.target.value)}
                placeholder="Existing patient ID"
                className="input text-sm"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full name *"
                value={patient.name}
                onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                className="input text-sm col-span-2"
              />
              <input
                type="text"
                placeholder="Phone"
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="input text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={patient.email}
                onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                className="input text-sm"
              />
              <input
                type="date"
                placeholder="Date of birth"
                value={patient.dateOfBirth}
                onChange={(e) => setPatient({ ...patient, dateOfBirth: e.target.value })}
                className="input text-sm"
              />
              <select
                value={patient.gender}
                onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                className="input text-sm"
              >
                <option value="">Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <input
                type="text"
                placeholder="Address"
                value={patient.address}
                onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                className="input text-sm col-span-2"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tests <span className="text-red-500">*</span>
            {selectedTestIds.length > 0 && (
              <span className="ml-2 text-cyan-600 normal-case font-medium">{selectedTestIds.length} selected</span>
            )}
          </label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              placeholder="Search tests..."
              className="input text-xs pl-8 py-1.5"
            />
          </div>
          <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
            {testsLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
              </div>
            ) : visibleTests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No tests found.</p>
            ) : (
              visibleTests.map((t: any) => (
                <label
                  key={t.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTestIds.includes(t.id)}
                      onChange={() => toggleTest(t.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="font-medium text-slate-700">{t.name}</span>
                  </span>
                  <span className="text-slate-400">₹{Number(t.price).toFixed(0)}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Collection Type</label>
            <select value={collectionType} onChange={(e) => setCollectionType(e.target.value)} className="input text-sm">
              <option value="WALK_IN">Walk-in</option>
              <option value="HOME">Home Collection</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Scheduled At</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>

        {collectionType === 'HOME' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Collection Address</label>
            <input
              type="text"
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
              className="input text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Referring Doctor</label>
            <input
              type="text"
              value={referringDoctorName}
              onChange={(e) => setReferringDoctorName(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Doctor Phone</label>
            <input
              type="text"
              value={referringDoctorPhone}
              onChange={(e) => setReferringDoctorPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Commission %</label>
            <input
              type="number"
              step="0.01"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Discount (₹)</label>
            <input
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
          <Link href="/dashboard/pathology-portal/orders" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
