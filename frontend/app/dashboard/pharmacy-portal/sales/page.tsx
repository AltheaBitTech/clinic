'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacySalesApi, pharmacyInventoryApi, pharmacyPatientsApi, pharmaciesApi } from '@/lib/api';
import { formatCurrency, formatDateTime, isValidPhone } from '@/lib/utils';
import { printSaleInvoice } from '@/lib/printInvoice';
import {
  Receipt, Plus, Loader2, Sparkles, Search, Trash2, X, User, ChevronRight, CreditCard,
  Printer, ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw as ResetIcon, Ban, AlertTriangle, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';

type CartItem = {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNo: string;
  expiryDate: string;
  availableQty: number;
  quantity: string;
  unitPrice: string;
  gstPercent: string;
};

type PaymentRow = {
  method: string;
  amount: string;
  referenceNo: string;
};

const paymentMethods = ['CASH', 'CARD', 'UPI', 'NETBANKING', 'WALLET', 'OTHER'];

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-100',
  PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  REFUNDED: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-100',
};

const saleStatusStyles: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  PARTIALLY_RETURNED: 'bg-amber-50 text-amber-700 border border-amber-100',
  RETURNED: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-100',
};

const saleStatusLabels: Record<string, string> = {
  COMPLETED: 'Completed',
  PARTIALLY_RETURNED: 'Partially Returned',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
};

/** Derives an overall fulfilment status for a sale from its payment status and any recorded returns. */
function computeSaleStatus(sale: any): keyof typeof saleStatusLabels {
  if (sale.paymentStatus === 'CANCELLED') return 'CANCELLED';
  const returns = sale.returns || [];
  if (returns.length === 0) return 'COMPLETED';
  const soldQty = (sale.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0);
  const returnedQty = returns.reduce(
    (sum: number, r: any) => sum + (r.items || []).reduce((s: number, ri: any) => s + ri.quantity, 0),
    0,
  );
  return soldQty > 0 && returnedQty >= soldQty ? 'RETURNED' : 'PARTIALLY_RETURNED';
}

const lineAmount = (c: CartItem) => (Number(c.unitPrice) || 0) * (Number(c.quantity) || 0);
const lineTax = (c: CartItem) => (lineAmount(c) * (Number(c.gstPercent) || 0)) / 100;

