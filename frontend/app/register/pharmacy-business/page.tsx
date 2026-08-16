'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { tenantRequestsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Store, Phone, Mail, MapPin, Building2, User,
  Check, AlertCircle, PartyPopper, Loader2,
} from 'lucide-react';

type FormData = {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

const INITIAL: FormData = {
  name: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
};

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto">
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

function PharmacyBusinessRegisterForm() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const submitMutation = useMutation({
    mutationFn: (data: FormData) => tenantRequestsApi.create({ ...data, type: 'PHARMACY' }),
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || 'Failed to submit registration. Please try again.',
      );
    },
  });

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Pharmacy business name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required to create your login';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutation.mutate(form);
  };

  if (submitMutation.isSuccess) {
    return (
      <PageShell>
        <StatusCard
          icon={PartyPopper}
          iconClass="bg-emerald-50 text-emerald-500"
          title="Request submitted!"
          description="Our team will review your pharmacy registration shortly. You'll receive your login details by email once it's approved."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Register your pharmacy</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Sign up your pharmacy business as an independent account on Arogyix — no hospital affiliation required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="pharmacy-business-register-form">
        <FormSection icon={Store} title="Business Information" description="Core details about your pharmacy">
          <FormField id="pharmacy-business-name" label="Pharmacy Business Name" required error={errors.name}>
            <input
              id="pharmacy-business-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. MedPlus Pharmacy"
              className={`input ${errors.name ? 'border-red-300 focus:ring-red-200' : ''}`}
            />
          </FormField>
        </FormSection>

        <FormSection icon={Phone} title="Contact Details" description="How we can reach you">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="pharmacy-business-phone" label="Phone Number" required error={errors.phone}>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-business-phone"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`input pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>
            <FormField id="pharmacy-business-email" label="Email Address" required error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-business-email"
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
          <FormField id="pharmacy-business-address" label="Street Address" required error={errors.address}>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="pharmacy-business-address"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="e.g. 12, MG Road, Koramangala"
                className={`input pl-10 ${errors.address ? 'border-red-300' : ''}`}
              />
            </div>
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="pharmacy-business-city" label="City">
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pharmacy-business-city"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Bengaluru"
                  className="input pl-10"
                />
              </div>
            </FormField>
            <FormField id="pharmacy-business-state" label="State">
              <input
                id="pharmacy-business-state"
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                placeholder="Karnataka"
                className="input"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection icon={User} title="Owner Details" description="Who we'll create the login for">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="pharmacy-business-first-name" label="First Name" required error={errors.firstName}>
              <input
                id="pharmacy-business-first-name"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="Ramesh"
                className={`input ${errors.firstName ? 'border-red-300' : ''}`}
              />
            </FormField>
            <FormField id="pharmacy-business-last-name" label="Last Name" required error={errors.lastName}>
              <input
                id="pharmacy-business-last-name"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Shah"
                className={`input ${errors.lastName ? 'border-red-300' : ''}`}
              />
            </FormField>
          </div>
        </FormSection>

        <button
          id="submit-pharmacy-business-registration-btn"
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
              Submit Registration Request
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </PageShell>
  );
}

export default function PharmacyBusinessRegisterPage() {
  return <PharmacyBusinessRegisterForm />;
}
