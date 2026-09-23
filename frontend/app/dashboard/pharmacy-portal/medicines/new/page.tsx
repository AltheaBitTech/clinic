'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyMedicinesApi } from '@/lib/api';
import { ArrowLeft, Pill, Sparkles, Loader2, Plus } from 'lucide-react';
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

export default function NewPharmacyMedicinePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<MedicineForm>(emptyForm);

  const createMutation = useMutation({
    mutationFn: (payload: any) => pharmacyMedicinesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-medicines'] });
      toast.success('Medicine added to catalog');
      router.push('/dashboard/pharmacy-portal/medicines');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add medicine'),
  });

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
    createMutation.mutate(payload);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-5 sm:mb-8">
        <Link
          href="/dashboard/pharmacy-portal/medicines"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 shrink-0" /> Add Medicine to Catalog
        </h1>
        <p className="page-subtitle">Register a new medicine for your pharmacy to stock, sell and dispense.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Pill className="w-5 h-5 text-cyan-500" /> Medicine Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Paracetamol 500mg"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Generic Name</label>
              <input
                type="text"
                value={form.genericName}
                onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Brand Name</label>
              <input
                type="text"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Form</label>
              <select
                value={form.form}
                onChange={(e) => setForm({ ...form, form: e.target.value })}
                className="input"
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Strength</label>
              <input
                type="text"
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
                placeholder="e.g. 500mg"
                className="input"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={form.prescriptionRequired}
              onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-700">Requires a valid prescription to sell</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Patients will need to provide a doctor&apos;s prescription before this medicine can be dispensed.
              </span>
            </span>
          </label>
        </div>

        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-cyan-500" /> Pricing & Stock
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                MRP <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Sale Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Barcode</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reorder Level</label>
              <input
                type="number"
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/pharmacy-portal/medicines" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add to Catalog
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
