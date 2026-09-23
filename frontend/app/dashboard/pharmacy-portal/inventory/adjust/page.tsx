'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyInventoryApi, pharmacyMedicinesApi, pharmacySuppliersApi } from '@/lib/api';
import { ArrowLeft, AlertTriangle, Sparkles, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function ManualStockAdjustmentPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [prefillBatchId, setPrefillBatchId] = useState('');

  const backToInventory = () => router.push('/dashboard/pharmacy-portal/inventory');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-5 sm:mb-8">
        <Link
          href="/dashboard/pharmacy-portal/inventory"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 shrink-0" /> Manual Stock Adjustment
        </h1>
        <p className="page-subtitle">Adjust an existing batch&apos;s quantity, or add a new batch to your stock.</p>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-6 bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setMode('existing');
              setPrefillBatchId('');
            }}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === 'existing' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Adjust Existing Batch
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('new');
              setPrefillBatchId('');
            }}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === 'new' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Add New Batch
          </button>
        </div>

        {mode === 'existing' ? (
          <AdjustExistingBatchForm onDone={backToInventory} onCancel={backToInventory} initialBatchId={prefillBatchId} />
        ) : (
          <AddNewBatchForm
            onDone={backToInventory}
            onCancel={backToInventory}
            onDuplicateBatch={(batchId) => {
              setPrefillBatchId(batchId);
              setMode('existing');
            }}
          />
        )}
      </div>
    </div>
  );
}

function AdjustExistingBatchForm({
  onDone,
  onCancel,
  initialBatchId,
}: {
  onDone: () => void;
  onCancel: () => void;
  initialBatchId?: string;
}) {
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState(initialBatchId || '');
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');

  const { data: batches } = useQuery({
    queryKey: ['pharmacy-inventory-batches'],
    queryFn: () => pharmacyInventoryApi.getBatches().then((r) => r.data),
  });

  const adjustMutation = useMutation({
    mutationFn: (payload: any) => pharmacyInventoryApi.createAdjustment(payload),
    onSuccess: () => {
      toast.success('Stock adjusted');
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-low-stock'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-movements'] });
      onDone();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to adjust stock'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !quantityChange || !reason.trim()) {
      toast.error('Batch, quantity change and reason are all required');
      return;
    }
    adjustMutation.mutate({ batchId, quantityChange: Number(quantityChange), reason: reason.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Batch</label>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="input text-sm" required>
          <option value="">Select a batch...</option>
          {(batches || []).map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.medicine?.name} — {b.batchNo} (qty {b.quantity})
            </option>
          ))}
        </select>
        {batches && batches.length === 0 && (
          <p className="text-[11px] text-slate-400 mt-1.5">
            No batches yet — switch to &ldquo;Add New Batch&rdquo; above to create the first one.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Quantity Change (use negative to reduce)
        </label>
        <input
          type="number"
          value={quantityChange}
          onChange={(e) => setQuantityChange(e.target.value)}
          placeholder="e.g. -5 or 10"
          className="input text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Reason <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Damaged in storage"
          className="input text-sm"
          required
        />
      </div>
      <div className="flex gap-3 pt-3 border-t border-slate-100 mt-6 sm:justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 sm:flex-none">
          Cancel
        </button>
        <button type="submit" disabled={adjustMutation.isPending} className="btn-primary flex-1 sm:flex-none">
          {adjustMutation.isPending ? 'Saving...' : 'Apply Adjustment'}
        </button>
      </div>
    </form>
  );
}

