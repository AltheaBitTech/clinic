'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacyPurchasesApi } from '@/lib/api';
import { ArrowLeft, PackageCheck, Loader2, ClipboardList } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-200 text-slate-600',
  ORDERED: 'bg-amber-50 text-amber-700',
  PARTIALLY_RECEIVED: 'bg-indigo-50 text-indigo-700',
  RECEIVED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function PharmacyPurchaseOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const qc = useQueryClient();
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, string>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ['pharmacy-purchase-order', id],
    queryFn: () => pharmacyPurchasesApi.getOne(id).then((r) => r.data),
  });

  const receiveMutation = useMutation({
    mutationFn: (items: { purchaseItemId: string; receivedQuantity: number }[]) =>
      pharmacyPurchasesApi.receive(id, { items }),
    onSuccess: () => {
      toast.success('Stock received');
      setReceiveQuantities({});
      qc.invalidateQueries({ queryKey: ['pharmacy-purchase-order', id] });
      qc.invalidateQueries({ queryKey: ['pharmacy-purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to receive stock'),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const canReceive = order.status === 'ORDERED' || order.status === 'PARTIALLY_RECEIVED';

  const remainingQty = (item: any) => item.quantity - item.receivedQuantity;
  const lineAmount = (item: any) => Number(item.rate) * item.quantity;

  const handleReceive = () => {
    const items = Object.entries(receiveQuantities)
      .filter(([, qty]) => qty && Number(qty) > 0)
      .map(([purchaseItemId, qty]) => ({ purchaseItemId, receivedQuantity: Number(qty) }));
    if (items.length === 0) {
      toast.error('Enter a quantity for at least one item');
      return;
    }
    receiveMutation.mutate(items);
  };

  const gstInvoiceAmount =
    Number(order.subtotal) - Number(order.discount) - Number(order.cashDiscount ?? 0) + Number(order.tax);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      <Link href="/dashboard/pharmacy-portal/purchases" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
      </Link>

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="page-title">{order.orderNo}</h1>
            <p className="page-subtitle">
              {order.supplier?.name} · {order.orderedAt ? formatDate(order.orderedAt) : '—'}
            </p>
          </div>
        </div>
        <span className={`badge text-xs font-bold ${statusStyles[order.status] || 'bg-slate-100 text-slate-600'}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="card mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Order Date</p>
          <p className="text-sm font-semibold text-slate-700">{order.orderDate ? formatDate(order.orderDate) : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Invoice No.</p>
          <p className="text-sm font-semibold text-slate-700">{order.invoiceNo || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Invoice Date</p>
          <p className="text-sm font-semibold text-slate-700">{order.invoiceDate ? formatDate(order.invoiceDate) : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Net Payable</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">HSN</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pack</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mfg.</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Free</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Received</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">MRP</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST %</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                {canReceive && (
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receive Qty</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item: any) => {
                const remaining = remainingQty(item);
                return (
                  <tr key={item.id} className="border-b border-slate-50 last:border-none">
                    <td className="py-2 px-3 text-xs font-semibold text-slate-800">{item.medicine?.name || item.medicineId}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.hsnCode || '—'}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.packSize || '—'}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.manufacturer || '—'}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.batchNo}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{formatDate(item.expiryDate)}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.quantity}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.freeQty || 0}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.receivedQuantity}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{formatCurrency(item.rate)}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.mrp != null ? formatCurrency(item.mrp) : '—'}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.gstPercent != null ? `${item.gstPercent}%` : '—'}</td>
                    <td className="py-2 px-3 text-xs font-semibold text-slate-700">{formatCurrency(lineAmount(item))}</td>
                    {canReceive && (
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          disabled={remaining <= 0}
                          value={receiveQuantities[item.id] || ''}
                          onChange={(e) =>
                            setReceiveQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder={remaining <= 0 ? 'Done' : '0'}
                          className="input text-xs w-24 py-1.5"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-6 grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <SummaryRow label="Item Total" value={formatCurrency(order.subtotal)} />
          <SummaryRow label="Less Prod Discount" value={`-${formatCurrency(order.discount)}`} />
          <SummaryRow label="Less Cash Discount" value={`-${formatCurrency(order.cashDiscount ?? 0)}`} />
          <SummaryRow label="GST + CESS" value={formatCurrency(order.tax)} />
          <SummaryRow label="GST Invoice Amount" value={formatCurrency(gstInvoiceAmount)} emphasis />
        </div>
        <div className="space-y-2">
          <SummaryRow label="Less Cr. Note" value={`-${formatCurrency(order.creditNote ?? 0)}`} />
          <SummaryRow label="Add Dr. Note" value={`+${formatCurrency(order.debitNote ?? 0)}`} />
          <SummaryRow label="Other +/-, R/o" value={formatCurrency(order.otherAdjustment ?? 0)} />
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">Net Payable</span>
            <span className="text-lg font-extrabold text-cyan-700">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {canReceive && (
        <button
          onClick={handleReceive}
          disabled={receiveMutation.isPending}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PackageCheck className="w-4 h-4" />
          {receiveMutation.isPending ? 'Receiving...' : 'Receive Stock'}
        </button>
      )}
    </div>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${emphasis ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-xs ${emphasis ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{value}</span>
    </div>
  );
}
