'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Activity, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-400 mt-2 text-sm font-light">Sign in to manage your medical workflows</p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="doctor@hospital.com"
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all font-light text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-lg shadow-cyan-600/10 cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400 font-light">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Register
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-white/[0.02] border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-xs text-slate-400 font-semibold mb-3.5 text-center uppercase tracking-wider">Demo Access Credentials</p>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300">
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.06] transition-colors">
              <div className="font-bold text-purple-400 mb-1 truncate">Super Admin</div>
              <div className="truncate text-slate-400 mb-0.5" title="superadmin@Arogyix.com">superadmin@Arogyix.com</div>
              <div className="font-mono text-slate-500">admin123</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.06] transition-colors">
              <div className="font-bold text-cyan-400 mb-1 truncate">Hospital Admin</div>
              <div className="truncate text-slate-400 mb-0.5" title="admin@demo.com">admin@demo.com</div>
              <div className="font-mono text-slate-500">password123</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 hover:bg-white/[0.06] transition-colors">
              <div className="font-bold text-emerald-400 mb-1 truncate">Doctor</div>
              <div className="truncate text-slate-400 mb-0.5" title="doctor@demo.com">doctor@demo.com</div>
              <div className="font-mono text-slate-500">password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
