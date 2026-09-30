'use client';

import { Trash2 } from 'lucide-react';

export type ParameterForm = {
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

export const emptyParameter: ParameterForm = {
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

export const resultTypeOptions = [
  { value: 'NUMERIC', label: 'Numeric' },
  { value: 'TEXT', label: 'Text' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'POSITIVE_NEGATIVE', label: 'Positive / Negative' },
  { value: 'REACTIVE_NONREACTIVE', label: 'Reactive / Non-reactive' },
  { value: 'NORMAL_ABNORMAL', label: 'Normal / Abnormal' },
];

// Two-valued result types: [expected/normal value, the other value]. These
// have no numeric range — the reference and critical values are words.
export const QUALITATIVE_VALUES: Record<string, [string, string]> = {
  POSITIVE_NEGATIVE: ['Negative', 'Positive'],
  REACTIVE_NONREACTIVE: ['Non-reactive', 'Reactive'],
  NORMAL_ABNORMAL: ['Normal', 'Abnormal'],
};

// "Abnormal" isn't inherently critical, so that type starts with no critical value.
const DEFAULT_CRITICAL: Record<string, string> = {
  POSITIVE_NEGATIVE: 'Positive',
  REACTIVE_NONREACTIVE: 'Reactive',
  NORMAL_ABNORMAL: '',
};

const NUMERIC_FIELDS = ['refRangeLow', 'refRangeHigh', 'criticalRangeLow', 'criticalRangeHigh'] as const;

const isQualitative = (resultType: string) => resultType in QUALITATIVE_VALUES;

// Keeps only what can form a decimal number: digits, one '.', and a leading '-'.
const sanitizeNumber = (value: string) => {
  const negative = value.trimStart().startsWith('-');
  const [whole, ...rest] = value.replace(/[^0-9.]/g, '').split('.');
  const digits = rest.length ? `${whole}.${rest.join('')}` : whole;
  return negative ? `-${digits}` : digits;
};

const parseNumber = (value: string) => (value.trim() === '' ? undefined : Number(value));

export const fromApiParameter = (p: any): ParameterForm => ({
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
});

/**
 * Applies a single field edit. Changing the result type clears fields the new
 * type doesn't use, so hidden values never get saved.
 */
export const applyParameterChange = (p: ParameterForm, field: keyof ParameterForm, value: string): ParameterForm => {
  if ((NUMERIC_FIELDS as readonly string[]).includes(field)) {
    return { ...p, [field]: sanitizeNumber(value) };
  }
  if (field !== 'resultType' || value === p.resultType) {
    return { ...p, [field]: value };
  }

  const next: ParameterForm = { ...p, resultType: value };
  if (value !== 'NUMERIC') {
    NUMERIC_FIELDS.forEach((f) => (next[f] = ''));
  }
  if (value !== 'DROPDOWN') next.options = '';
  if (isQualitative(value)) {
    next.unit = '';
    next.refRangeText = QUALITATIVE_VALUES[value][0];
    next.criticalRangeText = DEFAULT_CRITICAL[value];
  } else if (isQualitative(p.resultType)) {
    next.refRangeText = '';
    next.criticalRangeText = '';
  }
  return next;
};

/** Returns an error message for the parameter, or null if it's valid. */
export const validateParameter = (p: ParameterForm): string | null => {
  const label = p.name.trim() || 'Parameter';
  if (!p.name.trim()) return 'Every parameter needs a name';
  if (p.resultType !== 'NUMERIC') return null;

  const [low, high, critLow, critHigh] = NUMERIC_FIELDS.map((f) => parseNumber(p[f]));
  if ([low, high, critLow, critHigh].some((n) => n !== undefined && !Number.isFinite(n))) {
    return `${label}: ranges must be valid numbers`;
  }
  if (low !== undefined && high !== undefined && low > high) {
    return `${label}: range low can't be greater than range high`;
  }
  if (critLow !== undefined && low !== undefined && critLow > low) {
    return `${label}: critical below can't be greater than range low`;
  }
  if (critHigh !== undefined && high !== undefined && critHigh < high) {
    return `${label}: critical above can't be less than range high`;
  }
  if (critLow !== undefined && critHigh !== undefined && critLow >= critHigh) {
    return `${label}: critical below must be less than critical above`;
  }
  return null;
};

export const toParameterPayload = (p: ParameterForm, displayOrder: number) => {
  const numeric = p.resultType === 'NUMERIC';
  return {
    name: p.name.trim(),
    unit: p.unit || undefined,
    resultType: p.resultType || undefined,
    options: p.resultType === 'DROPDOWN' && p.options
      ? p.options.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined,
    refRangeLow: numeric ? parseNumber(p.refRangeLow) : undefined,
    refRangeHigh: numeric ? parseNumber(p.refRangeHigh) : undefined,
    refRangeText: p.refRangeText || undefined,
    criticalRangeLow: numeric ? parseNumber(p.criticalRangeLow) : undefined,
    criticalRangeHigh: numeric ? parseNumber(p.criticalRangeHigh) : undefined,
    criticalRangeText: p.criticalRangeText || undefined,
    displayOrder,
  };
};

interface ParameterRowProps {
  parameter: ParameterForm;
  onChange: (field: keyof ParameterForm, value: string) => void;
  onRemove: () => void;
}

/**
 * One parameter definition in the lab test forms. Which reference fields show
 * depends on the result type: numeric ranges for NUMERIC, a normal/critical
 * value picker for two-valued types, and free text for TEXT/DROPDOWN.
 */
export default function ParameterRow({ parameter: p, onChange, onRemove }: ParameterRowProps) {
  const qualitative = QUALITATIVE_VALUES[p.resultType];
  // Keep a legacy free-text value selectable instead of silently swapping it out.
  const withCurrent = (values: string[], current: string) =>
    current && !values.includes(current) ? [...values, current] : values;

  const numberInput = (field: (typeof NUMERIC_FIELDS)[number], placeholder: string, extraClass = '') => (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={p[field]}
      onChange={(e) => onChange(field, e.target.value)}
      className={`input text-xs ${extraClass}`}
    />
  );

  return (
    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Parameter name *"
          value={p.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="input text-xs flex-1 min-w-0"
        />
        {!qualitative && (
          <input
            type="text"
            placeholder="Unit"
            value={p.unit}
            onChange={(e) => onChange('unit', e.target.value)}
            className="input text-xs w-20 sm:w-24"
          />
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove parameter"
          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          value={p.resultType}
          onChange={(e) => onChange('resultType', e.target.value)}
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
            onChange={(e) => onChange('options', e.target.value)}
            className="input text-xs"
          />
        )}
      </div>

      {p.resultType === 'NUMERIC' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {numberInput('refRangeLow', 'Range low')}
            {numberInput('refRangeHigh', 'Range high')}
            <input
              type="text"
              placeholder="Range text (e.g. Varies by age)"
              value={p.refRangeText}
              onChange={(e) => onChange('refRangeText', e.target.value)}
              className="input text-xs col-span-2 sm:col-span-1"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {numberInput('criticalRangeLow', 'Critical below', 'border-red-100')}
            {numberInput('criticalRangeHigh', 'Critical above', 'border-red-100')}
            <input
              type="text"
              placeholder="Critical note"
              value={p.criticalRangeText}
              onChange={(e) => onChange('criticalRangeText', e.target.value)}
              className="input text-xs border-red-100 col-span-2 sm:col-span-1"
            />
          </div>
        </>
      )}

      {qualitative && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[11px] font-semibold text-slate-500 mb-1">Normal result</span>
            <select
              value={p.refRangeText}
              onChange={(e) => onChange('refRangeText', e.target.value)}
              className="input text-xs"
            >
              {!p.refRangeText && <option value="" disabled>Select…</option>}
              {withCurrent(qualitative, p.refRangeText).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-slate-500 mb-1">Critical result</span>
            <select
              value={p.criticalRangeText}
              onChange={(e) => onChange('criticalRangeText', e.target.value)}
              className="input text-xs border-red-100"
            >
              <option value="">None</option>
              {withCurrent(qualitative, p.criticalRangeText).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {(p.resultType === 'TEXT' || p.resultType === 'DROPDOWN') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Reference text (e.g. Clear)"
            value={p.refRangeText}
            onChange={(e) => onChange('refRangeText', e.target.value)}
            className="input text-xs"
          />
          <input
            type="text"
            placeholder="Critical note"
            value={p.criticalRangeText}
            onChange={(e) => onChange('criticalRangeText', e.target.value)}
            className="input text-xs border-red-100"
          />
        </div>
      )}
    </div>
  );
}
