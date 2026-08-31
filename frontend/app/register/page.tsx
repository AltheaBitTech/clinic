'use client';
import Image from 'next/image';

import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { tenantsApi, authApi } from '@/lib/api';
import { Loader2, User, Mail, Phone, Lock, ShieldCheck, Building2, Search, Check, ChevronDown, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
}

const selfSignupSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  tenantId: z.string().min(1, 'Please select your hospital'),
});

const inviteSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SelfSignupData = z.infer<typeof selfSignupSchema>;
type InviteData = z.infer<typeof inviteSchema>;

function HospitalPicker({
  selected,
  onSelect,
  error,
}: {
  selected: Hospital | null;
  onSelect: (hospital: Hospital) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(!selected);
  const [query, setQuery] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await tenantsApi.getPublic(query || undefined);
        if (!cancelled) setHospitals(data);
      } catch {
        if (!cancelled) setHospitals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Your hospital</label>

      {!open && selected ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between bg-white/[0.04] border border-white/15 rounded-xl pl-4 pr-3.5 py-3.5 text-left hover:border-cyan-400/50 transition-all"
        >
          <span className="flex items-center gap-2.5 text-sm text-white">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {selected.name}
              {selected.city && <span className="text-slate-400"> · {selected.city}</span>}
            </span>
          </span>
          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
            Change <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </button>
      ) : (
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospitals by name or city"
            className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm"
          />
          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
            {loading && (
              <div className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
              </div>
            )}
            {!loading && hospitals.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">No hospitals found.</div>
            )}
            {!loading && hospitals.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  onSelect(h);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-sm text-white">
                  {h.name}
                  {h.city && <span className="text-slate-400"> · {h.city}{h.state ? `, ${h.state}` : ''}</span>}
                </span>
                {selected?.id === h.id && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

function RegisterForm() {
  const { register: authRegister, acceptInvite } = useAuth();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');
  const hospitalSlug = searchParams.get('hospital');
  const [loading, setLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<SelfSignupData | InviteData>({
    resolver: zodResolver(inviteToken ? inviteSchema : selfSignupSchema),
  });

  useEffect(() => {
    if (!hospitalSlug || inviteToken) return;
    tenantsApi.getPublic(hospitalSlug).then(({ data }) => {
      const match = (data as Hospital[]).find((h) => h.slug === hospitalSlug);
      if (match) {
        setSelectedHospital(match);
        setValue('tenantId' as any, match.id);
      }
    }).catch(() => {});
  }, [hospitalSlug, inviteToken, setValue]);

  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setValue('tenantId' as any, hospital.id, { shouldValidate: true });
  };

  const apiErrorMessage = (err: any, fallback: string) =>
    err.response?.data?.message || fallback;

  const onSubmit = async (data: SelfSignupData | InviteData) => {
    setLoading(true);
    setOtpError('');
    try {
      if (inviteToken) {
        await acceptInvite({ ...data, token: inviteToken });
        toast.success('Account activated!');
        return;
      }

      const signup = data as SelfSignupData;
      if (!otpStep) {
        await authApi.sendRegisterEmailOtp({
          email: signup.email,
          firstName: signup.firstName,
        });
        setOtpStep(true);
        toast.success('Verification code sent to your email');
        return;
      }

      if (!/^\d{6}$/.test(otpCode.trim())) {
        setOtpError('Enter the 6-digit code from your email');
        return;
      }

      const { data: verified } = await authApi.verifyRegisterEmailOtp({
        email: signup.email,
        otp: otpCode.trim(),
      });
      await authRegister({
        ...signup,
        emailVerificationToken: verified.emailVerificationToken,
      });
      toast.success('Account created!');
    } catch (err: any) {
      toast.error(apiErrorMessage(err, otpStep ? 'Verification failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const signup = getValues() as SelfSignupData;
    if (!signup.email) return;
    setLoading(true);
    setOtpError('');
    try {
      await authApi.sendRegisterEmailOtp({
        email: signup.email,
        firstName: signup.firstName,
      });
      toast.success('A new verification code was sent');
    } catch (err: any) {
      toast.error(apiErrorMessage(err, 'Could not resend code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[90px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <Image src="/arogyix-logo.svg" alt="Arogyix" width={42} height={42} className="drop-shadow-lg" />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Arogyix</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {inviteToken ? 'Activate your account' : 'Create your account'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-light">
            {inviteToken ? 'You were invited to join a hospital team' : 'Register as a patient to get started'}
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          {inviteToken && (
            <div className="mb-5 flex items-start gap-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3.5 py-3 text-xs text-cyan-200">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Set a password to activate the account for the email you were invited with. Your role and hospital are already assigned.</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">First name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    {...register('firstName')}
                    placeholder="John"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-10 pr-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm"
                  />
                </div>
                {errors.firstName && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Last name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    {...register('lastName')}
                    placeholder="Doe"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-10 pr-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm"
                  />
                </div>
                {errors.lastName && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.lastName.message}</p>}
              </div>
            </div>

            {!inviteToken && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    {...register('email' as any)}
                    type="email"
                    placeholder="you@example.com"
                    readOnly={otpStep}
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm read-only:opacity-60"
                  />
                </div>
                {'email' in errors && errors.email && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
              </div>
            )}

            {!inviteToken && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Phone (optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    {...register('phone' as any)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm"
                  />
                </div>
              </div>
            )}

            {!inviteToken && (
              <>
                <input type="hidden" {...register('tenantId' as any)} />
                <HospitalPicker
                  selected={selectedHospital}
                  onSelect={handleHospitalSelect}
                  error={'tenantId' in errors ? (errors as any).tenantId?.message : undefined}
                />
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Min 8 characters"
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm"
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

            {!inviteToken && otpStep && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email verification code</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setOtpError('');
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm tracking-[0.3em]"
                  />
                </div>
                {otpError && <p className="text-red-400 text-xs mt-1.5 font-medium">{otpError}</p>}
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
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 shadow-lg shadow-cyan-600/10 cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>
                    {inviteToken
                      ? 'Activating account...'
                      : otpStep
                        ? 'Verifying...'
                        : 'Sending code...'}
                  </span>
                </>
              ) : (
                <span>
                  {inviteToken
                    ? 'Activate Account'
                    : otpStep
                      ? 'Verify and create account'
                      : 'Send verification code'}
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400 font-light">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
          {!inviteToken && (
            <p className="mt-2 text-center text-sm text-slate-400 font-light">
              Registering a pharmacy business?{' '}
              <Link href="/register/pharmacy-business" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Sign up here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
