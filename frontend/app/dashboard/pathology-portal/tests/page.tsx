'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pathologyCatalogApi } from '@/lib/api';
import { Microscope, Plus, Search, Loader2, Sparkles, Pencil, Trash2, ListPlus } from 'lucide-react';
import toast from 'react-hot-toast';

type ParameterForm = {
  name: string;
  unit: string;
  resultType: string;
  options: string;
  refRangeLow: string;
  refRangeHigh: string;
  refRangeText: string;
  criticalRangeLow: string;
  criticalRangeHigh: string;
  criticalRangeText: string;
};

type TestForm = {
  name: string;
  code: string;
  category: string;
  department: string;
  sampleType: string;
  container: string;
  method: string;
  price: string;
  turnaroundHours: string;
  fastingRequired: boolean;
  homeCollectionSupported: boolean;
  isActive: boolean;
  parameters: ParameterForm[];
  masterTestId: string | null;
};

const emptyParameter: ParameterForm = {
  name: '',
  unit: '',
  resultType: 'NUMERIC',
  options: '',
  refRangeLow: '',
  refRangeHigh: '',
  refRangeText: '',
  criticalRangeLow: '',
  criticalRangeHigh: '',
  criticalRangeText: '',
};

const emptyForm: TestForm = {
  name: '',
  code: '',
  category: '',
  department: '',
  sampleType: 'BLOOD',
  container: '',
  method: '',
  price: '',
  turnaroundHours: '',
  fastingRequired: false,
  homeCollectionSupported: true,
  isActive: true,
  parameters: [],
  masterTestId: null,
};

const sampleTypeOptions = ['BLOOD', 'URINE', 'STOOL', 'SPUTUM', 'SWAB', 'CSF', 'TISSUE', 'BIOPSY', 'FNAC', 'BODY_FLUID', 'OTHER'];
const resultTypeOptions = [
  { value: 'NUMERIC', label: 'Numeric' },
  { value: 'TEXT', label: 'Text' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'POSITIVE_NEGATIVE', label: 'Positive / Negative' },
  { value: 'REACTIVE_NONREACTIVE', label: 'Reactive / Non-reactive' },
  { value: 'NORMAL_ABNORMAL', label: 'Normal / Abnormal' },
];

