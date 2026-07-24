'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authRegister(data);
      toast.success('Account created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CareSync</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-2">Start your free 30-day trial</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">First name</label>
                <input {...register('firstName')} placeholder="John" className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Last name</label>
                <input {...register('lastName')} placeholder="Doe" className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone (optional)</label>
              <input {...register('phone')} placeholder="+91 98765 43210" className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input {...register('password')} type="password" placeholder="Min 8 characters" className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
