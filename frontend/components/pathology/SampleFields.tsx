'use client';

import { FlaskConical } from 'lucide-react';

export const SAMPLE_TYPE_OPTIONS = ['BLOOD', 'URINE', 'STOOL', 'SPUTUM', 'SWAB', 'CSF', 'TISSUE', 'BIOPSY', 'FNAC', 'BODY_FLUID', 'OTHER'];

const formatSampleType = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

interface SampleFieldsProps {
  sampleType: string;
  container: string;
  turnaroundHours: string;
  onChange: (patch: { sampleType?: string; container?: string; turnaroundHours?: string }) => void;
}

const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';
const hintClass = 'mt-1 text-[11px] leading-snug text-slate-400';
// 16px text on phones stops iOS Safari from zooming into the field on focus.
const inputClass = 'input text-base sm:text-sm';

/**
 * Sample Type / Container / Turnaround block for the lab test forms.
 * Stacks one field per row on phones, pairs Sample Type + Container on
 * tablets, and only goes three-across once there's room (lg).
 */
export default function SampleFields({ sampleType, container, turnaroundHours, onChange }: SampleFieldsProps) {
  return (
    <fieldset className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
      <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <FlaskConical className="w-3.5 h-3.5 text-cyan-600" /> Sample &amp; Turnaround
      </legend>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
        <div className="min-w-0">
          <label htmlFor="sampleType" className={labelClass}>Sample Type</label>
          <select
            id="sampleType"
            value={sampleType}
            onChange={(e) => onChange({ sampleType: e.target.value })}
            className={inputClass}
          >
            {SAMPLE_TYPE_OPTIONS.map((s) => (
              <option key={s} value={s}>{formatSampleType(s)}</option>
            ))}
          </select>
          <p className={hintClass}>What is collected from the patient.</p>
        </div>

        <div className="min-w-0">
          <label htmlFor="container" className={labelClass}>Container</label>
          <input
            id="container"
            type="text"
            value={container}
            onChange={(e) => onChange({ container: e.target.value })}
            placeholder="e.g. EDTA tube"
            className={inputClass}
          />
          <p className={hintClass}>Tube or vessel the sample goes in.</p>
        </div>

        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor="turnaroundHours" className={labelClass}>Turnaround Time</label>
          <div className="relative">
            <input
              id="turnaroundHours"
              type="number"
              inputMode="numeric"
              min={0}
              value={turnaroundHours}
              onChange={(e) => onChange({ turnaroundHours: e.target.value })}
              placeholder="e.g. 24"
              className={`${inputClass} pr-14`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
              hours
            </span>
          </div>
          <p className={hintClass}>Time from sample receipt to report.</p>
        </div>
      </div>
    </fieldset>
  );
}
