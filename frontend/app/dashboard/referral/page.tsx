'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, referralApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Building2, Store, Copy, Loader2, Save, Gift, ShieldCheck, Upload, FileText, Mail, Phone, MapPin, Calendar, Wallet, IndianRupee, Landmark, History } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

type ReferredTenantType = 'HOSPITAL' | 'PHARMACY';

const REFERRED_TENANT_LABELS: Record<ReferredTenantType, string> = {
  HOSPITAL: 'Hospitals Referred',
  PHARMACY: 'Pharmacies Referred',
};

function ReferredTenantsModal({
  type,
  onOpenChange,
}: {
  type: ReferredTenantType | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['referrals', 'me', 'referred-tenants', type],
    queryFn: () => referralApi.getMyReferredTenants(type!).then((r) => r.data),
    enabled: !!type,
  });

  return (
    <Dialog open={!!type} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle>
          {type === 'PHARMACY' ? <Store className="w-5 h-5 text-emerald-600" /> : <Building2 className="w-5 h-5 text-cyan-600" />}
          {type ? REFERRED_TENANT_LABELS[type] : ''}
        </DialogTitle>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !tenants || tenants.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No {type === 'PHARMACY' ? 'pharmacies' : 'hospitals'} have signed up with your referral code yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {tenants.map((tenant: any) => (
              <div key={tenant.id} className="border border-slate-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="font-semibold text-slate-800">{tenant.name}</p>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-semibold shrink-0',
                      tenant.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{tenant.email}</span>
                  {tenant.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{tenant.phone}</span>}
                  {(tenant.city || tenant.state) && (
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{[tenant.city, tenant.state].filter(Boolean).join(', ')}</span>
                  )}
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {formatDate(tenant.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const KYC_STATUS_STYLES: Record<string, string> = {
  NOT_SUBMITTED: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const KYC_STATUS_LABELS: Record<string, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'Under review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
};

function StatCard({
  label, value, icon: Icon, color, onClick,
}: { label: string; value: string | number; icon: React.ElementType; color: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'card text-left hover:shadow-md transition-all duration-200 w-full',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </button>
  );
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({
    phone: '', address: '', city: '', state: '',
    bankAccountHolderName: '', bankAccountNumber: '', bankIfscCode: '', upiId: '',
  });
  const [saving, setSaving] = useState(false);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [referredTenantsType, setReferredTenantsType] = useState<ReferredTenantType | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'referral'],
    queryFn: () => dashboardApi.getReferral().then((r) => r.data),
  });

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: () => referralApi.getMe().then((r) => r.data),
  });

  const { data: kyc, isLoading: kycLoading } = useQuery({
    queryKey: ['referrals', 'me', 'kyc'],
    queryFn: () => referralApi.getMyKyc().then((r) => r.data),
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['referrals', 'me', 'earnings-summary'],
    queryFn: () => referralApi.getMyEarningsSummary().then((r) => r.data),
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ['referrals', 'me', 'payouts'],
    queryFn: () => referralApi.getMyPayouts().then((r) => r.data),
  });

  useEffect(() => {
    if (me) {
      setProfile({
        phone: me.phone || '',
        address: me.address || '',
        city: me.city || '',
        state: me.state || '',
        bankAccountHolderName: me.bankAccountHolderName || '',
        bankAccountNumber: me.bankAccountNumber || '',
        bankIfscCode: me.bankIfscCode || '',
        upiId: me.upiId || '',
      });
    }
  }, [me]);

  const formatPaise = (amountInPaise: number) =>
    (amountInPaise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

  const handleCopy = () => {
    if (!me?.referralCode) return;
    navigator.clipboard.writeText(me.referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) {
      toast.error('Please choose a document to upload');
      return;
    }
    setSubmittingKyc(true);
    try {
      await referralApi.submitKyc(kycFile);
      toast.success('KYC document submitted for review');
      setKycFile(null);
      queryClient.invalidateQueries({ queryKey: ['referrals', 'me', 'kyc'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit KYC document');
    } finally {
      setSubmittingKyc(false);
    }
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

  if (statsLoading || meLoading || kycLoading) {
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
        <StatCard
          label="Hospitals Referred"
          value={stats?.hospitalsReferred || 0}
          icon={Building2}
          color="bg-cyan-500"
          onClick={() => setReferredTenantsType('HOSPITAL')}
        />
        <StatCard
          label="Pharmacies Referred"
          value={stats?.pharmaciesReferred || 0}
          icon={Store}
          color="bg-emerald-500"
          onClick={() => setReferredTenantsType('PHARMACY')}
        />
      </div>

      <ReferredTenantsModal
        type={referredTenantsType}
        onOpenChange={(open) => !open && setReferredTenantsType(null)}
      />

      {/* Earnings */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Commission Earnings</h3>
            <p className="text-xs text-slate-400">Commission accrues automatically each time a referred tenant's subscription is charged.</p>
          </div>
        </div>
        {earningsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Earned</p>
              <p className="text-lg font-bold text-slate-800">{formatPaise(earnings?.totalEarnedInPaise || 0)}</p>
            </div>
            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Paid</p>
              <p className="text-lg font-bold text-emerald-600">{formatPaise(earnings?.totalPaidInPaise || 0)}</p>
            </div>
            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Pending Balance</p>
              <p className="text-lg font-bold text-amber-600">{formatPaise(earnings?.totalPendingInPaise || 0)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="card mb-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Payout History</h3>
            <p className="text-xs text-slate-400">Payments recorded by the Arogyix team once transferred to your account.</p>
          </div>
        </div>
        {payoutsLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No payouts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {payouts.map((p: any) => (
              <div key={p.id} className="border border-slate-100 rounded-xl px-3.5 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{formatPaise(p.amountInPaise)}</span>
                  <span className="text-[10px] text-slate-400">{formatDate(p.paidAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{p.method === 'UPI' ? 'UPI' : 'Bank Transfer'}</span>
                  {p.referenceNo && <span className="font-mono">· {p.referenceNo}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
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
        {me?.referralCode && kyc?.kycStatus === 'APPROVED' ? (
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
        ) : me?.referralCode ? (
          <p className="text-sm text-slate-400">Your referral code is issued but can't be shared yet &mdash; complete KYC verification below to activate it.</p>
        ) : (
          <p className="text-sm text-slate-400">Your referral code will appear here once your account is approved.</p>
        )}
      </div>

      {/* KYC Verification */}
      <div className="card mb-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 text-lg">KYC Verification</h3>
            <p className="text-xs text-slate-400">Upload a government photo ID (Aadhaar, PAN, or Passport) to activate your referral code</p>
          </div>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold shrink-0', KYC_STATUS_STYLES[kyc?.kycStatus || 'NOT_SUBMITTED'])}>
            {KYC_STATUS_LABELS[kyc?.kycStatus || 'NOT_SUBMITTED']}
          </span>
        </div>

        {kyc?.kycStatus === 'REJECTED' && kyc?.kycRejectionReason && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
            {kyc.kycRejectionReason}
          </p>
        )}

        {kyc?.kycStatus === 'PENDING' ? (
          <p className="text-sm text-slate-500">Your document is submitted and awaiting Super Admin review.</p>
        ) : kyc?.kycStatus === 'APPROVED' ? (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Document verified
          </p>
        ) : (
          <form onSubmit={handleKycSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setKycFile(e.target.files?.[0] || null)}
              className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
            <button
              type="submit"
              disabled={submittingKyc}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {submittingKyc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Submit
            </button>
          </form>
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
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payout Details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Account Holder Name</label>
                <input
                  value={profile.bankAccountHolderName}
                  onChange={(e) => setProfile((p) => ({ ...p, bankAccountHolderName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Bank Account Number</label>
                <input
                  value={profile.bankAccountNumber}
                  onChange={(e) => setProfile((p) => ({ ...p, bankAccountNumber: e.target.value.replace(/\D/g, '') }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">IFSC Code</label>
                <input
                  value={profile.bankIfscCode}
                  onChange={(e) => setProfile((p) => ({ ...p, bankIfscCode: e.target.value.toUpperCase() }))}
                  placeholder="HDFC0001234"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">UPI ID</label>
                <input
                  value={profile.upiId}
                  onChange={(e) => setProfile((p) => ({ ...p, upiId: e.target.value }))}
                  placeholder="name@bank"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
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
