'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CareSync</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="doctor@hospital.com"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Register
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium mb-3 text-center">Demo Credentials</p>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
            <div className="bg-white/5 rounded-lg p-2">
              <div className="font-semibold text-purple-400 mb-0.5 truncate">Super Admin</div>
              <div className="truncate" title="superadmin@caresync.com">superadmin@caresync.com</div>
              <div>admin123</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="font-semibold text-indigo-400 mb-0.5 truncate">Hospital Admin</div>
              <div className="truncate" title="admin@demo.com">admin@demo.com</div>
              <div>password123</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="font-semibold text-emerald-400 mb-0.5 truncate">Doctor</div>
              <div className="truncate" title="doctor@demo.com">doctor@demo.com</div>
              <div>password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
