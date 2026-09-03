'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { pharmaciesApi } from '@/lib/api';
import { isValidPhone } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Store, Phone, Mail, MapPin, Clock, Truck, FileText,
  User, Check, AlertCircle, Building2, Loader2, XCircle, PartyPopper, Lock, KeyRound,
} from 'lucide-react';

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
  firstName: string;
  lastName: string;
  password: string;
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
  firstName: '',
  lastName: '',
  password: '',
};

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/arogyix-logo.svg" alt="Arogyix" width={36} height={36} />
          <span className="text-xl font-bold tracking-tight text-slate-800">Arogyix</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  iconClass,
  title,
  description,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-10 text-center">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${iconClass}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-500 text-sm max-w-sm mx-auto">{description}</p>
      <Link href="/login" className="btn-primary inline-flex items-center gap-2 mt-6 text-sm">
        Go to login
      </Link>
    </div>
  );
}

function PharmacyRegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const inviteQuery = useQuery({
    queryKey: ['pharmacy-invite', token],
    queryFn: () => pharmaciesApi.getInvite(token as string).then((r) => r.data),
    enabled: !!token,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (data: FormData) => pharmaciesApi.completeInvite(token as string, data),
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Failed to submit registration. Please try again.',
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
    else if (!isValidPhone(form.phone)) errs.phone = 'Enter a valid 10-digit phone number';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required to create your login';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.password || form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = { ...form };
    const optionalFields: (keyof FormData)[] = [
      'ownerName', 'licenseNumber', 'city', 'state', 'pincode', 'openingHours', 'closingHours', 'notes',
    ];
    optionalFields.forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    submitMutation.mutate(payload);
  };

  if (!token) {
    return (
      <PageShell>
        <StatusCard
          icon={XCircle}
          iconClass="bg-red-50 text-red-500"
          title="Invalid registration link"
          description="This link is missing its invite token. Ask your clinic contact for a fresh registration link."
        />
      </PageShell>
    );
  }

  if (inviteQuery.isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-cyan-500 animate-spin" />
          <p className="text-sm text-slate-400">Checking your invite link…</p>
        </div>
      </PageShell>
    );
  }

  if (inviteQuery.isError) {
    const message =
      (inviteQuery.error as any)?.response?.data?.message ||
      'This invite link is invalid, expired, or has already been used.';
    return (
      <PageShell>
        <StatusCard
          icon={XCircle}
          iconClass="bg-red-50 text-red-500"
          title="This link can't be used"
          description={message}
        />
      </PageShell>
    );
  }

  if (submitMutation.isSuccess) {
    return (
      <PageShell>
        <StatusCard
          icon={PartyPopper}
          iconClass="bg-emerald-50 text-emerald-500"
          title="You're all set!"
          description={`${form.name} has been registered with ${inviteQuery.data?.tenantName || 'the clinic'}. Sign in with ${form.email} to manage your listing.`}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Register your pharmacy</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          You&apos;ve been invited to join{' '}
          <span className="font-semibold text-slate-700">
            {inviteQuery.data?.tenantName}
          </span>
          &apos;s pharmacy network. Fill in your details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="pharmacy-self-register-form">
        <FormSection icon={Store} title="Basic Information" description="Core details about the pharmacy">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="pharmacy-name" label="Pharmacy Name" required error={errors.name}>
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
          <FormField id="license-number" label="License / Registration Number" error={errors.licenseNumber}>
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

        <FormSection icon={Phone} title="Contact Details" description="How the clinic and patients can reach you">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="pharmacy-phone" label="Phone Number" required error={errors.phone}>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-phone"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  className={`input pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>
            <FormField id="pharmacy-email" label="Email Address" required error={errors.email}>
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
              <p className="text-[11px] text-slate-400">This is also your login email.</p>
            </FormField>
          </div>
        </FormSection>

        <FormSection icon={MapPin} title="Address & Location" description="Physical location of the pharmacy">
          <FormField id="pharmacy-address" label="Street Address" required error={errors.address}>
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

        <FormSection icon={Clock} title="Hours & Services" description="Operating hours and available services">
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
            id="pharmacy-notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. Accepts digital prescriptions, 24-hour emergency counter available…"
            rows={3}
            className="input resize-none"
          />
        </FormSection>

        <FormSection icon={KeyRound} title="Create Your Login" description="Used to sign in and manage your pharmacy listing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="pharmacy-first-name" label="Your First Name" required error={errors.firstName}>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-first-name"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Ramesh"
                  className={`input pl-10 ${errors.firstName ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>
            <FormField id="pharmacy-last-name" label="Your Last Name" required error={errors.lastName}>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-last-name"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Shah"
                  className={`input pl-10 ${errors.lastName ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>
          </div>
          <FormField id="pharmacy-password" label="Password" required error={errors.password}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="pharmacy-password"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Min 8 characters"
                className={`input pl-10 ${errors.password ? 'border-red-300' : ''}`}
              />
            </div>
          </FormField>
        </FormSection>

        <button
          id="submit-pharmacy-registration-btn"
          type="submit"
          disabled={submitMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Complete Registration
            </>
          )}
        </button>
      </form>
    </PageShell>
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

export default function PharmacyRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-cyan-500 animate-spin" />
        </div>
      }
    >
      <PharmacyRegisterForm />
    </Suspense>
  );
}
