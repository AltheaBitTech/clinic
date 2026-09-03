'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmaciesApi, pharmacyDashboardApi } from '@/lib/api';
import {
  Store, Phone, Mail, MapPin, Clock, Truck, FileText,
  User, Check, AlertCircle, Building2, Loader2, Pencil, X,
  Pill, Boxes, ClipboardList, TrendingDown, AlertTriangle, Receipt, ShoppingCart,
} from 'lucide-react';
import { formatDate, isValidPhone } from '@/lib/utils';
import toast from 'react-hot-toast';

type FormData = {
  name: string;
  ownerName: string;
  licenseNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  openingHours: string;
  closingHours: string;
  homeDeliveryAvailable: boolean;
  notes: string;
};

const toForm = (p: any): FormData => ({
  name: p?.name || '',
  ownerName: p?.ownerName || '',
  licenseNumber: p?.licenseNumber || '',
  phone: p?.phone || '',
  email: p?.email || '',
  address: p?.address || '',
  city: p?.city || '',
  state: p?.state || '',
  pincode: p?.pincode || '',
  openingHours: p?.openingHours || '',
  closingHours: p?.closingHours || '',
  homeDeliveryAvailable: !!p?.homeDeliveryAvailable,
  notes: p?.notes || '',
});

export default function PharmacyPortalPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: pharmacy, isLoading } = useQuery({
    queryKey: ['pharmacy-mine'],
    queryFn: () => pharmaciesApi.getMine().then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['pharmacy-dashboard-summary'],
    queryFn: () => pharmacyDashboardApi.getSummary().then((r) => r.data),
  });

  useEffect(() => {
    if (pharmacy) setForm(toForm(pharmacy));
  }, [pharmacy]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => pharmaciesApi.updateMine(data),
    onSuccess: () => {
      toast.success('Pharmacy details updated');
      queryClient.invalidateQueries({ queryKey: ['pharmacy-mine'] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update details');
    },
  });

  const set = (field: keyof FormData, value: any) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    if (!form) return false;
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Pharmacy name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!isValidPhone(form.phone)) errs.phone = 'Enter a valid 10-digit phone number';
    if (!form.address.trim()) errs.address = 'Address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;
    updateMutation.mutate(form);
  };

  const cancelEdit = () => {
    if (pharmacy) setForm(toForm(pharmacy));
    setErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!pharmacy || !form) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200 shrink-0">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">{pharmacy.name}</h1>
            <p className="page-subtitle">Manage your pharmacy&apos;s listing details</p>
          </div>
        </div>
        {!isEditing && (
          <button
            id="edit-pharmacy-profile-btn"
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit Details
          </button>
        )}
      </div>

      {!isEditing && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard icon={TrendingDown} label="Low Stock" value={summary?.lowStockCount ?? '—'} color="amber" />
            <SummaryCard icon={AlertTriangle} label="Expiring Soon" value={summary?.expiringSoonCount ?? '—'} color="red" />
            <SummaryCard icon={ClipboardList} label="Pending Rx" value={summary?.pendingPrescriptions ?? '—'} color="cyan" />
            <SummaryCard
              icon={Receipt}
              label="Today's Sales"
              value={summary ? `₹${Number(summary.todaysSalesTotal).toFixed(0)}` : '—'}
              color="emerald"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <QuickLink href="/dashboard/pharmacy-portal/medicines" icon={Pill} label="Medicine Catalog" />
            <QuickLink href="/dashboard/pharmacy-portal/inventory" icon={Boxes} label="Inventory" />
            <QuickLink href="/dashboard/pharmacy-portal/prescriptions" icon={ClipboardList} label="Prescriptions" />
            <QuickLink href="/dashboard/pharmacy-portal/suppliers" icon={Truck} label="Suppliers" />
            <QuickLink href="/dashboard/pharmacy-portal/purchases" icon={ShoppingCart} label="Purchase Orders" />
          </div>
        </>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto" id="edit-pharmacy-profile-form">
          <FormSection icon={Store} title="Basic Information" description="Core details about the pharmacy">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="edit-pharmacy-name" label="Pharmacy Name" required error={errors.name}>
                <input
                  id="edit-pharmacy-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={`input ${errors.name ? 'border-red-300' : ''}`}
                />
              </FormField>
              <FormField id="edit-owner-name" label="Owner / Manager Name">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-owner-name"
                    value={form.ownerName}
                    onChange={(e) => set('ownerName', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            </div>
            <FormField id="edit-license-number" label="License / Registration Number">
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="edit-license-number"
                  value={form.licenseNumber}
                  onChange={(e) => set('licenseNumber', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </FormField>
          </FormSection>

          <FormSection icon={Phone} title="Contact Details" description="How patients and the clinic can reach you">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="edit-pharmacy-phone" label="Phone Number" required error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-pharmacy-phone"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    className={`input pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                  />
                </div>
              </FormField>
              <FormField id="edit-pharmacy-email" label="Email Address">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-pharmacy-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={MapPin} title="Address & Location" description="Physical location of the pharmacy">
            <FormField id="edit-pharmacy-address" label="Street Address" required error={errors.address}>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="edit-pharmacy-address"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  className={`input pl-10 ${errors.address ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField id="edit-pharmacy-city" label="City">
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-pharmacy-city"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
              <FormField id="edit-pharmacy-state" label="State">
                <input
                  id="edit-pharmacy-state"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  className="input"
                />
              </FormField>
              <FormField id="edit-pharmacy-pincode" label="Pincode">
                <input
                  id="edit-pharmacy-pincode"
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value)}
                  className="input"
                  maxLength={6}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={Clock} title="Hours & Services" description="Operating hours and available services">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="edit-opening-hours" label="Opening Time">
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-opening-hours"
                    type="time"
                    value={form.openingHours}
                    onChange={(e) => set('openingHours', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
              <FormField id="edit-closing-hours" label="Closing Time">
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-closing-hours"
                    type="time"
                    value={form.closingHours}
                    onChange={(e) => set('closingHours', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            </div>
            <div
              id="edit-home-delivery-toggle"
              onClick={() => set('homeDeliveryAvailable', !form.homeDeliveryAvailable)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                form.homeDeliveryAvailable
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  form.homeDeliveryAvailable ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <Truck className={`w-5 h-5 ${form.homeDeliveryAvailable ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">Home Delivery Available</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable if you deliver medicines to patients&apos; homes
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  form.homeDeliveryAvailable ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                }`}
              >
                {form.homeDeliveryAvailable && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </FormSection>

          <FormSection icon={FileText} title="Additional Notes" description="Anything else the clinic should know">
            <textarea
              id="edit-pharmacy-notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </FormSection>

          <div className="flex items-center gap-3 pt-2">
            <button
              id="save-pharmacy-profile-btn"
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center gap-2 px-6 disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <button type="button" onClick={cancelEdit} className="btn-secondary flex items-center gap-2 text-sm px-6">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {pharmacy.homeDeliveryAvailable && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
              <Truck className="w-3.5 h-3.5" />
              Home Delivery Available
            </span>
          )}

          <Section title="Contact Information">
            <InfoRow icon={Phone} label="Phone" value={pharmacy.phone} />
            {pharmacy.email && <InfoRow icon={Mail} label="Email" value={pharmacy.email} />}
            {pharmacy.ownerName && (
              <InfoRow icon={User} label="Owner / Manager" value={pharmacy.ownerName} />
            )}
          </Section>

          <Section title="Location">
            <InfoRow icon={MapPin} label="Address" value={pharmacy.address} />
            {pharmacy.city && <InfoRow icon={Building2} label="City" value={pharmacy.city} />}
            {pharmacy.state && <InfoRow icon={Building2} label="State" value={pharmacy.state} />}
            {pharmacy.pincode && <InfoRow icon={MapPin} label="Pincode" value={pharmacy.pincode} />}
          </Section>

          {(pharmacy.openingHours || pharmacy.closingHours) && (
            <Section title="Operating Hours">
              {pharmacy.openingHours && (
                <InfoRow icon={Clock} label="Opens" value={pharmacy.openingHours} />
              )}
              {pharmacy.closingHours && (
                <InfoRow icon={Clock} label="Closes" value={pharmacy.closingHours} />
              )}
            </Section>
          )}

          {pharmacy.licenseNumber && (
            <Section title="Regulatory">
              <InfoRow icon={FileText} label="License No." value={pharmacy.licenseNumber} />
            </Section>
          )}

          {pharmacy.notes && (
            <Section title="Notes">
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{pharmacy.notes}</p>
            </Section>
          )}

          <p className="text-[11px] text-slate-400">
            Listed since {formatDate(pharmacy.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'amber' | 'red' | 'cyan' | 'emerald';
}) {
  const colorStyles: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorStyles[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-3 hover:border-cyan-200 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-cyan-600" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
    </Link>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-600" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
