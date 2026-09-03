'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacySuppliersApi } from '@/lib/api';
import { isValidPhone } from '@/lib/utils';
import { Truck, Plus, Search, Loader2, Sparkles, Pencil, Power } from 'lucide-react';
import toast from 'react-hot-toast';

type SupplierForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  licenseNo: string;
};

const emptyForm: SupplierForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  gstin: '',
  licenseNo: '',
};

export default function PharmacySuppliersPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['pharmacy-suppliers', searchQuery, showInactive],
    queryFn: () =>
      pharmacySuppliersApi
        .getAll({ search: searchQuery || undefined, includeInactive: showInactive || undefined })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => pharmacySuppliersApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers-all'] });
      toast.success('Supplier added');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add supplier'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pharmacySuppliersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers-all'] });
      toast.success('Supplier updated');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update supplier'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pharmacySuppliersApi.update(id, { isActive }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers-all'] });
      toast.success(variables.isActive ? 'Supplier reactivated' : 'Supplier deactivated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update supplier'),
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      gstin: supplier.gstin || '',
      licenseNo: supplier.licenseNo || '',
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
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      gstin: form.gstin || undefined,
      licenseNo: form.licenseNo || undefined,
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
            <Truck className="w-6 h-6 text-cyan-600 shrink-0" />
            Suppliers
          </h1>
          <p className="page-subtitle">Vendors you purchase medicine stock from.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="card mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name..."
            className="input pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show deactivated
        </label>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading suppliers...
          </div>
        ) : !suppliers || suppliers.length === 0 ? (
          <div className="text-center py-16">
            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No suppliers added yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GSTIN</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">License No.</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {s.name}
                      {s.address && <p className="text-[11px] text-slate-400 font-normal">{s.address}</p>}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {s.phone && <p>{s.phone}</p>}
                      {s.email && <p className="text-slate-400">{s.email}</p>}
                      {!s.phone && !s.email && '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{s.gstin || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{s.licenseNo || '—'}</td>
                    <td className="py-3 px-4 text-xs">
                      {s.isActive ? (
                        <span className="badge bg-emerald-50 text-emerald-700 text-[10px] font-bold">Active</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-600 text-[10px] font-bold">Deactivated</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(s)}
                        aria-label={`Edit ${s.name}`}
                        className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.isActive })}
                        disabled={toggleActiveMutation.isPending}
                        aria-label={s.isActive ? `Deactivate ${s.name}` : `Reactivate ${s.name}`}
                        className={`p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer ${
                          s.isActive ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              {editingId ? 'Edit Supplier' : 'Add Supplier'}
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
                  placeholder="e.g. Wellness Distributors Pvt Ltd"
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    inputMode="numeric"
                    maxLength={10}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">GSTIN</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">License No.</label>
                  <input
                    type="text"
                    value={form.licenseNo}
                    onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