function AddNewBatchForm({
  onDone,
  onCancel,
  onDuplicateBatch,
}: {
  onDone: () => void;
  onCancel: () => void;
  onDuplicateBatch: (batchId: string) => void;
}) {
  const qc = useQueryClient();
  const [medicineId, setMedicineId] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [reason, setReason] = useState('');
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  const { data: medicines } = useQuery({
    queryKey: ['pharmacy-medicines-all'],
    queryFn: () => pharmacyMedicinesApi.getAll().then((r) => r.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['pharmacy-suppliers-all'],
    queryFn: () => pharmacySuppliersApi.getAll().then((r) => r.data),
  });

  const { data: batches } = useQuery({
    queryKey: ['pharmacy-inventory-batches'],
    queryFn: () => pharmacyInventoryApi.getBatches().then((r) => r.data),
  });

  const selectedMedicine = (medicines || []).find((m: any) => m.id === medicineId);
  const trimmedBatchNo = batchNo.trim();
  const duplicateBatch =
    medicineId && trimmedBatchNo
      ? (batches || []).find(
          (b: any) => b.medicineId === medicineId && b.batchNo.toLowerCase() === trimmedBatchNo.toLowerCase(),
        )
      : null;

  const handleMedicineChange = (id: string) => {
    setMedicineId(id);
    const m = (medicines || []).find((mm: any) => mm.id === id);
    if (m) {
      setMrp(m.mrp != null ? String(m.mrp) : '');
      setSalePrice(m.salePrice != null ? String(m.salePrice) : '');
    }
  };

  const createSupplierMutation = useMutation({
    mutationFn: (payload: any) => pharmacySuppliersApi.create(payload),
    onSuccess: (res) => {
      toast.success('Supplier added');
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers-all'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-suppliers'] });
      setSupplierId(res.data.id);
      setIsAddingSupplier(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add supplier'),
  });

  const handleAddSupplier = () => {
    if (!newSupplierName.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    createSupplierMutation.mutate({ name: newSupplierName.trim(), phone: newSupplierPhone || undefined });
  };

  const createBatchMutation = useMutation({
    mutationFn: (payload: any) => pharmacyInventoryApi.createBatch(payload),
    onSuccess: () => {
      toast.success('Batch created');
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-low-stock'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-movements'] });
      onDone();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create batch'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId || !batchNo.trim() || !expiryDate || !purchasePrice || !mrp || !salePrice || !quantity || !reason.trim()) {
      toast.error('Medicine, batch no., expiry, prices, quantity and reason are all required');
      return;
    }
    if (duplicateBatch) {
      toast.error(`Batch ${trimmedBatchNo} already exists for this medicine. Please select "Adjust Existing Batch".`);
      return;
    }
    createBatchMutation.mutate({
      medicineId,
      batchNo: batchNo.trim(),
      mfgDate: mfgDate || undefined,
      expiryDate,
      purchasePrice: Number(purchasePrice),
      mrp: Number(mrp),
      salePrice: Number(salePrice),
      quantity: Number(quantity),
      supplierId: supplierId || undefined,
      reason: reason.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Medicine</label>
        <select value={medicineId} onChange={(e) => handleMedicineChange(e.target.value)} className="input text-sm" required>
          <option value="">Select a medicine...</option>
          {(medicines || []).map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {selectedMedicine && (
          <p className="text-[11px] text-slate-400 mt-1.5">
            MRP, Sale Price and GST are pre-filled from the medicine catalog — adjust MRP/Sale Price for this batch if needed.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Batch No.</label>
          <input
            type="text"
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
            placeholder="BATCH-2026-01"
            className={`input text-sm ${duplicateBatch ? 'border-red-300 focus:border-red-400' : ''}`}
            required
          />
          {duplicateBatch && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-red-700 font-medium">
                  Batch {trimmedBatchNo} already exists for this medicine. Please select &ldquo;Adjust Existing Batch&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => onDuplicateBatch(duplicateBatch.id)}
                  className="text-[11px] font-semibold text-red-700 hover:underline mt-1"
                >
                  Adjust Existing Batch instead →
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="100" className="input text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">GST</label>
          <div className="input text-sm bg-slate-50 text-slate-600 flex items-center">
            {selectedMedicine ? `${selectedMedicine.gst != null ? selectedMedicine.gst : 0}%` : 'Select a medicine'}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mfg. Date (DD-MM-YYYY)</label>
          <input type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} className="input text-sm" />
          {mfgDate && <p className="text-[11px] text-slate-400 mt-1">{formatDate(mfgDate, 'dd-MM-yyyy')}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date (DD-MM-YYYY)</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="input text-sm" required />
          {expiryDate && <p className="text-[11px] text-slate-400 mt-1">{formatDate(expiryDate, 'dd-MM-yyyy')}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Purchase Price</label>
          <input type="number" step="0.01" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="input text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">MRP</label>
          <input type="number" step="0.01" min="0" value={mrp} onChange={(e) => setMrp(e.target.value)} className="input text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sale Price</label>
          <input type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="input text-sm" required />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</label>
            <button
              type="button"
              onClick={() => setIsAddingSupplier((v) => !v)}
              className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 bg-transparent border-none cursor-pointer flex items-center gap-0.5"
            >
              {isAddingSupplier ? (
                <>
                  <X className="w-3 h-3" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> New
                </>
              )}
            </button>
          </div>
          {isAddingSupplier ? (
            <div className="space-y-2 p-2.5 border border-slate-200 rounded-lg bg-slate-50">
              <input
                type="text"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Supplier name"
                className="input text-sm"
              />
              <input
                type="text"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="input text-sm"
              />
              <button
                type="button"
                onClick={handleAddSupplier}
                disabled={createSupplierMutation.isPending}
                className="btn-secondary text-xs w-full py-1.5"
              >
                {createSupplierMutation.isPending ? 'Adding...' : 'Add Supplier'}
              </button>
            </div>
          ) : (
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input text-sm">
              <option value="">— None —</option>
              {(suppliers || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Reason <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Opening stock entry"
          className="input text-sm"
          required
        />
      </div>
      <div className="flex gap-3 pt-3 border-t border-slate-100 mt-6 sm:justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 sm:flex-none">
          Cancel
        </button>
        <button
          type="submit"
          disabled={createBatchMutation.isPending || !!duplicateBatch}
          className="btn-primary flex-1 sm:flex-none"
        >
          {createBatchMutation.isPending ? 'Saving...' : 'Create Batch'}
        </button>
      </div>
    </form>
  );
}
