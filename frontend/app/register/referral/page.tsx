'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi, referralApi } from '@/lib/api';
import { isValidPhone } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Phone, Mail, MapPin, Building2, User, Lock, KeyRound,
  Check, AlertCircle, PartyPopper, Loader2,
} from 'lucide-react';

type FormData = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

const INITIAL: FormData = {
  email: '',
  firstName: '',
  lastName: '',
  password: '',
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

function ReferralRegisterForm() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const sendOtpMutation = useMutation({
    mutationFn: () => authApi.sendRegisterEmailOtp({ email: form.email, firstName: form.firstName }),
    onSuccess: () => {
      setOtpStep(true);
      toast.success('Verification code sent to your email');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not send verification code');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data: verified } = await authApi.verifyRegisterEmailOtp({
        email: form.email,
        otp: otpCode.trim(),
      });
      return referralApi.register({
        ...form,
        emailVerificationToken: verified.emailVerificationToken,
      });
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    },
  });

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.password.trim()) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.phone && !isValidPhone(form.phone)) errs.phone = 'Enter a valid 10-digit phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpStep) {
      if (!validate()) return;
      sendOtpMutation.mutate();
      return;
    }

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError('Enter the 6-digit code from your email');
      return;
    }
    registerMutation.mutate();
  };

  const isPending = sendOtpMutation.isPending || registerMutation.isPending;

  if (submitted) {
    return (
      <PageShell>
        <StatusCard
          icon={PartyPopper}
          iconClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          title="Signup submitted!"
          description="Our team will review your referral partner signup shortly. You'll receive an email with your referral code once it's approved."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Become a referral partner</h1>
        <p className="text-slate-400 mt-2 text-sm font-light max-w-md mx-auto leading-relaxed">
          Sign up independently on Arogyix — no hospital affiliation required. Refer hospitals and pharmacies and track them on your own dashboard.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-6" id="referral-register-form">
          <FormSection icon={User} title="Your Details" description="Who we'll create the login for">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="referral-first-name" label="First Name" required error={errors.firstName}>
                <input
                  id="referral-first-name"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Ramesh"
                  disabled={otpStep}
                  className={`${inputBase} ${errors.firstName ? 'border-red-400/50 focus:ring-red-500/30' : ''} disabled:opacity-60`}
                />
              </FormField>
              <FormField id="referral-last-name" label="Last Name" required error={errors.lastName}>
                <input
                  id="referral-last-name"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Shah"
                  disabled={otpStep}
                  className={`${inputBase} ${errors.lastName ? 'border-red-400/50 focus:ring-red-500/30' : ''} disabled:opacity-60`}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={Phone} title="Contact Details" description="How we can reach you">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="referral-email"
                label="Email Address"
                required
                error={errors.email}
                hint="This is also your login email."
              >
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="referral-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@example.com"
                    readOnly={otpStep}
                    className={`${inputWithIcon} ${errors.email ? 'border-red-400/50 focus:ring-red-500/30' : ''} read-only:opacity-60`}
                  />
                </div>
              </FormField>
              <FormField id="referral-phone" label="Phone Number" error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="referral-phone"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    disabled={otpStep}
                    className={`${inputWithIcon} ${errors.phone ? 'border-red-400/50 focus:ring-red-500/30' : ''} disabled:opacity-60`}
                  />
                </div>
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={MapPin} title="Address (optional)" description="Where you're based">
            <FormField id="referral-address" label="Street Address">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="referral-address"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="e.g. 12, MG Road, Koramangala"
                  disabled={otpStep}
                  className={`${inputWithIcon} disabled:opacity-60`}
                />
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="referral-city" label="City">
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="referral-city"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Bengaluru"
                    disabled={otpStep}
                    className={`${inputWithIcon} disabled:opacity-60`}
                  />
                </div>
              </FormField>
              <FormField id="referral-state" label="State">
                <input
                  id="referral-state"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="Karnataka"
                  disabled={otpStep}
                  className={`${inputBase} disabled:opacity-60`}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={Lock} title="Password" description="Set the password for your login">
            <FormField id="referral-password" label="Password" required error={errors.password} hint="Minimum 8 characters">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="referral-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Min 8 characters"
                  disabled={otpStep}
                  className={`${inputWithIcon} ${errors.password ? 'border-red-400/50 focus:ring-red-500/30' : ''} disabled:opacity-60`}
                />
              </div>
            </FormField>
          </FormSection>

          {otpStep && (
            <FormSection icon={KeyRound} title="Email Verification" description="Enter the code we sent you">
              <FormField id="referral-otp" label="Verification Code" error={otpError}>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="referral-otp"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setOtpError('');
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    className={`${inputWithIcon} tracking-[0.3em]`}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false);
                      setOtpCode('');
                      setOtpError('');
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => sendOtpMutation.mutate()}
                    disabled={isPending}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </FormField>
            </FormSection>
          )}

          <button
            id="submit-referral-registration-btn"
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-600/10 cursor-pointer active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                {otpStep ? 'Verifying…' : 'Sending code…'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {otpStep ? 'Verify and submit signup' : 'Send verification code'}
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

export default function ReferralRegisterPage() {
  return <ReferralRegisterForm />;
}
