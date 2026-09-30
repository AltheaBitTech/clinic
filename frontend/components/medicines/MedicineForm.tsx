'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export type CatalogType = 'MEDICINE' | 'OINTMENT';

export type MedicineFormValues = {
  name: string;
  type: CatalogType;
  dosage: string;
  frequency: string;
  timing: string;
};

export const defaultMedicineForm = (type: CatalogType): MedicineFormValues => ({
  name: '',
  type,
  dosage: '',
  frequency: type === 'MEDICINE' ? 'Once daily' : 'As needed (PRN)',
  timing: type === 'MEDICINE' ? 'AFTER_FOOD' : 'AFTER_BATH',
});

export const toMedicinePayload = (form: MedicineFormValues) => ({
  name: form.name.trim(),
  type: form.type,
  dosage: form.dosage.trim() || undefined,
  frequency: form.frequency || undefined,
  timing: form.timing || undefined,
});

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Thrice daily',
  'Four times daily',
  'Before bed',
  'Morning',
  'As needed (PRN)',
];

const TIMINGS: Record<CatalogType, { value: string; label: string }[]> = {
  MEDICINE: [
    { value: 'AFTER_FOOD', label: 'After Food' },
    { value: 'BEFORE_FOOD', label: 'Before Food' },
  ],
  OINTMENT: [
    { value: 'AFTER_BATH', label: 'After Bath' },
    { value: 'BEFORE_SLEEPING', label: 'Before Sleeping' },
    { value: 'AFTER_WASHING_CLEANING_SKIN', label: 'After Washing/Cleaning the Skin' },
  ],
};

type Props = {
  initialValues: MedicineFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: MedicineFormValues) => void;
  cancelHref: string;
};

export default function MedicineForm({ initialValues, submitLabel, isSubmitting, onSubmit, cancelHref }: Props) {
  const [form, setForm] = useState<MedicineFormValues>(initialValues);
  const isMedicine = form.type === 'MEDICINE';

  const set = <K extends keyof MedicineFormValues>(key: K, value: MedicineFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const changeType = (type: CatalogType) => {
    if (type === form.type) return;
    // Timing options differ per type, so reset it to a valid default
    setForm((f) => ({ ...f, type, timing: TIMINGS[type][0].value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['MEDICINE', 'OINTMENT'] as CatalogType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeType(t)}
              className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                form.type === t
                  ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {t === 'MEDICINE' ? 'Oral Medicine' : 'Topical Ointment'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Item Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={isMedicine ? 'e.g. Paracetamol' : 'e.g. Betadine Ointment'}
          className="input text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Default Suggested Dosage (Optional)
        </label>
        <input
          type="text"
          value={form.dosage}
          onChange={(e) => set('dosage', e.target.value)}
          placeholder={isMedicine ? 'e.g. 500mg' : 'e.g. Apply twice daily'}
          className="input text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Suggested Frequency
          </label>
          <div className="relative">
            <select
              value={form.frequency}
              onChange={(e) => set('frequency', e.target.value)}
              className="input appearance-none pr-10 text-sm"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Suggested Timing
          </label>
          <div className="relative">
            <select
              value={form.timing}
              onChange={(e) => set('timing', e.target.value)}
              className="input appearance-none pr-10 text-sm"
            >
              {TIMINGS[form.type].map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" disabled={isSubmitting || !form.name.trim()} className="btn-primary">
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
