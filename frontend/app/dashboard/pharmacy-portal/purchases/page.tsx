'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacyPurchasesApi, pharmacySuppliersApi, pharmacyMedicinesApi } from '@/lib/api';
import { ClipboardList, Plus, Loader2, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

type LineItem = {
  medicineId: string;
  batchNo: string;
  expiryDate: string;
  quantity: string;
  freeQty: string;
  rate: string;
  hsnCode: string;
  gstPercent: string;
  mrp: string;
  packSize: string;
  manufacturer: string;
};

const emptyLine: LineItem = {
  medicineId: '',
  batchNo: '',
  expiryDate: '',
  quantity: '',
  freeQty: '',
  rate: '',
  hsnCode: '',
  gstPercent: '',
  mrp: '',
  packSize: '',
  manufacturer: '',
};

const lineAmount = (l: LineItem) => (Number(l.rate) || 0) * (Number(l.quantity) || 0);
const lineTax = (l: LineItem) => (lineAmount(l) * (Number(l.gstPercent) || 0)) / 100;

const todayStr = () => new Date().toISOString().slice(0, 10);

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-200 text-slate-600',
  ORDERED: 'bg-amber-50 text-amber-700',
  PARTIALLY_RECEIVED: 'bg-indigo-50 text-indigo-700',
  RECEIVED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function PharmacyPurchaseOrdersPage() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState(todayStr());
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [cashDiscount, setCashDiscount] = useState('0');
  const [creditNote, setCreditNote] = useState('0');
  const [debitNote, setDebitNote] = useState('0');
  const [otherAdjustment, setOtherAdjustment] = useState('0');
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['pharmacy-purchase-orders'],
    queryFn: () => pharmacyPurchasesApi.getAll().then((r) => r.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['pharmacy-suppliers-all'],
    queryFn: () => pharmacySuppliersApi.getAll().then((r) => r.data),
  });

  const { data: medicines } = useQuery({
    queryKey: ['pharmacy-medicines-all'],
    queryFn: () => pharmacyMedicinesApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => pharmacyPurchasesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-purchase-orders'] });
      toast.success('Purchase order created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create purchase order'),
  });

  const openCreateModal = () => {
    setSupplierId('');
    setOrderNo(`PO-${Date.now().toString().slice(-8)}`);
    setOrderDate(todayStr());
    setInvoiceNo('');
    setInvoiceDate('');
    setDiscount('0');
    setCashDiscount('0');
    setCreditNote('0');
    setDebitNote('0');
    setOtherAdjustment('0');
    setLines([{ ...emptyLine }]);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const updateLine = (idx: number, field: keyof LineItem, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const selectMedicine = (idx: number, medicineId: string) => {
    const medicine = (medicines || []).find((m: any) => m.id === medicineId);
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              medicineId,
              hsnCode: l.hsnCode || medicine?.hsn || '',
              gstPercent: l.gstPercent || (medicine?.gst != null ? String(medicine.gst) : ''),
              mrp: l.mrp || (medicine?.mrp != null ? String(medicine.mrp) : ''),
            }
          : l,
      ),
    );
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const itemTotal = lines.reduce((sum, l) => sum + lineAmount(l), 0);
  const gstCess = lines.reduce((sum, l) => sum + lineTax(l), 0);
  const gstInvoiceAmount = itemTotal - (Number(discount) || 0) - (Number(cashDiscount) || 0) + gstCess;
  const netPayable =
    gstInvoiceAmount - (Number(creditNote) || 0) + (Number(debitNote) || 0) + (Number(otherAdjustment) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Select a supplier');
      return;
    }
    if (!orderNo.trim()) {
      toast.error('Order number is required');
      return;
    }
    const items = lines.filter((l) => l.medicineId && l.batchNo && l.expiryDate && l.quantity && l.rate);
    if (items.length === 0) {
      toast.error('Add at least one complete line item');
      return;
    }
    createMutation.mutate({
      supplierId,
      orderNo: orderNo.trim(),
      orderDate: orderDate || undefined,
      invoiceNo: invoiceNo.trim() || undefined,
      invoiceDate: invoiceDate || undefined,
      discount: Number(discount) || 0,
      cashDiscount: Number(cashDiscount) || 0,
      creditNote: Number(creditNote) || 0,
      debitNote: Number(debitNote) || 0,
      otherAdjustment: Number(otherAdjustment) || 0,
      items: items.map((l) => ({
        medicineId: l.medicineId,
        batchNo: l.batchNo.trim(),
        expiryDate: l.expiryDate,
        quantity: Number(l.quantity),
        freeQty: Number(l.freeQty) || 0,
        rate: Number(l.rate),
        hsnCode: l.hsnCode.trim() || undefined,
        gstPercent: l.gstPercent ? Number(l.gstPercent) : undefined,
        mrp: l.mrp ? Number(l.mrp) : undefined,
        packSize: l.packSize.trim() || undefined,
        manufacturer: l.manufacturer.trim() || undefined,
      })),
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-cyan-600 shrink-0" />
            Purchase Orders
          </h1>
          <p className="page-subtitle">Order and receive stock from your suppliers.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Purchase Order
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading purchase orders...
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No purchase orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order No.</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice No.</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Payable</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordered</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">{o.orderNo}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{o.invoiceNo || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{o.supplier?.name || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{o.items?.length ?? 0}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`badge text-[10px] font-bold ${statusStyles[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{o.orderedAt ? formatDate(o.orderedAt) : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/pharmacy-portal/purchases/${o.id}`}
                        className="inline-flex items-center gap-1 text-cyan-600 hover:bg-cyan-50 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              New Purchase Order
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input text-sm" required>
                    <option value="">Select supplier</option>
                    {(suppliers || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Order No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Order Date</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Invoice No.</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Items</label>
                  <button type="button" onClick={addLine} className="text-xs font-semibold text-cyan-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {lines.map((line, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <select
                          value={line.medicineId}
                          onChange={(e) => selectMedicine(idx, e.target.value)}
                          className="input text-xs py-1.5 col-span-3"
                        >
                          <option value="">Name of Product</option>
                          {(medicines || []).map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Batch No."
                          value={line.batchNo}
                          onChange={(e) => updateLine(idx, 'batchNo', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <input
                          type="date"
                          value={line.expiryDate}
                          onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                          className="input text-xs py-1.5 px-2 col-span-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Free"
                          value={line.freeQty}
                          onChange={(e) => updateLine(idx, 'freeQty', e.target.value)}
                          className="input text-xs py-1.5 px-2 col-span-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Rate"
                          value={line.rate}
                          onChange={(e) => updateLine(idx, 'rate', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer disabled:opacity-30 col-span-1 justify-self-end"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="HSN Code"
                          value={line.hsnCode}
                          onChange={(e) => updateLine(idx, 'hsnCode', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          placeholder="GST %"
                          value={line.gstPercent}
                          onChange={(e) => updateLine(idx, 'gstPercent', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="MRP"
                          value={line.mrp}
                          onChange={(e) => updateLine(idx, 'mrp', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="Pack"
                          value={line.packSize}
                          onChange={(e) => updateLine(idx, 'packSize', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="Mfg."
                          value={line.manufacturer}
                          onChange={(e) => updateLine(idx, 'manufacturer', e.target.value)}
                          className="input text-xs py-1.5 col-span-2"
                        />
                        <div className="col-span-2 text-right text-xs font-semibold text-slate-700 pr-1">
                          {formatCurrency(lineAmount(line))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                <div className="space-y-2">
                  <SummaryField label="Item Total" value={formatCurrency(itemTotal)} readOnly />
                  <SummaryInput label="Less Prod Discount" value={discount} onChange={setDiscount} />
                  <SummaryInput label="Less Cash Discount" value={cashDiscount} onChange={setCashDiscount} />
                  <SummaryField label="GST + CESS" value={formatCurrency(gstCess)} readOnly />
                  <SummaryField label="GST Invoice Amount" value={formatCurrency(gstInvoiceAmount)} readOnly emphasis />
                </div>
                <div className="space-y-2">
                  <SummaryInput label="Less Cr. Note" value={creditNote} onChange={setCreditNote} />
                  <SummaryInput label="Add Dr. Note" value={debitNote} onChange={setDebitNote} />
                  <SummaryInput label="Other +/-, R/o" value={otherAdjustment} onChange={setOtherAdjustment} allowNegative />
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">Net Payable</span>
                    <span className="text-lg font-extrabold text-cyan-700">{formatCurrency(netPayable)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryField({
  label,
  value,
  readOnly,
  emphasis,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${emphasis ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-xs ${emphasis ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{value}</span>
    </div>
  );
}

function SummaryInput({
  label,
  value,
  onChange,
  allowNegative,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowNegative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <input
        type="number"
        min={allowNegative ? undefined : 0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input text-xs py-1.5 w-28 text-right"
      />
    </div>
  );
}
