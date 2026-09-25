'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pathologyCatalogApi, pathologyMasterTestsApi } from '@/lib/api';
import { ArrowLeft, Sparkles, Search, ListPlus, Trash2 } from 'lucide-react';
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

export default function NewPathologyTestPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [masterSearch, setMasterSearch] = useState('');
  const [masterSuggestions, setMasterSuggestions] = useState<any[]>([]);
  const [isMasterSuggestionsOpen, setIsMasterSuggestionsOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: any) => pathologyCatalogApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pathology-tests'] });
      toast.success('Test added to catalog');
      router.push('/dashboard/pathology-portal/tests');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add test'),
  });

  const fetchMasterSuggestions = async (query: string) => {
    try {
      const response = await pathologyMasterTestsApi.getAll({ search: query || undefined, limit: 8 });
      const suggestions = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      setMasterSuggestions(suggestions);
      setIsMasterSuggestionsOpen(suggestions.length > 0);
    } catch (error) {
      console.error('Failed to fetch master test suggestions:', error);
    }
  };

  const selectMasterTest = (item: any) => {
    setMasterSearch(item.name);
    setIsMasterSuggestionsOpen(false);
    setForm((prev) => ({
      ...prev,
      name: item.name || '',
      code: item.code || '',
      category: item.category || '',
      department: item.department || '',
      sampleType: item.sampleType || 'BLOOD',
      container: item.container || '',
      method: item.method || '',
      turnaroundHours: item.turnaroundHours != null ? String(item.turnaroundHours) : '',
      fastingRequired: !!item.fastingRequired,
      homeCollectionSupported: item.homeCollectionSupported !== false,
      masterTestId: item.id,
      parameters: (item.parameters || [])
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
    }));
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
      masterTestId: form.masterTestId || undefined,
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
    createMutation.mutate(payload);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-5 sm:mb-8">
        <Link
          href="/dashboard/pathology-portal/tests"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Test Catalog
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 shrink-0" /> Add Test to Catalog
        </h1>
        <p className="page-subtitle">Add a lab test your facility offers, with reference parameters.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Import from master test list
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={masterSearch}
              onFocus={() => fetchMasterSuggestions(masterSearch)}
              onChange={(e) => {
                setMasterSearch(e.target.value);
                fetchMasterSuggestions(e.target.value);
              }}
              placeholder="Search common tests (CBC, LFT, Lipid Profile...)"
              className="input text-sm pl-8"
            />
          </div>
          {isMasterSuggestionsOpen && masterSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-50">
              {masterSuggestions.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => selectMasterTest(item)}
                  className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center"
                >
                  <span>{item.name}</span>
                  {item.category && (
                    <span className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">{item.category}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {isMasterSuggestionsOpen && (
            <div className="fixed inset-0 z-10" onClick={() => setIsMasterSuggestionsOpen(false)} />
          )}
        </div>

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
          <Link href="/dashboard/pathology-portal/tests" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? 'Saving...' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </div>
  );
}