export default function PathologyTestCatalogPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestForm>(emptyForm);

  const { data: tests, isLoading } = useQuery({
    queryKey: ['pathology-tests', searchQuery],
    queryFn: () => pathologyCatalogApi.getAll(searchQuery || undefined).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pathologyCatalogApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pathology-tests'] });
      toast.success('Test updated');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update test'),
  });

  const openEditModal = (test: any) => {
    setEditingId(test.id);
    setForm({
      name: test.name || '',
      code: test.code || '',
      category: test.category || '',
      department: test.department || '',
      sampleType: test.sampleType || 'BLOOD',
      container: test.container || '',
      method: test.method || '',
      price: String(test.price ?? ''),
      turnaroundHours: test.turnaroundHours != null ? String(test.turnaroundHours) : '',
      fastingRequired: !!test.fastingRequired,
      homeCollectionSupported: test.homeCollectionSupported !== false,
      isActive: test.isActive !== false,
      masterTestId: test.masterTestId || null,
      parameters: (test.parameters || [])
        .slice()
        .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((p: any) => ({
          name: p.name || '',
          unit: p.unit || '',
          resultType: p.resultType || 'NUMERIC',
          options: (p.options || []).join(', '),
          refRangeLow: p.refRangeLow != null ? String(p.refRangeLow) : '',
          refRangeHigh: p.refRangeHigh != null ? String(p.refRangeHigh) : '',
          refRangeText: p.refRangeText || '',
          criticalRangeLow: p.criticalRangeLow != null ? String(p.criticalRangeLow) : '',
          criticalRangeHigh: p.criticalRangeHigh != null ? String(p.criticalRangeHigh) : '',
          criticalRangeText: p.criticalRangeText || '',
        })),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const addParameterRow = () => {
    setForm((prev) => ({ ...prev, parameters: [...prev.parameters, { ...emptyParameter }] }));
  };

  const removeParameterRow = (index: number) => {
    setForm((prev) => ({ ...prev, parameters: prev.parameters.filter((_, i) => i !== index) }));
  };

  const setParameter = (index: number, field: keyof ParameterForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      parameters: prev.parameters.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    const invalidParam = form.parameters.find((p) => !p.name.trim());
    if (invalidParam) {
      toast.error('Every parameter needs a name');
      return;
    }
    if (!editingId) return;
    const payload: any = {
      name: form.name.trim(),
      code: form.code || undefined,
      category: form.category || undefined,
      department: form.department || undefined,
      sampleType: form.sampleType,
      container: form.container || undefined,
      method: form.method || undefined,
      price: Number(form.price),
      turnaroundHours: form.turnaroundHours ? Number(form.turnaroundHours) : undefined,
      fastingRequired: form.fastingRequired,
      homeCollectionSupported: form.homeCollectionSupported,
      isActive: form.isActive,
      parameters: form.parameters.map((p, i) => ({
        name: p.name.trim(),
        unit: p.unit || undefined,
        resultType: p.resultType || undefined,
        options: p.resultType === 'DROPDOWN' && p.options
          ? p.options.split(',').map((o) => o.trim()).filter(Boolean)
          : undefined,
        refRangeLow: p.refRangeLow ? Number(p.refRangeLow) : undefined,
        refRangeHigh: p.refRangeHigh ? Number(p.refRangeHigh) : undefined,
        refRangeText: p.refRangeText || undefined,
        criticalRangeLow: p.criticalRangeLow ? Number(p.criticalRangeLow) : undefined,
        criticalRangeHigh: p.criticalRangeHigh ? Number(p.criticalRangeHigh) : undefined,
        criticalRangeText: p.criticalRangeText || undefined,
        displayOrder: i,
      })),
    };
    updateMutation.mutate({ id: editingId, data: payload });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Microscope className="w-6 h-6 text-cyan-600 shrink-0" />
            Test Catalog
          </h1>
          <p className="page-subtitle">Lab tests your facility offers, with reference parameters.</p>
        </div>
        <Link
          href="/dashboard/pathology-portal/tests/new"
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Test
        </Link>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, code or category..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading catalog...
          </div>
        ) : !tests || tests.length === 0 ? (
          <div className="text-center py-16">
            <Microscope className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No tests in your catalog yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAT</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Params</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {t.name}
                      {t.category && <p className="text-[11px] text-slate-400 font-normal">{t.category}</p>}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.department || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.sampleType}{t.container ? ` (${t.container})` : ''}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">₹{Number(t.price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.turnaroundHours ? `${t.turnaroundHours}h` : '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.parameters?.length || 0}</td>
                    <td className="py-3 px-4 text-xs">
                      {t.isActive !== false ? (
                        <span className="badge bg-emerald-50 text-emerald-700 text-[10px] font-bold">Active</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-600 text-[10px] font-bold">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-right">
                      <button
                        onClick={() => openEditModal(t)}
                        aria-label={`Edit ${t.name}`}
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              Edit Test
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Complete Blood Count"
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Hematology"
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Hematology"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Method</label>
                  <input
                    type="text"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    placeholder="e.g. Flow cytometry"
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sample Type</label>
                  <select
                    value={form.sampleType}
                    onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
                    className="input text-sm"
                  >
                    {sampleTypeOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Container</label>
                  <input
                    type="text"
                    value={form.container}
                    onChange={(e) => setForm({ ...form, container: e.target.value })}
                    placeholder="e.g. EDTA"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Turnaround (hours)</label>
                  <input
                    type="number"
                    value={form.turnaroundHours}
                    onChange={(e) => setForm({ ...form, turnaroundHours: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.fastingRequired}
                      onChange={(e) => setForm({ ...form, fastingRequired: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    Fasting required
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.homeCollectionSupported}
                    onChange={(e) => setForm({ ...form, homeCollectionSupported: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Home collection supported
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Active
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Parameters</label>
                  <button
                    type="button"
                    onClick={addParameterRow}
                    className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700"
                  >
                    <ListPlus className="w-3.5 h-3.5" /> Add Parameter
                  </button>
                </div>

                {form.parameters.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    No parameters yet. Add them if this test reports multiple values (e.g. Hemoglobin, WBC Count).
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.parameters.map((p, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Parameter name *"
                            value={p.name}
                            onChange={(e) => setParameter(i, 'name', e.target.value)}
                            className="input text-xs flex-1"
                          />
                          <input
                            type="text"
                            placeholder="Unit"
                            value={p.unit}
                            onChange={(e) => setParameter(i, 'unit', e.target.value)}
                            className="input text-xs w-24"
                          />
                          <button
                            type="button"
                            onClick={() => removeParameterRow(i)}
                            aria-label="Remove parameter"
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={p.resultType}
                            onChange={(e) => setParameter(i, 'resultType', e.target.value)}
                            className="input text-xs"
                          >
                            {resultTypeOptions.map((rt) => (
                              <option key={rt.value} value={rt.value}>{rt.label}</option>
                            ))}
                          </select>
                          {p.resultType === 'DROPDOWN' && (
                            <input
                              type="text"
                              placeholder="Options, comma separated"
                              value={p.options}
                              onChange={(e) => setParameter(i, 'options', e.target.value)}
                              className="input text-xs"
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Range low"
                            value={p.refRangeLow}
                            onChange={(e) => setParameter(i, 'refRangeLow', e.target.value)}
                            className="input text-xs"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Range high"
                            value={p.refRangeHigh}
                            onChange={(e) => setParameter(i, 'refRangeHigh', e.target.value)}
                            className="input text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Range text (e.g. Negative)"
                            value={p.refRangeText}
                            onChange={(e) => setParameter(i, 'refRangeText', e.target.value)}
                            className="input text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Critical below"
                            value={p.criticalRangeLow}
                            onChange={(e) => setParameter(i, 'criticalRangeLow', e.target.value)}
                            className="input text-xs border-red-100"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Critical above"
                            value={p.criticalRangeHigh}
                            onChange={(e) => setParameter(i, 'criticalRangeHigh', e.target.value)}
                            className="input text-xs border-red-100"
                          />
                          <input
                            type="text"
                            placeholder="Critical note"
                            value={p.criticalRangeText}
                            onChange={(e) => setParameter(i, 'criticalRangeText', e.target.value)}
                            className="input text-xs border-red-100"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
