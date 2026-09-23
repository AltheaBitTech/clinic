'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import Link from 'next/link';
import { billingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Receipt, Plus, ChevronDown,
  Loader2, DollarSign, Clock,
  Download, Mail, MessageCircle, FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import PatientBillingView from './PatientBillingView';

type PeriodFilter = 'ALL' | 'THIS_MONTH' | 'PREV_MONTH' | 'THIS_YEAR' | 'PREV_YEAR' | 'CUSTOM';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  ALL: 'All Time',
  THIS_MONTH: 'This Month',
  PREV_MONTH: 'Previous Month',
  THIS_YEAR: 'This Year',
  PREV_YEAR: 'Previous Year',
  CUSTOM: 'Custom Range',
};

function getPeriodRange(period: PeriodFilter, customStart: string, customEnd: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  switch (period) {
    case 'THIS_MONTH':
      return { startDate: startOfMonth(now).toISOString(), endDate: endOfMonth(now).toISOString() };
    case 'PREV_MONTH': {
      const prev = subMonths(now, 1);
      return { startDate: startOfMonth(prev).toISOString(), endDate: endOfMonth(prev).toISOString() };
    }
    case 'THIS_YEAR':
      return { startDate: startOfYear(now).toISOString(), endDate: endOfYear(now).toISOString() };
    case 'PREV_YEAR': {
      const prev = subYears(now, 1);
      return { startDate: startOfYear(prev).toISOString(), endDate: endOfYear(prev).toISOString() };
    }
    case 'CUSTOM':
      return {
        startDate: customStart ? new Date(customStart).toISOString() : undefined,
        endDate: customEnd ? new Date(`${customEnd}T23:59:59.999`).toISOString() : undefined,
      };
    default:
      return {};
  }
}

export default function BillingPage() {
  const { user } = useAuth();

  if (user?.role === 'PATIENT') {
    return <PatientBillingView />;
  }

  return <AdminBillingView />;
}

