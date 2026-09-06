'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, referralApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Building2, Store, Copy, Loader2, Save, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="card hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({ phone: '', address: '', city: '', state: '' });
  const [saving, setSaving] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'referral'],
    queryFn: () => dashboardApi.getReferral().then((r) => r.data),
  });

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: () => referralApi.getMe().then((r) => r.data),
  });

  useEffect(() => {
    if (me) {
      setProfile({
        phone: me.phone || '',
        address: me.address || '',
        city: me.city || '',
        state: me.state || '',
      });
    }
  }, [me]);

  const handleCopy = () => {
    if (!me?.referralCode) return;
    navigator.clipboard.writeText(me.referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await referralApi.updateMe(profile);
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['referrals', 'me'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (statsLoading || meLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-11 h-11 bg-slate-200 rounded-xl mb-4" />
              <div className="h-8 bg-slate-200 rounded mb-2 w-24" />
              <div className="h-4 bg-slate-100 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="card h-64 animate-pulse bg-white rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Referral Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.firstName}. Track hospitals and pharmacies you've referred to Arogyix.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard label="Hospitals Referred" value={stats?.hospitalsReferred || 0} icon={Building2} color="bg-cyan-500" />
        <StatCard label="Pharmacies Referred" value={stats?.pharmaciesReferred || 0} icon={Store} color="bg-emerald-500" />
      </div>

      {/* Referral Code */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Your Referral Code</h3>
            <p className="text-xs text-slate-400">Share this with hospitals or pharmacies to sign up on Arogyix</p>
          </div>
        </div>
        {me?.referralCode ? (
          <div className="flex items-center justify-between gap-2 bg-slate-50 border border-purple-100 px-4 py-3 rounded-xl max-w-sm">
            <span className="text-lg font-mono font-bold text-purple-700 tracking-wider">{me.referralCode}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600 hover:text-purple-800 transition"
              title="Copy referral code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Your referral code will appear here once your account is approved.</p>
        )}
      </div>

      {/* Profile */}
      <div className="card max-w-2xl">
        <h3 className="font-semibold text-slate-800 text-lg mb-1">Your Profile</h3>
        <p className="text-xs text-slate-400 mb-5">Keep your contact details up to date</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Name</label>
              <input
                disabled
                value={`${user?.firstName || ''} ${user?.lastName || ''}`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
              <input
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Phone</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="9876543210"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Address</label>
              <input
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">City</label>
              <input
                value={profile.city}
                onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">State</label>
              <input
                value={profile.state}
                onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
