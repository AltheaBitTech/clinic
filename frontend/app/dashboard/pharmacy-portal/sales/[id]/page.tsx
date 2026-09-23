'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacySalesApi, pharmaciesApi } from '@/lib/api';
import { ArrowLeft, Receipt, Loader2, RotateCcw, Undo2, Printer, Ban, AlertTriangle, Wallet } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { printSaleInvoice } from '@/lib/printInvoice';
import toast from 'react-hot-toast';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  REFUNDED: 'bg-indigo-50 text-indigo-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const returnStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-indigo-50 text-indigo-700',
  REJECTED: 'bg-red-50 text-red-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
};

export default function PharmacySaleDetailPage() {
  const { id } = useParams() as { id: string };
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);

  const { data: sale, isLoading } = useQuery({
    queryKey: ['pharmacy-sale', id],
    queryFn: () => pharmacySalesApi.getOne(id).then((r) => r.data),
  });

  const { data: pharmacy } = useQuery({
    queryKey: ['pharmacy-mine'],
    queryFn: () => pharmaciesApi.getMine().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!sale) return null;

  const lineAmount = (item: any) => Number(item.unitPrice) * item.quantity;
  const lineTotal = (item: any) => lineAmount(item) - Number(item.discount || 0) + Number(item.tax || 0);

  const paidAmount = (sale.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const balanceDue = Math.max(Number(sale.total) - paidAmount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      <Link href="/dashboard/pharmacy-portal/sales" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Sales
      </Link>

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="page-title">{sale.invoiceNo}</h1>
            <p className="page-subtitle">
              {sale.patient?.name || 'Walk-in Customer'} · {formatDateTime(sale.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge text-xs font-bold ${statusStyles[sale.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>
            {sale.paymentStatus}
          </span>
          <button
            onClick={() => printSaleInvoice(sale, pharmacy)}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Invoice
          </button>
          {sale.paymentStatus === 'PENDING' && (
            <button
              onClick={() => setIsPayOpen(true)}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" /> Pay Remaining Amount
            </button>
          )}
          {sale.paymentStatus !== 'CANCELLED' && (sale.returns || []).length === 0 && (
            <button
              onClick={() => setIsCancelOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-red-600 hover:bg-red-50 border-red-100"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel Sale
            </button>
          )}
        </div>
      </div>

      <div className="card mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Customer</p>
          <p className="text-sm font-semibold text-slate-700">{sale.patient?.name || 'Walk-in'}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Phone</p>
          <p className="text-sm font-semibold text-slate-700">{sale.patient?.phone || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Items</p>
          <p className="text-sm font-semibold text-slate-700">{sale.items?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(sale.total)}</p>
        </div>
        {sale.paymentStatus !== 'CANCELLED' && (
          <>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Amount Paid</p>
              <p className="text-sm font-bold text-emerald-700">{formatCurrency(paidAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Balance Due</p>
              <p className={`text-sm font-bold ${balanceDue > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {formatCurrency(balanceDue)}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="card mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Price</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(sale.items || []).map((item: any) => (
                <tr key={item.id} className="border-b border-slate-50 last:border-none">
                  <td className="py-2 px-3 text-xs font-semibold text-slate-800">{item.medicine?.name || item.medicineId}</td>
                  <td className="py-2 px-3 text-xs text-slate-600">{item.batch?.batchNo || item.batchId}</td>
                  <td className="py-2 px-3 text-xs text-slate-600">{item.quantity}</td>
                  <td className="py-2 px-3 text-xs text-slate-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2 px-3 text-xs text-slate-600">{formatCurrency(item.discount || 0)}</td>
                  <td className="py-2 px-3 text-xs text-slate-600">{formatCurrency(item.tax || 0)}</td>
                  <td className="py-2 px-3 text-xs font-semibold text-slate-700">{formatCurrency(lineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-6 grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <SummaryRow label="Subtotal" value={formatCurrency(sale.subtotal)} />
          <SummaryRow label="Discount" value={`-${formatCurrency(sale.discount)}`} />
          <SummaryRow label="Tax" value={formatCurrency(sale.tax)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">Total</span>
            <span className="text-lg font-extrabold text-cyan-700">{formatCurrency(sale.total)}</span>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Payments</h3>
        {(sale.payments || []).length === 0 ? (
          <p className="text-sm text-slate-400">No payments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference No.</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {sale.payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-none">
                    <td className="py-2 px-3 text-xs font-semibold text-slate-800">{p.method}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{formatCurrency(p.amount)}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{p.referenceNo || '—'}</td>
                    <td className="py-2 px-3 text-xs text-slate-500">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Returns</h3>
          <button onClick={() => setIsReturnOpen(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Undo2 className="w-3.5 h-3.5" /> Record Return
          </button>
        </div>
        {(sale.returns || []).length === 0 ? (
          <p className="text-sm text-slate-400">No returns recorded against this sale.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {sale.returns.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-none">
                    <td className="py-2 px-3 text-xs text-slate-700">{r.reason}</td>
                    <td className="py-2 px-3 text-xs font-semibold text-slate-800">{formatCurrency(r.total)}</td>
                    <td className="py-2 px-3 text-xs">
                      <span className={`badge text-[10px] font-bold ${returnStatusStyles[r.status] || 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isReturnOpen && <RecordReturnModal sale={sale} onClose={() => setIsReturnOpen(false)} />}
      {isCancelOpen && <CancelSaleModal sale={sale} onClose={() => setIsCancelOpen(false)} />}
      {isPayOpen && <PaySaleModal sale={sale} balanceDue={balanceDue} onClose={() => setIsPayOpen(false)} />}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-600">{value}</span>
    </div>
  );
}

type ReturnLine = {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNo: string;
  maxQuantity: number;
  unitPrice: number;
  quantity: string;
  amount: string;
};

function RecordReturnModal({ sale, onClose }: { sale: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState<ReturnLine[]>(
    (sale.items || []).map((item: any) => ({
      medicineId: item.medicineId,
      medicineName: item.medicine?.name || item.medicineId,
      batchId: item.batchId,
      batchNo: item.batch?.batchNo || item.batchId,
      maxQuantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      quantity: '0',
      amount: '0',
    })),
  );

  const returnMutation = useMutation({
    mutationFn: (payload: any) => pharmacySalesApi.createReturn(sale.id, payload),
    onSuccess: () => {
      toast.success('Return recorded and stock restored');
      qc.invalidateQueries({ queryKey: ['pharmacy-sale', sale.id] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-movements'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record return'),
  });

  const updateLine = (idx: number, field: 'quantity' | 'amount', value: string) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        if (field === 'quantity') {
          const qty = Math.min(Math.max(Number(value) || 0, 0), l.maxQuantity);
          return { ...l, quantity: String(qty), amount: (qty * l.unitPrice).toFixed(2) };
        }
        return { ...l, [field]: value };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('A return reason is required');
      return;
    }
    const items = lines
      .filter((l) => Number(l.quantity) > 0)
      .map((l) => ({
        medicineId: l.medicineId,
        batchId: l.batchId,
        quantity: Number(l.quantity),
        amount: Number(l.amount) || 0,
      }));
    if (items.length === 0) {
      toast.error('Enter a return quantity for at least one item');
      return;
    }
    returnMutation.mutate({ reason: reason.trim(), items });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <RotateCcw className="w-5 h-5 text-cyan-600" />
          Record Customer Return
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sold Qty</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Qty</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={`${l.batchId}-${idx}`} className="border-b border-slate-50 last:border-none">
                    <td className="py-2 px-3 text-xs font-semibold text-slate-800">{l.medicineName}</td>
                    <td className="py-2 px-3 text-xs text-slate-500">{l.batchNo}</td>
                    <td className="py-2 px-3 text-xs text-slate-500">{l.maxQuantity}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        max={l.maxQuantity}
                        value={l.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                        className="input text-xs py-1.5 px-2 w-16"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.amount}
                        onChange={(e) => updateLine(idx, 'amount', e.target.value)}
                        className="input text-xs py-1.5 px-2 w-24"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer changed mind, wrong medicine dispensed..."
              className="input text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={returnMutation.isPending} className="btn-primary">
              {returnMutation.isPending ? 'Recording...' : 'Record Return'}
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
      qc.invalidateQueries({ queryKey: ['pharmacy-sale', sale.id] });
      qc.invalidateQueries({ queryKey: ['pharmacy-sales'] });
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

const paySaleMethods = ['CASH', 'CARD', 'UPI', 'NETBANKING', 'WALLET', 'OTHER'];

function PaySaleModal({ sale, balanceDue, onClose }: { sale: any; balanceDue: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : '');
  const [referenceNo, setReferenceNo] = useState('');

  const payMutation = useMutation({
    mutationFn: (payload: any) => pharmacySalesApi.pay(sale.id, payload),
    onSuccess: (res) => {
      const updated = res.data;
      toast.success(updated.paymentStatus === 'PAID' ? 'Payment recorded — invoice fully paid' : 'Payment recorded');
      qc.invalidateQueries({ queryKey: ['pharmacy-sale', sale.id] });
      qc.invalidateQueries({ queryKey: ['pharmacy-sales'] });
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
              {paySaleMethods.map((m) => (
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