function AdminBillingView() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { startDate, endDate } = getPeriodRange(periodFilter, customStart, customEnd);
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, page, periodFilter, customStart, customEnd],
    queryFn: () => billingApi.getInvoices({ status: statusFilter || undefined, page, startDate, endDate }).then((r) => r.data),
  });

  // Mutations
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => billingApi.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to record payment';
      toast.error(msg);
    }
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await billingApi.exportInvoices({ status: statusFilter || undefined, startDate, endDate });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `billing-export-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export billing data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailShare = (inv: any) => {
    toast('Emailing invoices will be available soon.', { icon: '📧' });
  };

  const handleWhatsappShare = (inv: any) => {
    toast('Sending invoices via WhatsApp will be available soon.', { icon: '💬' });
  };

  // Summary Metrics
  const totalRevenue = invoicesData?.totalRevenue || 0;
  const totalInvoices = invoicesData?.total || 0;
  const pendingCount = invoicesData?.data?.filter((inv: any) => inv.status === 'PENDING').length || 0;
  const totalPages = Math.max(1, Math.ceil((invoicesData?.total || 0) / (invoicesData?.limit || 20)));

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt className="w-6 h-6 text-cyan-600 shrink-0" />
            Billing & Invoices
          </h1>
          <p className="page-subtitle">Track patient billing records, generate clinic invoices, and record payments.</p>
        </div>
        <Link href="/dashboard/billing/new" className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Create Invoice
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Revenue Collected {periodFilter !== 'ALL' ? `· ${PERIOD_LABELS[periodFilter]}` : ''}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalInvoices}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Invoices Issued</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Unpaid Bills Pending</p>
          </div>
        </div>
      </div>

      {/* Filters & Content Table */}
      <div className="card">
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-semibold text-slate-800 text-sm">All Invoices</h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44">
                <select
                  value={periodFilter}
                  onChange={(e) => {
                    setPeriodFilter(e.target.value as PeriodFilter);
                    setPage(1);
                  }}
                  className="input appearance-none pr-10 text-xs py-1.5"
                >
                  {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((key) => (
                    <option key={key} value={key}>{PERIOD_LABELS[key]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="input appearance-none pr-10 text-xs py-1.5"
                >
                  <option value="">All Statuses</option>
                  <option value="PAID">Paid Only</option>
                  <option value="PENDING">Pending Only</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                Export
              </button>
            </div>
          </div>

          {periodFilter === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">From</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => { setCustomStart(e.target.value); setPage(1); }}
                className="input text-xs py-1.5 w-40"
              />
              <label className="text-xs font-semibold text-slate-500">To</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }}
                className="input text-xs py-1.5 w-40"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Fetching Invoices...
          </div>
        ) : invoicesData?.data?.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No invoices match your selection.</p>
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 divide-x divide-slate-200/70">
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice No</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60">Patient Name</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60">Issue Date</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Charge</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60">Status</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoicesData.data.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-cyan-50/30 transition-colors divide-x divide-slate-100">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-900">{inv.invoiceNo}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700 bg-slate-50/50">
                        {inv.patient.user.firstName} {inv.patient.user.lastName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {inv.appointment?.doctor ? `Dr. ${inv.appointment.doctor.user.firstName} ${inv.appointment.doctor.user.lastName}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 bg-slate-50/50">{formatDate(inv.createdAt)}</td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-800">{formatCurrency(inv.total)}</td>
                      <td className="py-3 px-4 text-xs bg-slate-50/50">
                        <span className={`badge ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {inv.status === 'PENDING' ? (
                            <button
                              onClick={() => markPaidMutation.mutate(inv.id)}
                              disabled={markPaidMutation.isPending}
                              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-none rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Collected</span>
                          )}

                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={downloadingId === inv.id}
                            title="Download invoice PDF"
                            aria-label="Download invoice PDF"
                            className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-cyan-600 bg-slate-50 hover:bg-cyan-50 border-none rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleEmailShare(inv)}
                            title="Send invoice via email"
                            aria-label="Send invoice via email"
                            className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-cyan-600 bg-slate-50 hover:bg-cyan-50 border-none rounded-lg transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleWhatsappShare(inv)}
                            title="Send invoice via WhatsApp"
                            aria-label="Send invoice via WhatsApp"
                            className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border-none rounded-lg transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-100 -mx-1">
              {invoicesData.data.map((inv: any) => (
                <div key={inv.id} className="py-4 px-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{inv.invoiceNo}</p>
                      <p className="text-xs font-medium text-slate-600 mt-0.5 truncate">
                        {inv.patient.user.firstName} {inv.patient.user.lastName}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Doctor</p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        {inv.appointment?.doctor ? `Dr. ${inv.appointment.doctor.user.firstName} ${inv.appointment.doctor.user.lastName}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Issue Date</p>
                      <p className="text-xs text-slate-600 mt-0.5">{formatDate(inv.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{formatCurrency(inv.total)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {inv.status === 'PENDING' ? (
                      <button
                        onClick={() => markPaidMutation.mutate(inv.id)}
                        disabled={markPaidMutation.isPending}
                        className="text-xs font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-none rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Collected</span>
                    )}

                    <button
                      onClick={() => handleDownload(inv)}
                      disabled={downloadingId === inv.id}
                      title="Download invoice PDF"
                      aria-label="Download invoice PDF"
                      className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-cyan-600 bg-slate-50 hover:bg-cyan-50 border-none rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {downloadingId === inv.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleEmailShare(inv)}
                      title="Send invoice via email"
                      aria-label="Send invoice via email"
                      className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-cyan-600 bg-slate-50 hover:bg-cyan-50 border-none rounded-lg transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleWhatsappShare(inv)}
                      title="Send invoice via WhatsApp"
                      aria-label="Send invoice via WhatsApp"
                      className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border-none rounded-lg transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{invoicesData.data.length}</span> of{' '}
                  <span className="font-semibold text-slate-700">{invoicesData.total}</span> invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-600 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