type SortField = 'invoiceNo' | 'customer' | 'total' | 'date';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function PharmacySalesPage() {
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [payTarget, setPayTarget] = useState<any>(null);

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['pharmacy-sales'],
    queryFn: () => pharmacySalesApi.getAll().then((r) => r.data),
  });

  const { data: pharmacy } = useQuery({
    queryKey: ['pharmacy-mine'],
    queryFn: () => pharmaciesApi.getMine().then((r) => r.data),
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setInvoiceSearch('');
    setCustomerSearch('');
    setDateFrom('');
    setDateTo('');
    setPaymentStatusFilter('');
    setSaleStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters =
    !!invoiceSearch || !!customerSearch || !!dateFrom || !!dateTo || !!paymentStatusFilter || !!saleStatusFilter;

  const filteredSales = useMemo(() => {
    let list = (sales || []).map((s: any) => ({
      ...s,
      customerName: s.patient?.name || 'Walk-in',
      saleStatus: computeSaleStatus(s),
    }));

    if (invoiceSearch.trim()) {
      const q = invoiceSearch.trim().toLowerCase();
      list = list.filter((s: any) => s.invoiceNo.toLowerCase().includes(q));
    }
    if (customerSearch.trim()) {
      const q = customerSearch.trim().toLowerCase();
      list = list.filter((s: any) => s.customerName.toLowerCase().includes(q));
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((s: any) => new Date(s.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      list = list.filter((s: any) => new Date(s.createdAt).getTime() <= to);
    }
    if (paymentStatusFilter) {
      list = list.filter((s: any) => s.paymentStatus === paymentStatusFilter);
    }
    if (saleStatusFilter) {
      list = list.filter((s: any) => s.saleStatus === saleStatusFilter);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a: any, b: any) => {
      switch (sortField) {
        case 'invoiceNo':
          return dir * a.invoiceNo.localeCompare(b.invoiceNo);
        case 'customer':
          return dir * a.customerName.localeCompare(b.customerName);
        case 'total':
          return dir * (Number(a.total) - Number(b.total));
        case 'date':
        default:
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });
  }, [sales, invoiceSearch, customerSearch, dateFrom, dateTo, paymentStatusFilter, saleStatusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-cyan-600" /> : <ChevronDown className="w-3 h-3 text-cyan-600" />;
  };

  const sortableHeader = (field: SortField, label: string) => (
    <th
      onClick={() => toggleSort(field)}
      className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-700 transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label} {renderSortIcon(field)}
      </span>
    </th>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt className="w-6 h-6 text-cyan-600 shrink-0" />
            Sales
          </h1>
          <p className="page-subtitle">Point of sale checkout, invoice history and customer returns.</p>
        </div>
        <button onClick={() => setIsPosOpen(true)} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4 pb-4 border-b border-slate-100">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => { setInvoiceSearch(e.target.value); setPage(1); }}
              placeholder="Invoice No."
              className="input text-xs py-1.5 pl-7 w-full"
            />
          </div>
          <div className="relative col-span-2 sm:col-span-1">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setPage(1); }}
              placeholder="Customer"
              className="input text-xs py-1.5 pl-7 w-full"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            title="From date"
            className="input text-xs py-1.5 w-full"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            title="To date"
            className="input text-xs py-1.5 w-full"
          />
          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
            className="input text-xs py-1.5 appearance-none w-full"
          >
            <option value="">All Payment Status</option>
            {Object.keys(statusStyles).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <select
              value={saleStatusFilter}
              onChange={(e) => { setSaleStatusFilter(e.target.value); setPage(1); }}
              className="input text-xs py-1.5 appearance-none w-full"
            >
              <option value="">All Sale Status</option>
              {Object.entries(saleStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                title="Clear filters"
                aria-label="Clear filters"
                className="shrink-0 flex items-center justify-center w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border-none bg-slate-50 transition-colors cursor-pointer"
              >
                <ResetIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading sales...
          </div>
        ) : !sales || sales.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No sales recorded yet.</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No sales match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 divide-x divide-slate-200/70">
                    {sortableHeader('invoiceNo', 'Invoice No.')}
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60">
                      <span className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-cyan-700 transition-colors" onClick={() => toggleSort('customer')}>
                        Customer {renderSortIcon('customer')}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Items</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60">
                      <span className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-cyan-700 transition-colors" onClick={() => toggleSort('total')}>
                        Total {renderSortIcon('total')}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60">Sale Status</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1 cursor-pointer select-none hover:text-cyan-700 transition-colors" onClick={() => toggleSort('date')}>
                        Date {renderSortIcon('date')}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-cyan-50/30 transition-colors divide-x divide-slate-100">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-900">{s.invoiceNo}</td>
                      <td className="py-3 px-4 text-xs text-slate-700 font-medium bg-slate-50/50">{s.customerName}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{s.items?.length ?? 0}</td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-800 bg-slate-50/50">{formatCurrency(s.total)}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className={`badge text-[10px] font-bold ${statusStyles[s.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs bg-slate-50/50">
                        <span className={`badge text-[10px] font-bold ${saleStatusStyles[s.saleStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {saleStatusLabels[s.saleStatus] || s.saleStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDateTime(s.createdAt)}</td>
                      <td className="py-3 px-4 bg-slate-50/50">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => printSaleInvoice(s, pharmacy)}
                            title="Print invoice"
                            aria-label="Print invoice"
                            className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-cyan-600 bg-white hover:bg-cyan-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {s.paymentStatus === 'PENDING' && (
                            <button
                              onClick={() => setPayTarget(s)}
                              title="Pay remaining amount"
                              aria-label="Pay remaining amount"
                              className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {s.saleStatus === 'COMPLETED' && (
                            <button
                              onClick={() => setCancelTarget(s)}
                              title="Cancel sale"
                              aria-label="Cancel sale"
                              className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link
                            href={`/dashboard/pharmacy-portal/sales/${s.id}`}
                            className="inline-flex items-center gap-1 text-cyan-600 hover:bg-cyan-50 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  Showing <span className="font-semibold text-slate-700">{paginatedSales.length}</span> of{' '}
                  <span className="font-semibold text-slate-700">{filteredSales.length}</span> sales
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="input text-xs py-1 px-2 appearance-none w-auto"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n} / page</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isPosOpen && <PosModal onClose={() => setIsPosOpen(false)} />}
      {cancelTarget && <CancelSaleModal sale={cancelTarget} onClose={() => setCancelTarget(null)} />}
      {payTarget && <PaySaleModal sale={payTarget} onClose={() => setPayTarget(null)} />}
    </div>
  );
}

function PaySaleModal({ sale, onClose }: { sale: any; onClose: () => void }) {
  const qc = useQueryClient();
  const paidAmount = (sale.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const balanceDue = Math.max(Number(sale.total) - paidAmount, 0);

  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : '');
  const [referenceNo, setReferenceNo] = useState('');

  const payMutation = useMutation({
    mutationFn: (payload: any) => pharmacySalesApi.pay(sale.id, payload),
    onSuccess: (res) => {
      const updated = res.data;
      toast.success(updated.paymentStatus === 'PAID' ? 'Payment recorded — invoice fully paid' : 'Payment recorded');
      qc.invalidateQueries({ queryKey: ['pharmacy-sales'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-sale', sale.id] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record payment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    if (amt > balanceDue + 0.01) {
      toast.error(`Amount cannot exceed the outstanding balance of ${formatCurrency(balanceDue)}`);
      return;
    }
    payMutation.mutate({ method, amount: amt, referenceNo: referenceNo.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <Wallet className="w-4.5 h-4.5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Pay Remaining Amount</h3>
            <p className="text-xs text-slate-500">
              Outstanding balance on {sale.invoiceNo} is <span className="font-semibold text-amber-600">{formatCurrency(balanceDue)}</span>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="input text-sm appearance-none">
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              max={balanceDue}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input text-sm"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Reference No. (optional)
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. UPI transaction ID"
              className="input text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={payMutation.isPending} className="btn-primary">
              {payMutation.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CancelSaleModal({ sale, onClose }: { sale: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: (payload: any) => pharmacySalesApi.cancel(sale.id, payload),
    onSuccess: () => {
      toast.success('Sale cancelled and stock restored');
      qc.invalidateQueries({ queryKey: ['pharmacy-sales'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-sale', sale.id] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-movements'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel sale'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('A cancellation reason is required');
      return;
    }
    cancelMutation.mutate({ reason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Cancel Sale</h3>
            <p className="text-xs text-slate-500">
              This will permanently cancel invoice {sale.invoiceNo} and return all sold items back to stock. This cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Billed by mistake, wrong medicines added..."
              className="input text-sm"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Keep Sale
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PosModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();

  // Customer
  const [patientId, setPatientId] = useState('');
  const [patientLabel, setPatientLabel] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Item picker
  const [itemSearch, setItemSearch] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Discount & payments
  const [discount, setDiscount] = useState('0');
  const [payments, setPayments] = useState<PaymentRow[]>([{ method: 'CASH', amount: '', referenceNo: '' }]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['pharmacy-patients-search', patientSearch],
    queryFn: () => pharmacyPatientsApi.getAll({ search: patientSearch }).then((r) => r.data),
    enabled: isPatientDropdownOpen,
  });

  const { data: batches } = useQuery({
    queryKey: ['pharmacy-inventory-batches'],
    queryFn: () => pharmacyInventoryApi.getBatches().then((r) => r.data),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload: any) => pharmacyPatientsApi.create(payload),
    onSuccess: (res) => {
      const p = res.data;
      setPatientId(p.id);
      setPatientLabel(`${p.name}${p.phone ? ` · ${p.phone}` : ''}`);
      setIsNewCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      toast.success('Customer added and selected');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add customer'),
  });

  const createSaleMutation = useMutation({
    mutationFn: (payload: any) => pharmacySalesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-sales'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-low-stock'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-movements'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-dashboard-summary'] });
      toast.success('Sale completed');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to complete sale'),
    onSettled: () => setIsSubmitting(false),
  });

  const availableBatches = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    return (batches || []).filter((b: any) => {
      if (b.isExpired || b.status !== 'ACTIVE' || b.quantity <= 0) return false;
      if (!q) return true;
      return (
        (b.medicine?.name || '').toLowerCase().includes(q) ||
        (b.batchNo || '').toLowerCase().includes(q)
      );
    });
  }, [batches, itemSearch]);

  const addToCart = (batch: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.batchId === batch.id);
      if (idx >= 0) {
        const updated = [...prev];
        const nextQty = Math.min(Number(updated[idx].quantity) + 1, batch.quantity);
        updated[idx] = { ...updated[idx], quantity: String(nextQty) };
        return updated;
      }
      return [
        ...prev,
        {
          medicineId: batch.medicineId,
          medicineName: batch.medicine?.name || 'Unknown',
          batchId: batch.id,
          batchNo: batch.batchNo,
          expiryDate: batch.expiryDate,
          availableQty: batch.quantity,
          quantity: '1',
          unitPrice: String(batch.salePrice),
          gstPercent: batch.medicine?.gst != null ? String(batch.medicine.gst) : '0',
        },
      ];
    });
    setItemSearch('');
    setIsItemDropdownOpen(false);
  };

  const updateCartItem = (idx: number, field: keyof CartItem, value: string) => {
    setCart((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeCartItem = (idx: number) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const addPaymentRow = () => setPayments((prev) => [...prev, { method: 'CASH', amount: '', referenceNo: '' }]);
  const removePaymentRow = (idx: number) => setPayments((prev) => prev.filter((_, i) => i !== idx));
  const updatePaymentRow = (idx: number, field: keyof PaymentRow, value: string) => {
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const subtotal = cart.reduce((sum, c) => sum + lineAmount(c), 0);
  const totalTax = cart.reduce((sum, c) => sum + lineTax(c), 0);
  const orderDiscount = Number(discount) || 0;
  const total = subtotal - orderDiscount + totalTax;
  const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = total - paidAmount;

  const fillFullBalance = (idx: number) => {
    const remaining = total - (paidAmount - (Number(payments[idx].amount) || 0));
    updatePaymentRow(idx, 'amount', remaining > 0 ? remaining.toFixed(2) : '0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Add at least one item to the cart');
      return;
    }
    for (const c of cart) {
      const qty = Number(c.quantity);
      if (!qty || qty <= 0) {
        toast.error(`Enter a valid quantity for ${c.medicineName}`);
        return;
      }
      if (qty > c.availableQty) {
        toast.error(`Only ${c.availableQty} units of ${c.medicineName} (batch ${c.batchNo}) are in stock`);
        return;
      }
      if (!c.unitPrice || Number(c.unitPrice) <= 0) {
        toast.error(`Enter a valid price for ${c.medicineName}`);
        return;
      }
    }
    const validPayments = payments.filter((p) => p.method && Number(p.amount) > 0);
    if (validPayments.length === 0) {
      toast.error('Add at least one payment with an amount');
      return;
    }

    setIsSubmitting(true);
    createSaleMutation.mutate({
      patientId: patientId || undefined,
      discount: orderDiscount,
      items: cart.map((c) => ({
        medicineId: c.medicineId,
        batchId: c.batchId,
        quantity: Number(c.quantity),
        unitPrice: Number(c.unitPrice),
        tax: Number(lineTax(c).toFixed(2)),
      })),
      payments: validPayments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
        referenceNo: p.referenceNo.trim() || undefined,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-600" />
          New Sale (POS)
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 max-w-5xl w-full mx-auto">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Customer (optional)</label>
            {isNewCustomer ? (
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input type="text" placeholder="Name *" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} className="input text-sm" />
                <input type="text" placeholder="Phone" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" maxLength={10} className="input text-sm" />
                <input type="email" placeholder="Email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} className="input text-sm" />
                <div className="col-span-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsNewCustomer(false)} className="btn-secondary text-xs px-3 py-1.5">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={createCustomerMutation.isPending}
                    onClick={() => {
                      if (!newCustName.trim()) {
                        toast.error('Customer name is required');
                        return;
                      }
                      if (newCustPhone.trim() && !isValidPhone(newCustPhone)) {
                        toast.error('Enter a valid 10-digit phone number');
                        return;
                      }
                      createCustomerMutation.mutate({
                        name: newCustName.trim(),
                        phone: newCustPhone.trim() || undefined,
                        email: newCustEmail.trim() || undefined,
                      });
                    }}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {createCustomerMutation.isPending ? 'Adding...' : 'Add & Select'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={patientId ? patientLabel : patientSearch}
                    onFocus={() => {
                      setIsPatientDropdownOpen(true);
                      if (patientId) {
                        setPatientId('');
                        setPatientLabel('');
                      }
                    }}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    placeholder="Search customer by name or phone, or leave blank for walk-in..."
                    className="input pl-10 pr-24"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsPatientDropdownOpen(false);
                      setIsNewCustomer(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-600 hover:text-cyan-700 bg-cyan-50/50 hover:bg-cyan-50 px-2 py-1 rounded-md transition-colors"
                  >
                    + New
                  </button>
                </div>
                {isPatientDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {isLoadingPatients ? (
                      <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" /> Searching...
                      </div>
                    ) : patients?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No customers found. Use &ldquo;+ New&rdquo; to add one.</div>
                    ) : (
                      (patients || []).map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPatientId(p.id);
                            setPatientLabel(`${p.name}${p.phone ? ` · ${p.phone}` : ''}`);
                            setIsPatientDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 p-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="text-left">
                            <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                            <p className="text-[11px] text-slate-400">{p.phone || p.email || '—'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {isPatientDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsPatientDropdownOpen(false)} />}
              </div>
            )}
          </div>

          {/* Item picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Add Items</label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={itemSearch}
                  onFocus={() => setIsItemDropdownOpen(true)}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setIsItemDropdownOpen(true);
                  }}
                  placeholder="Search medicine to add to cart..."
                  className="input pl-10"
                />
              </div>
              {isItemDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-50">
                  {availableBatches.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">No in-stock batches match your search.</div>
                  ) : (
                    availableBatches.slice(0, 20).map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => addToCart(b)}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-800">{b.medicine?.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Batch {b.batchNo} · {b.quantity} in stock
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg shrink-0">
                          {formatCurrency(b.salePrice)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {isItemDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsItemDropdownOpen(false)} />}
            </div>
          </div>

          {/* Cart */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cart</label>
            {cart.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-400">
                No items added yet.
              </div>
            ) : (
              <>
                {/* Mobile: stacked cards, no horizontal scroll */}
                <div className="sm:hidden divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {cart.map((c, idx) => (
                    <div key={c.batchId} className="p-3 space-y-2.5 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{c.medicineName}</p>
                          <p className="text-[11px] text-slate-400">Batch {c.batchNo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(idx)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty</label>
                          <input
                            type="number"
                            min={1}
                            max={c.availableQty}
                            value={c.quantity}
                            onChange={(e) => updateCartItem(idx, 'quantity', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={c.unitPrice}
                            onChange={(e) => updateCartItem(idx, 'unitPrice', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST %</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={c.gstPercent}
                            onChange={(e) => updateCartItem(idx, 'gstPercent', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-full"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                        <span className="text-xs font-bold text-slate-800">{formatCurrency(lineAmount(c) + lineTax(c))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/tablet: table */}
                <div className="hidden sm:block overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</th>
                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST %</th>
                        <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((c, idx) => (
                        <tr key={c.batchId} className="border-b border-slate-50 last:border-none">
                          <td className="py-2 px-3 text-xs font-semibold text-slate-800">{c.medicineName}</td>
                          <td className="py-2 px-3 text-xs text-slate-500">{c.batchNo}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={1}
                              max={c.availableQty}
                              value={c.quantity}
                              onChange={(e) => updateCartItem(idx, 'quantity', e.target.value)}
                              className="input text-xs py-1.5 px-2 w-16"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={c.unitPrice}
                              onChange={(e) => updateCartItem(idx, 'unitPrice', e.target.value)}
                              className="input text-xs py-1.5 px-2 w-20"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              value={c.gstPercent}
                              onChange={(e) => updateCartItem(idx, 'gstPercent', e.target.value)}
                              className="input text-xs py-1.5 px-2 w-16"
                            />
                          </td>
                          <td className="py-2 px-3 text-xs font-semibold text-slate-700">{formatCurrency(lineAmount(c) + lineTax(c))}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeCartItem(idx)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Payments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Payments</label>
              <button type="button" onClick={addPaymentRow} className="text-xs font-semibold text-cyan-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Payment
              </button>
            </div>
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="relative col-span-3">
                    <select
                      value={p.method}
                      onChange={(e) => updatePaymentRow(idx, 'method', e.target.value)}
                      className="input text-xs py-1.5 appearance-none"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={(e) => updatePaymentRow(idx, 'amount', e.target.value)}
                    className="input text-xs py-1.5 col-span-3"
                  />
                  <input
                    type="text"
                    placeholder="Reference No. (optional)"
                    value={p.referenceNo}
                    onChange={(e) => updatePaymentRow(idx, 'referenceNo', e.target.value)}
                    className="input text-xs py-1.5 col-span-4"
                  />
                  <button
                    type="button"
                    onClick={() => fillFullBalance(idx)}
                    className="col-span-1 text-[10px] font-semibold text-cyan-600 hover:underline whitespace-nowrap"
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    onClick={() => removePaymentRow(idx)}
                    disabled={payments.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer disabled:opacity-30 justify-self-end"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-slate-100 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 shrink-0">Overall Discount</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input text-xs py-1.5 w-24 sm:w-28 text-right shrink-0"
                />
              </div>
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow label="GST / Tax" value={formatCurrency(totalTax)} />
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">Total</span>
                <span className="text-lg font-extrabold text-cyan-700">{formatCurrency(total)}</span>
              </div>
              <SummaryRow label="Amount Received" value={formatCurrency(paidAmount)} />
              <SummaryRow
                label={balanceDue > 0 ? 'Balance Due' : 'Change / Credit'}
                value={formatCurrency(Math.abs(balanceDue))}
                emphasis={balanceDue > 0}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 max-w-5xl w-full mx-auto bg-white sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 sm:flex-none">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <CreditCard className="w-4 h-4" />
            {isSubmitting ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${emphasis ? 'font-semibold text-amber-600' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-xs ${emphasis ? 'font-bold text-amber-700' : 'font-semibold text-slate-600'}`}>{value}</span>
    </div>
  );
}
