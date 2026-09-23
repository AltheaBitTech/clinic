'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyMedicinesApi } from '@/lib/api';
import { Pill, Plus, Search, Loader2, Sparkles, Pencil, Power, History, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

type MedicineForm = {
  name: string;
  genericName: string;
  brandName: string;
  form: string;
  strength: string;
  mrp: string;
  salePrice: string;
  barcode: string;
  reorderLevel: string;
  prescriptionRequired: boolean;
};

const emptyForm: MedicineForm = {
  name: '',
  genericName: '',
  brandName: '',
  form: 'TABLET',
  strength: '',
  mrp: '',
  salePrice: '',
  barcode: '',
  reorderLevel: '10',
  prescriptionRequired: false,
};

export default function PharmacyMedicinesPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicineForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [historyMedicine, setHistoryMedicine] = useState<any | null>(null);

  const { data: priceHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['pharmacy-medicine-price-history', historyMedicine?.id],
    queryFn: () => pharmacyMedicinesApi.getPriceHistory(historyMedicine.id).then((r) => r.data),
    enabled: !!historyMedicine,
  });

  const { data: medicines, isLoading } = useQuery({
    queryKey: ['pharmacy-medicines', searchQuery, showInactive],
    queryFn: () =>
      pharmacyMedicinesApi
        .getAll({ search: searchQuery || undefined, includeInactive: showInactive || undefined })
        .then((r) => r.data),
  });

  const totalPages = Math.max(1, Math.ceil((medicines?.length || 0) / PAGE_SIZE));
  const paginatedMedicines = medicines?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pharmacyMedicinesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-medicines'] });
      toast.success('Medicine updated');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update medicine'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pharmacyMedicinesApi.update(id, { isActive }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['pharmacy-medicines'] });
      toast.success(variables.isActive ? 'Medicine reactivated' : 'Medicine discontinued');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update medicine'),
  });

  const openEditModal = (medicine: any) => {
    setEditingId(medicine.id);
    setForm({
      name: medicine.name || '',
      genericName: medicine.genericName || '',
      brandName: medicine.brandName || '',
      form: medicine.form || 'TABLET',
      strength: medicine.strength || '',
      mrp: String(medicine.mrp ?? ''),
      salePrice: String(medicine.salePrice ?? ''),
      barcode: medicine.barcode || '',
      reorderLevel: String(medicine.reorderLevel ?? '10'),
      prescriptionRequired: !!medicine.prescriptionRequired,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mrp || !form.salePrice) {
      toast.error('Name, MRP and sale price are required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      genericName: form.genericName || undefined,
      brandName: form.brandName || undefined,
      form: form.form || undefined,
      strength: form.strength || undefined,
      mrp: Number(form.mrp),
      salePrice: Number(form.salePrice),
      barcode: form.barcode || undefined,
      reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : undefined,
      prescriptionRequired: form.prescriptionRequired,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    }
  };

  const isSaving = updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Pill className="w-6 h-6 text-cyan-600 shrink-0" />
            Medicine Catalog
          </h1>
          <p className="page-subtitle">Medicines your pharmacy stocks, sells and dispenses.</p>
        </div>
        <Link
          href="/dashboard/pharmacy-portal/medicines/new"
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Medicine
        </Link>
      </div>

      <div className="card mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, generic name, brand or barcode..."
            className="input pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
            className="rounded border-slate-300"
          />
          Show discontinued
        </label>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading catalog...
          </div>
        ) : !medicines || medicines.length === 0 ? (
          <div className="text-center py-16">
            <Pill className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No medicines in your catalog yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Form / Strength</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">MRP</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sale Price</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reorder Level</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rx</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMedicines.map((m: any, idx: number) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-cyan-50/30 transition-colors border-b border-slate-50 last:border-none ${
                      idx % 2 === 1 ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {m.name}
                      {m.genericName && <p className="text-[11px] text-slate-400 font-normal">{m.genericName}</p>}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{[m.form, m.strength].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">₹{Number(m.mrp).toFixed(2)}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">₹{Number(m.salePrice).toFixed(2)}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{m.reorderLevel}</td>
                    <td className="py-3 px-4 text-xs">
                      {m.prescriptionRequired ? (
                        <span className="badge bg-amber-50 text-amber-700 text-[10px] font-bold">Required</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {m.isActive ? (
                        <span className="badge bg-emerald-50 text-emerald-700 text-[10px] font-bold">Active</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-600 text-[10px] font-bold">Discontinued</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-right whitespace-nowrap">
                      <button
                        onClick={() => setHistoryMedicine(m)}
                        aria-label={`Price history for ${m.name}`}
                        title="Price history"
                        className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(m)}
                        aria-label={`Edit ${m.name}`}
                        className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: m.id, isActive: !m.isActive })}
                        disabled={toggleActiveMutation.isPending}
                        aria-label={m.isActive ? `Discontinue ${m.name}` : `Reactivate ${m.name}`}
                        title={m.isActive ? 'Discontinue this medicine' : 'Reactivate this medicine'}
                        className={`p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer ${
                          m.isActive ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {medicines && medicines.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{paginatedMedicines.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{medicines.length}</span> medicines
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-600 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              Edit Medicine
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg"
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Generic Name</label>
                  <input
                    type="text"
                    value={form.genericName}
                    onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    value={form.brandName}
                    onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Form</label>
                  <select
                    value={form.form}
                    onChange={(e) => setForm({ ...form, form: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="INJECTION">Injection</option>
                    <option value="OINTMENT">Ointment</option>
                    <option value="DROPS">Drops</option>
                    <option value="INHALER">Inhaler</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Strength</label>
                  <input
                    type="text"
                    value={form.strength}
                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                    placeholder="e.g. 500mg"
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    MRP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sale Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Barcode</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reorder Level</label>
                  <input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.prescriptionRequired}
                  onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Requires a valid prescription to sell
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-600" />
                Price History — {historyMedicine.name}
              </h3>
              <button
                onClick={() => setHistoryMedicine(null)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
              </div>
            ) : !priceHistory || priceHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No price changes recorded yet. The current MRP/sale price were set when this medicine was added.
              </p>
            ) : (
              <ul className="space-y-3">
                {priceHistory.map((h: any) => (
                  <li key={h.id} className="text-xs border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-700">{formatDateTime(h.changedAt)}</span>
                      <span className="text-slate-400">{h.changedBy}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        MRP: <span className="line-through text-slate-400">₹{Number(h.before?.mrp ?? 0).toFixed(2)}</span>{' '}
                        → <span className="font-semibold text-slate-800">₹{Number(h.after?.mrp ?? 0).toFixed(2)}</span>
                      </div>
                      <div>
                        Sale Price: <span className="line-through text-slate-400">₹{Number(h.before?.salePrice ?? 0).toFixed(2)}</span>{' '}
                        → <span className="font-semibold text-slate-800">₹{Number(h.after?.salePrice ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
