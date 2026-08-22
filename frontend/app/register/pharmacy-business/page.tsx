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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 px-4 py-10 sm:py-16 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[90px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10 animate-slide-up">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/arogyix-logo.svg" alt="Arogyix" width={36} height={36} className="drop-shadow-lg" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Arogyix</span>
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
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${iconClass}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h1>
      <p className="text-slate-400 text-sm max-w-sm mx-auto font-light leading-relaxed">{description}</p>
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
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
      <div className="flex items-center gap-3 pb-2 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-100 text-sm">{title}</h2>
          <p className="text-xs text-slate-500 font-light">{description}</p>
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
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-500 font-light">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  'w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm';
const inputWithIcon = `${inputBase} pl-10`;

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
          iconClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          title="Request submitted!"
          description="Our team will review your pharmacy registration shortly. You'll receive your login details by email once it's approved."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Register your pharmacy</h1>
        <p className="text-slate-400 mt-2 text-sm font-light max-w-md mx-auto leading-relaxed">
          Sign up your pharmacy business as an independent account on Arogyix — no hospital affiliation required.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-6" id="pharmacy-business-register-form">
          <FormSection icon={Store} title="Business Information" description="Core details about your pharmacy">
            <FormField id="pharmacy-business-name" label="Pharmacy Business Name" required error={errors.name}>
              <input
                id="pharmacy-business-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. MedPlus Pharmacy"
                className={`${inputBase} ${errors.name ? 'border-red-400/50 focus:ring-red-500/30' : ''}`}
              />
            </FormField>
          </FormSection>

          <FormSection icon={Phone} title="Contact Details" description="How we can reach you">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="pharmacy-business-phone" label="Phone Number" required error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="pharmacy-business-phone"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`${inputWithIcon} ${errors.phone ? 'border-red-400/50 focus:ring-red-500/30' : ''}`}
                  />
                </div>
              </FormField>
              <FormField
                id="pharmacy-business-email"
                label="Email Address"
                required
                error={errors.email}
                hint="This is also your login email."
              >
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="pharmacy-business-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="pharmacy@example.com"
                    className={`${inputWithIcon} ${errors.email ? 'border-red-400/50 focus:ring-red-500/30' : ''}`}
                  />
                </div>
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={MapPin} title="Address & Location" description="Physical location of the pharmacy">
            <FormField id="pharmacy-business-address" label="Street Address" required error={errors.address}>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="pharmacy-business-address"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="e.g. 12, MG Road, Koramangala"
                  className={`${inputWithIcon} ${errors.address ? 'border-red-400/50 focus:ring-red-500/30' : ''}`}
                />
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="pharmacy-business-city" label="City">
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="pharmacy-business-city"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Bengaluru"
                    className={inputWithIcon}
                  />
                </div>
              </FormField>
              <FormField id="pharmacy-business-state" label="State">
                <input
                  id="pharmacy-business-state"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="Karnataka"
                  className={inputBase}
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
                  className={`${inputBase} ${errors.firstName ? 'border-red-400/50 focus:ring-red-500/30' : ''}`}
                />
              </FormField>
              <FormField id="pharmacy-business-last-name" label="Last Name" required error={errors.lastName}>
                <input
                  id="pharmacy-business-last-name"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Shah"
                  className={`${inputBase} ${errors.lastName ? 'border-red-400/50 focus:ring-red-500/30' : ''}`}
                />
              </FormField>
            </div>
          </FormSection>

          <button
            id="submit-pharmacy-business-registration-btn"
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-600/10 cursor-pointer active:scale-[0.98]"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
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

        <p className="mt-6 text-center text-sm text-slate-400 font-light">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

export default function PharmacyBusinessRegisterPage() {
  return <PharmacyBusinessRegisterForm />;
}
