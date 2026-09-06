'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/lib/api';
import {
  Check, X, Clock, Mail, Phone, User, Gift, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SuperAdminReferralsPage() {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['referrals', 'all'],
    queryFn: () => referralApi.getAll().then((r) => r.data),
  });

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const { data } = await referralApi.approve(id);
      toast.success(`Referral approved! Code: ${data.referralCode}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve referral');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this referral signup?')) return;
    setActionLoadingId(id);
    try {
      await referralApi.reject(id);
      toast.success('Referral rejected');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject referral');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = (referrals || []).filter((r: any) => r.status === activeTab);
  const pendingCount = (referrals || []).filter((r: any) => r.status === 'PENDING').length;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="card h-96 animate-pulse bg-white rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Referral Signups</h1>
        <p className="page-subtitle">Review and approve referral partner signups.</p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Referral Partner Signups</h3>
            <p className="text-xs text-slate-400">Approve to activate their login and generate a referral code.</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                activeTab === 'PENDING' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              Pending
              {pendingCount > 0 && (
                <span className="bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'APPROVED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveTab('REJECTED')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'REJECTED' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Referral Code</th>
                <th>Submitted On</th>
                <th>Status</th>
                {activeTab === 'PENDING' && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((referral: any) => (
                <tr key={referral.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0 border border-slate-200/50">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">
                          {referral.user?.firstName} {referral.user?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {referral.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{referral.user?.email}</span>
                      </div>
                      {referral.phone && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{referral.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {referral.referralCode ? (
                      <span className="inline-flex items-center gap-1 badge font-mono font-semibold text-[11px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/50">
                        <Gift className="w-3 h-3" />
                        {referral.referralCode}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(referral.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      'badge font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5',
                      referral.status === 'PENDING' && 'bg-amber-50 text-amber-700 border border-amber-200/50',
                      referral.status === 'APPROVED' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
                      referral.status === 'REJECTED' && 'bg-red-50 text-red-700 border border-red-200/50',
                    )}>
                      {referral.status}
                    </span>
                  </td>
                  {activeTab === 'PENDING' && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(referral.id)}
                          disabled={actionLoadingId !== null}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(referral.id)}
                          disabled={actionLoadingId !== null}
                          className="btn-primary py-1.5 px-2.5 flex items-center gap-1 text-xs"
                          title="Approve"
                        >
                          {actionLoadingId === referral.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>Approve</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'PENDING' ? 6 : 5} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium">No {activeTab.toLowerCase()} referrals found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
