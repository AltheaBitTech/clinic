'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { referralApi } from '@/lib/api';
import {
  Check, X, Clock, Mail, Phone, User, Gift, Loader2, FileText, Pencil, Percent,
  Wallet, History, Landmark, IndianRupee,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

const KYC_BADGE_STYLES: Record<string, string> = {
  NOT_SUBMITTED: 'bg-slate-50 text-slate-500 border border-slate-200/50',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200/50',
};

function fileUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${path}`;
}

function formatPaise(amountInPaise: number) {
  return (amountInPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
}

function RecordPayoutDialog({
  referral,
  onOpenChange,
  onRecorded,
}: {
  referral: any | null;
  onOpenChange: (open: boolean) => void;
  onRecorded: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'UPI'>('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['referrals', referral?.id, 'commissions'],
    queryFn: () => referralApi.getCommissions(referral!.id).then((r) => r.data),
    enabled: !!referral,
  });

  const unpaid = (commissions || []).filter((c: any) => !c.payoutId);
  const total = unpaid
    .filter((c: any) => selectedIds.has(c.id))
    .reduce((sum: number, c: any) => sum + c.amountInPaise, 0);

  const reset = () => {
    setSelectedIds(new Set());
    setMethod('BANK_TRANSFER');
    setReferenceNo('');
    setNotes('');
  };

  const toggleAll = () => {
    if (selectedIds.size === unpaid.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(unpaid.map((c: any) => c.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one commission entry to pay out');
      return;
    }
    setSubmitting(true);
    try {
      await referralApi.recordPayout(referral!.id, {
        commissionIds: [...selectedIds],
        method,
        referenceNo: referenceNo || undefined,
        notes: notes || undefined,
      });
      toast.success('Payout recorded');
      reset();
      onOpenChange(false);
      onRecorded();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!referral} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
      <DialogContent className="max-w-xl">
        <DialogTitle>
          <Wallet className="w-5 h-5 text-cyan-600" />
          Record Payout — {referral?.user?.firstName} {referral?.user?.lastName}
        </DialogTitle>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="border border-slate-100 rounded-xl px-3 py-2.5">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Bank Account</p>
            {referral?.bankAccountNumber ? (
              <p className="text-slate-700">
                {referral.bankAccountHolderName || '—'}<br />
                {referral.bankAccountNumber} · {referral.bankIfscCode}
              </p>
            ) : (
              <p className="text-slate-400">Not provided</p>
            )}
          </div>
          <div className="border border-slate-100 rounded-xl px-3 py-2.5">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">UPI ID</p>
            <p className="text-slate-700">{referral?.upiId || <span className="text-slate-400">Not provided</span>}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
          </div>
        ) : unpaid.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No outstanding commission entries for this partner.</p>
        ) : (
          <>
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs">
                <button type="button" onClick={toggleAll} className="font-semibold text-cyan-700 hover:underline">
                  {selectedIds.size === unpaid.length ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-slate-500">{unpaid.length} unpaid entr{unpaid.length === 1 ? 'y' : 'ies'}</span>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                {unpaid.map((c: any) => (
                  <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="flex-1 text-slate-600">{c.tenant?.name || '—'}</span>
                    <span className="font-semibold text-slate-800">{formatPaise(c.amountInPaise)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-semibold text-slate-600">Total to pay</span>
              <span className="text-lg font-bold text-cyan-700">{formatPaise(total)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'BANK_TRANSFER' | 'UPI')}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Reference No.</label>
                <input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="UTR / txn ID"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || selectedIds.size === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
              Record Payout
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayoutHistoryDialog({ referral, onOpenChange }: { referral: any | null; onOpenChange: (open: boolean) => void }) {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ['referrals', referral?.id, 'payouts'],
    queryFn: () => referralApi.getPayouts(referral!.id).then((r) => r.data),
    enabled: !!referral,
  });

  return (
    <Dialog open={!!referral} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle>
          <History className="w-5 h-5 text-cyan-600" />
          Payout History — {referral?.user?.firstName} {referral?.user?.lastName}
        </DialogTitle>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No payouts recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
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
                {p.notes && <p className="text-xs text-slate-400 mt-1">{p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SuperAdminReferralsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [kycActionLoadingId, setKycActionLoadingId] = useState<string | null>(null);
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [commissionValue, setCommissionValue] = useState('');
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [payoutReferral, setPayoutReferral] = useState<any | null>(null);
  const [historyReferral, setHistoryReferral] = useState<any | null>(null);

  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['referrals', 'all'],
    queryFn: () => referralApi.getAll().then((r) => r.data),
  });

  const { data: pendingPayouts } = useQuery({
    queryKey: ['referrals', 'pending-payouts'],
    queryFn: () => referralApi.getPendingPayouts().then((r) => r.data),
  });
  const pendingByReferralId = new Map<string, number>(
    (pendingPayouts || []).map((row: any) => [row.referral?.id, row.pendingAmountInPaise]),
  );

  const refreshPayoutData = () => {
    queryClient.invalidateQueries({ queryKey: ['referrals', 'pending-payouts'] });
    queryClient.invalidateQueries({ queryKey: ['referrals'] });
  };

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

  const handleApproveKyc = async (id: string) => {
    setKycActionLoadingId(id);
    try {
      await referralApi.approveKyc(id);
      toast.success('KYC approved — referral code is now active');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setKycActionLoadingId(null);
    }
  };

  const handleRejectKyc = async (id: string) => {
    const reason = window.prompt('Reason for rejecting this KYC submission (optional):') || undefined;
    setKycActionLoadingId(id);
    try {
      await referralApi.rejectKyc(id, reason);
      toast.success('KYC rejected');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setKycActionLoadingId(null);
    }
  };

  const startEditCommission = (referral: any) => {
    setEditingCommissionId(referral.id);
    setCommissionValue(String(Number(referral.commissionPercent)));
  };

  const cancelEditCommission = () => {
    setEditingCommissionId(null);
    setCommissionValue('');
  };

  const handleSaveCommission = async (id: string) => {
    const parsed = Number(commissionValue);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error('Enter a commission between 0 and 100');
      return;
    }
    setCommissionSaving(true);
    try {
      await referralApi.updateCommission(id, parsed);
      toast.success('Commission rate updated');
      setEditingCommissionId(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update commission');
    } finally {
      setCommissionSaving(false);
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
                <th>Commission</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th>KYC</th>
                {activeTab === 'APPROVED' && <th>Payout</th>}
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
                    {editingCommissionId === referral.id ? (
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          {[10, 15].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setCommissionValue(String(preset))}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-semibold border transition',
                                Number(commissionValue) === preset
                                  ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                  : 'text-slate-500 border-slate-200 hover:bg-slate-50',
                              )}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={commissionValue}
                          onChange={(e) => setCommissionValue(e.target.value)}
                          className="w-16 px-1.5 py-0.5 text-xs border border-slate-200 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCommission(referral.id)}
                          disabled={commissionSaving}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                          title="Save"
                        >
                          {commissionSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={cancelEditCommission}
                          disabled={commissionSaving}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditCommission(referral)}
                        className="inline-flex items-center gap-1 badge font-mono font-semibold text-[11px] px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200/50 hover:border-cyan-300 hover:text-cyan-700 transition"
                        title="Edit commission rate"
                      >
                        <Percent className="w-3 h-3" />
                        {Number(referral.commissionPercent)}%
                        <Pencil className="w-3 h-3 opacity-50" />
                      </button>
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
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'badge font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5',
                        KYC_BADGE_STYLES[referral.kycStatus || 'NOT_SUBMITTED'],
                      )}>
                        {(referral.kycStatus || 'NOT_SUBMITTED').replace('_', ' ')}
                      </span>
                      {referral.kycGovtIdDocumentUrl && (
                        <a
                          href={fileUrl(referral.kycGovtIdDocumentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-cyan-600 rounded transition"
                          title="View KYC document"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {referral.kycStatus === 'PENDING' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRejectKyc(referral.id)}
                            disabled={kycActionLoadingId !== null}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Reject KYC"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleApproveKyc(referral.id)}
                            disabled={kycActionLoadingId !== null}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="Approve KYC"
                          >
                            {kycActionLoadingId === referral.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  {activeTab === 'APPROVED' && (
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {formatPaise(pendingByReferralId.get(referral.id) || 0)}
                        </span>
                        <button
                          onClick={() => setPayoutReferral(referral)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/50 hover:bg-cyan-100 transition"
                        >
                          Record Payout
                        </button>
                        <button
                          onClick={() => setHistoryReferral(referral)}
                          className="p-1 text-slate-400 hover:text-cyan-600 rounded transition"
                          title="Payout history"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
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
                  <td colSpan={activeTab === 'REJECTED' ? 7 : 8} className="text-center py-12 text-slate-400">
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

      <RecordPayoutDialog
        referral={payoutReferral}
        onOpenChange={(open) => !open && setPayoutReferral(null)}
        onRecorded={refreshPayoutData}
      />
      <PayoutHistoryDialog
        referral={historyReferral}
        onOpenChange={(open) => !open && setHistoryReferral(null)}
      />
    </div>
  );
}
