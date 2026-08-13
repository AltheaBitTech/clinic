'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmaciesApi } from '@/lib/api';
import {
  Store, Phone, Mail, MapPin, Clock, Truck, FileText,
  User, ChevronLeft, Check, AlertCircle, Building2,
} from 'lucide-react';
import Link from 'next/link';
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

const INITIAL: FormData = {
  name: '',
  ownerName: '',
  licenseNumber: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  openingHours: '09:00',
  closingHours: '21:00',
  homeDeliveryAvailable: false,
  notes: '',
};

export default function EditPharmacyPage() {
  const { id } = useParams() as { id: string };
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: pharmacy, isLoading, isError } = useQuery({
    queryKey: ['pharmacy', id],
    queryFn: () => pharmaciesApi.getOne(id).then((r) => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (!pharmacy) return;
    setForm({
      name: pharmacy.name ?? '',
      ownerName: pharmacy.ownerName ?? '',
      licenseNumber: pharmacy.licenseNumber ?? '',
      phone: pharmacy.phone ?? '',
      email: pharmacy.email ?? '',
      address: pharmacy.address ?? '',
      city: pharmacy.city ?? '',
      state: pharmacy.state ?? '',
      pincode: pharmacy.pincode ?? '',
      openingHours: pharmacy.openingHours ?? '09:00',
      closingHours: pharmacy.closingHours ?? '21:00',
      homeDeliveryAvailable: !!pharmacy.homeDeliveryAvailable,
      notes: pharmacy.notes ?? '',
    });
  }, [pharmacy]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => pharmaciesApi.update(id, data),
    onSuccess: () => {
      toast.success('Pharmacy updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', id] });
      router.push('/dashboard/pharmacies');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Failed to update pharmacy. Please try again.',
      );
    },
  });

  const set = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Pharmacy name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
        <div className="h-6 w-40 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !pharmacy) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-300" />
          </div>
          <h3 className="text-slate-700 font-semibold text-lg mb-1">
            Pharmacy not found
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            We couldn't load this pharmacy. It may have been removed.
          </p>
          <Link href="/dashboard/pharmacies" className="btn-primary text-sm">
            Back to Pharmacies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/pharmacies"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Pharmacies
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200 shrink-0">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Pharmacy</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Update details for {pharmacy.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="edit-pharmacy-form">
        {/* ── Section 1: Basic Info ── */}
        <FormSection
          icon={Store}
          title="Basic Information"
          description="Core details about the pharmacy"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="pharmacy-name"
              label="Pharmacy Name"
              required
              error={errors.name}
            >
              <input
                id="pharmacy-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. MedPlus Pharmacy"
                className={`input ${errors.name ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
            </FormField>

            <FormField id="owner-name" label="Owner / Manager Name" error={errors.ownerName}>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="owner-name"
                  value={form.ownerName}
                  onChange={(e) => set('ownerName', e.target.value)}
                  placeholder="e.g. Ramesh Shah"
                  className="input pl-10"
                />
              </div>
            </FormField>
          </div>

          <FormField
            id="license-number"
            label="License / Registration Number"
            error={errors.licenseNumber}
          >
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="license-number"
                value={form.licenseNumber}
                onChange={(e) => set('licenseNumber', e.target.value)}
                placeholder="e.g. PH-2024-001234"
                className="input pl-10"
              />
            </div>
          </FormField>
        </FormSection>

        {/* ── Section 2: Contact ── */}
        <FormSection
          icon={Phone}
          title="Contact Details"
          description="How patients and the clinic can reach this pharmacy"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="pharmacy-phone"
              label="Phone Number"
              required
              error={errors.phone}
            >
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-phone"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`input pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>

            <FormField id="pharmacy-email" label="Email Address" error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="pharmacy@example.com"
                  className={`input pl-10 ${errors.email ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>
          </div>
        </FormSection>

        {/* ── Section 3: Address ── */}
        <FormSection
          icon={MapPin}
          title="Address & Location"
          description="Physical location of the pharmacy"
        >
          <FormField
            id="pharmacy-address"
            label="Street Address"
            required
            error={errors.address}
          >
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="pharmacy-address"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="e.g. 12, MG Road, Koramangala"
                className={`input pl-10 ${errors.address ? 'border-red-300' : ''}`}
              />
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField id="pharmacy-city" label="City">
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-city"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Bengaluru"
                  className="input pl-10"
                />
              </div>
            </FormField>
            <FormField id="pharmacy-state" label="State">
              <input
                id="pharmacy-state"
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                placeholder="Karnataka"
                className="input"
              />
            </FormField>
            <FormField id="pharmacy-pincode" label="Pincode">
              <input
                id="pharmacy-pincode"
                value={form.pincode}
                onChange={(e) => set('pincode', e.target.value)}
                placeholder="560034"
                className="input"
                maxLength={6}
              />
            </FormField>
          </div>
        </FormSection>

        {/* ── Section 4: Hours & Services ── */}
        <FormSection
          icon={Clock}
          title="Hours & Services"
          description="Operating hours and available services"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="opening-hours" label="Opening Time">
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="opening-hours"
                  type="time"
                  value={form.openingHours}
                  onChange={(e) => set('openingHours', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </FormField>
            <FormField id="closing-hours" label="Closing Time">
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="closing-hours"
                  type="time"
                  value={form.closingHours}
                  onChange={(e) => set('closingHours', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </FormField>
          </div>

          {/* Home Delivery Toggle */}
          <div
            id="home-delivery-toggle"
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
              <p className="font-semibold text-slate-800 text-sm">
                Home Delivery Available
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable if this pharmacy delivers medicines to patients' homes
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                form.homeDeliveryAvailable
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-300'
              }`}
            >
              {form.homeDeliveryAvailable && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
        </FormSection>

        {/* ── Section 5: Additional Notes ── */}
        <FormSection
          icon={FileText}
          title="Additional Notes"
          description="Any extra information about this pharmacy"
        >
          <textarea
            id="pharmacy-notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. Accepts digital prescriptions from Arogyix, 24-hour emergency counter available…"
            rows={3}
            className="input resize-none"
          />
        </FormSection>

        {/* ── Submit ── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            id="submit-pharmacy-btn"
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary flex items-center gap-2 px-6 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
          <Link
            href="/dashboard/pharmacies"
            className="btn-secondary text-sm px-6"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

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
