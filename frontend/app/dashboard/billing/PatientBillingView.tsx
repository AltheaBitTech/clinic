'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Receipt, CheckCircle2, Loader2, DollarSign, Clock, Download, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function PatientBillingView() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const patientId = user?.patient?.id;

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', 'mine', patientId],
    queryFn: () => billingApi.getInvoices({ patientId, limit: 100 }).then((r) => r.data),
    enabled: !!patientId,
  });

  const payInvoiceMutation = useMutation({
    mutationFn: (id: string) => billingApi.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices', 'mine'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'patient'] });
      toast.success('Payment successful!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    },
  });

  const handleDownload = async (inv: any) => {
    try {
      setDownloadingId(inv.id);
      const res = await billingApi.downloadInvoicePdf(inv.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${inv.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const invoices = invoicesData?.data || [];
  const pending = invoices.filter((inv: any) => inv.status === 'PENDING');
  const paid = invoices.filter((inv: any) => inv.status === 'PAID');
  const amountDue = pending.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
  const amountPaid = paid.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Receipt className="w-6 h-6 text-cyan-600 shrink-0" />
          My Billing
        </h1>
        <p className="page-subtitle">Your invoices and payment history in one place.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(amountDue)}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Amount Due</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(amountPaid)}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Paid</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Invoices</p>
          </div>
        </div>
      </div>

      {/* Invoice list */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 text-sm mb-6">All Invoices</h3>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Fetching your invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">You don&apos;t have any invoices yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-bold text-slate-900">{inv.invoiceNo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inv.appointment?.doctor
                        ? `Dr. ${inv.appointment.doctor.user.firstName} ${inv.appointment.doctor.user.lastName}`
                        : 'Clinic charge'}
                      {' · '}{formatDate(inv.createdAt)}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${
                    inv.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {inv.status === 'PAID' ? <CheckCircle2 className="w-3 h-3 mr-1 inline" /> : null}
                    {inv.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className="text-lg font-bold text-slate-800">{formatCurrency(inv.total)}</span>
                  <div className="flex items-center gap-2">
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => payInvoiceMutation.mutate(inv.id)}
                        disabled={payInvoiceMutation.isPending}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        {payInvoiceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                        Pay Now
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(inv)}
                      disabled={downloadingId === inv.id}
                      title="Download invoice PDF"
                      aria-label="Download invoice PDF"
                      className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-cyan-600 bg-slate-50 hover:bg-cyan-50 border-none rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {downloadingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
