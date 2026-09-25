'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyPurchasesApi, pharmacySuppliersApi, pharmacyMedicinesApi } from '@/lib/api';
import { ArrowLeft, ClipboardList, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
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

const isLineEmpty = (l: LineItem) => Object.values(l).every((v) => !v || !v.toString().trim());

const missingFieldsForLine = (l: LineItem) => {
  const missing: string[] = [];
  if (!l.medicineId) missing.push('Product');
  if (!l.batchNo.trim()) missing.push('Batch No.');
  if (!l.expiryDate) missing.push('Expiry Date');
  if (!l.quantity) missing.push('Qty');
  if (!l.rate) missing.push('Rate');
  return missing;
};

const isLineComplete = (l: LineItem) => missingFieldsForLine(l).length === 0;

export default function NewPharmacyPurchaseOrderPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState('');
  const [orderNo, setOrderNo] = useState(`PO-${Date.now().toString().slice(-8)}`);
  const [orderDate, setOrderDate] = useState(todayStr());
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [cashDiscount, setCashDiscount] = useState('0');
  const [creditNote, setCreditNote] = useState('0');
  const [debitNote, setDebitNote] = useState('0');
  const [otherAdjustment, setOtherAdjustment] = useState('0');
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

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
      router.push('/dashboard/pharmacy-portal/purchases');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create purchase order'),
  });

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
    setAttemptedSubmit(true);

    const missingHeaderFields: string[] = [];
    if (!supplierId) missingHeaderFields.push('Supplier');
    if (!orderNo.trim()) missingHeaderFields.push('Order No.');
    if (missingHeaderFields.length > 0) {
      toast.error(`Required: ${missingHeaderFields.join(', ')}`);
      return;
    }

    const incompleteRow = lines
      .map((l, i) => ({ rowNumber: i + 1, missing: missingFieldsForLine(l) }))
      .find(({ missing }, i) => missing.length > 0 && !isLineEmpty(lines[i]));
    if (incompleteRow) {
      toast.error(`Row ${incompleteRow.rowNumber} is missing: ${incompleteRow.missing.join(', ')}`);
      return;
    }

    const items = lines.filter(isLineComplete);
    if (items.length === 0) {
      toast.error('Add at least one item with Product, Batch No., Expiry Date, Qty and Rate');
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-5 sm:mb-8">
        <Link
          href="/dashboard/pharmacy-portal/purchases"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 shrink-0" /> New Purchase Order
        </h1>
        <p className="page-subtitle">Order stock from your suppliers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ClipboardList className="w-5 h-5 text-cyan-500" /> Order Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={`input ${attemptedSubmit && !supplierId ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                required
              >
                <option value="">Select supplier</option>
                {(suppliers || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {attemptedSubmit && !supplierId && (
                <p className="text-xs text-red-500 mt-1">Supplier is required</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Order No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className={`input ${attemptedSubmit && !orderNo.trim() ? 'border-red-400 ring-1 ring-red-300' : ''}`}
              />
              {attemptedSubmit && !orderNo.trim() && (
                <p className="text-xs text-red-500 mt-1">Order number is required</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Invoice No.</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-cyan-500" /> Line Items
            </h2>
            <button type="button" onClick={addLine} className="text-xs font-semibold text-cyan-600 hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line, idx) => {
              const rowMissing = attemptedSubmit && !isLineEmpty(line) ? missingFieldsForLine(line) : [];
              const errInput = (field: string) =>
                rowMissing.includes(field) ? 'border-red-400 ring-1 ring-red-300' : '';
              return (
              <div key={idx} className="bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={line.medicineId}
                    onChange={(e) => selectMedicine(idx, e.target.value)}
                    className={`input text-xs py-1.5 col-span-3 ${errInput('Product')}`}
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
                    className={`input text-xs py-1.5 col-span-2 ${errInput('Batch No.')}`}
                  />
                  <input
                    type="date"
                    value={line.expiryDate}
                    onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)}
                    className={`input text-xs py-1.5 col-span-2 ${errInput('Expiry Date')}`}
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                    className={`input text-xs py-1.5 px-2 col-span-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${errInput('Qty')}`}
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
                    className={`input text-xs py-1.5 col-span-2 ${errInput('Rate')}`}
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
                {rowMissing.length > 0 && (
                  <p className="text-xs text-red-500 px-1">
                    Row {idx + 1} missing: {rowMissing.join(', ')}
                  </p>
                )}
              </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/pharmacy-portal/purchases" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Create Purchase Order
              </>
            )}
          </button>
        </div>
      </form>
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
