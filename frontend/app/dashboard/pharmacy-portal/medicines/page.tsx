'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyMedicinesApi } from '@/lib/api';
import { Pill, Plus, Search, Loader2, Sparkles, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicineForm>(emptyForm);

  const { data: medicines, isLoading } = useQuery({
    queryKey: ['pharmacy-medicines', searchQuery],
    queryFn: () => pharmacyMedicinesApi.getAll({ search: searchQuery || undefined }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => pharmacyMedicinesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-medicines'] });
      toast.success('Medicine added to catalog');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add medicine'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pharmacyMedicinesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-medicines'] });
      toast.success('Medicine updated');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update medicine'),
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

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
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
        <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, generic name, brand or barcode..."
            className="input pl-10"
          />
        </div>
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
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
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
                    <td className="py-3 px-4 text-xs text-right">
                      <button
                        onClick={() => openEditModal(m)}
                        aria-label={`Edit ${m.name}`}
                        className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              {editingId ? 'Edit Medicine' : 'Add Medicine to Catalog'}
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
                  {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
