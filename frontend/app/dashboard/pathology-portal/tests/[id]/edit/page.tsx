'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pathologyCatalogApi } from '@/lib/api';
import { ArrowLeft, Sparkles, ListPlus, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import SampleFields from '@/components/pathology/SampleFields';
import ParameterRow, {
  ParameterForm,
  applyParameterChange,
  emptyParameter,
  fromApiParameter,
  toParameterPayload,
  validateParameter,
} from '@/components/pathology/ParameterRow';

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
};

const toForm = (test: any): TestForm => ({
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
  parameters: (test.parameters || [])
    .slice()
    .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(fromApiParameter),
});

export default function EditPathologyTestPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<TestForm | null>(null);

  const { data: test, isLoading, isError, refetch } = useQuery({
    queryKey: ['pathology-test', id],
    queryFn: () => pathologyCatalogApi.getOne(id).then((r) => r.data),
    enabled: !!id,
  });

  // Seed the form once the test loads; later refetches shouldn't clobber
  // edits in progress.
  useEffect(() => {
    if (test && !form) setForm(toForm(test));
  }, [test, form]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => pathologyCatalogApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pathology-tests'] });
      qc.invalidateQueries({ queryKey: ['pathology-test', id] });
      toast.success('Test updated');
      router.push('/dashboard/pathology-portal/tests');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update test'),
  });

  const patchForm = (patch: Partial<TestForm>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const addParameterRow = () => {
    setForm((prev) => (prev ? { ...prev, parameters: [...prev.parameters, { ...emptyParameter }] } : prev));
  };

  const removeParameterRow = (index: number) => {
    setForm((prev) => (prev ? { ...prev, parameters: prev.parameters.filter((_, i) => i !== index) } : prev));
  };

  const setParameter = (index: number, field: keyof ParameterForm, value: string) => {
    setForm((prev) =>
      prev
        ? { ...prev, parameters: prev.parameters.map((p, i) => (i === index ? applyParameterChange(p, field, value) : p)) }
        : prev,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    const paramError = form.parameters.map(validateParameter).find(Boolean);
    if (paramError) {
      toast.error(paramError);
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
      isActive: form.isActive,
      parameters: form.parameters.map(toParameterPayload),
    };
    updateMutation.mutate(payload);
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
          <Sparkles className="w-6 h-6 text-cyan-600 shrink-0" /> Edit Test
        </h1>
        <p className="page-subtitle">Update this test&apos;s details and reference parameters.</p>
      </div>

      {isLoading || (test && !form) ? (
        <div className="card py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading test...
        </div>
      ) : isError || !form ? (
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Couldn&apos;t load this test</p>
          <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
            Retry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => patchForm({ name: e.target.value })}
              placeholder="e.g. Complete Blood Count"
              className="input text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => patchForm({ code: e.target.value })}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => patchForm({ category: e.target.value })}
                placeholder="e.g. Hematology"
                className="input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => patchForm({ department: e.target.value })}
                placeholder="e.g. Hematology"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Method</label>
              <input
                type="text"
                value={form.method}
                onChange={(e) => patchForm({ method: e.target.value })}
                placeholder="e.g. Flow cytometry"
                className="input text-sm"
              />
            </div>
          </div>

          <SampleFields
            sampleType={form.sampleType}
            container={form.container}
            turnaroundHours={form.turnaroundHours}
            onChange={patchForm}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => patchForm({ price: e.target.value })}
                className="input text-sm"
              />
            </div>
            <div className="flex items-end gap-4 sm:pb-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.fastingRequired}
                  onChange={(e) => patchForm({ fastingRequired: e.target.checked })}
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
                onChange={(e) => patchForm({ homeCollectionSupported: e.target.checked })}
                className="rounded border-slate-300"
              />
              Home collection supported
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => patchForm({ isActive: e.target.checked })}
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
                  <ParameterRow
                    key={i}
                    parameter={p}
                    onChange={(field, value) => setParameter(i, field, value)}
                    onRemove={() => removeParameterRow(i)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
            <Link href="/dashboard/pathology-portal/tests" className="btn-secondary text-center">
              Cancel
            </Link>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
