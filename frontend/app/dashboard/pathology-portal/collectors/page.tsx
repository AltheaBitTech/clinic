'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pathologyCollectorsApi } from '@/lib/api';
import { isValidPhone } from '@/lib/utils';
import { Truck, Plus, Loader2, Sparkles, Pencil, Power } from 'lucide-react';
import toast from 'react-hot-toast';

type CollectorForm = {
  name: string;
  phone: string;
};

const emptyForm: CollectorForm = { name: '', phone: '' };

export default function PathologyCollectorsPage() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectorForm>(emptyForm);

  const { data: collectors, isLoading } = useQuery({
    queryKey: ['pathology-collectors'],
    queryFn: () => pathologyCollectorsApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => pathologyCollectorsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pathology-collectors'] });
      toast.success('Collector added');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add collector'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pathologyCollectorsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pathology-collectors'] });
      toast.success('Collector updated');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update collector'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pathologyCollectorsApi.update(id, { isActive }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['pathology-collectors'] });
      toast.success(variables.isActive ? 'Collector reactivated' : 'Collector deactivated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update collector'),
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (collector: any) => {
    setEditingId(collector.id);
    setForm({ name: collector.name || '', phone: collector.phone || '' });
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
      toast.error('Collector name is required');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    const payload = { name: form.name.trim(), phone: form.phone || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-600 shrink-0" />
            Collectors
          </h1>
          <p className="page-subtitle">Staff who collect samples for home and walk-in orders.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Collector
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading collectors...
          </div>
        ) : !collectors || collectors.length === 0 ? (
          <div className="text-center py-16">
            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No collectors added yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{c.phone || '—'}</td>
                    <td className="py-3 px-4 text-xs">
                      {c.isActive !== false ? (
                        <span className="badge bg-emerald-50 text-emerald-700 text-[10px] font-bold">Active</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-600 text-[10px] font-bold">Deactivated</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(c)}
                        aria-label={`Edit ${c.name}`}
                        className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: c.id, isActive: !(c.isActive !== false) })}
                        disabled={toggleActiveMutation.isPending}
                        aria-label={c.isActive !== false ? `Deactivate ${c.name}` : `Reactivate ${c.name}`}
                        className={`p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer ${
                          c.isActive !== false
                            ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                            : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              {editingId ? 'Edit Collector' : 'Add Collector'}
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
                  placeholder="e.g. Ramesh Kumar"
                  className="input text-sm"
                />
              </div>
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

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Collector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
