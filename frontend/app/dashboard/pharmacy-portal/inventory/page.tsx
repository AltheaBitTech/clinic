'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyInventoryApi, pharmacyMedicinesApi, pharmacySuppliersApi } from '@/lib/api';
import {
  Boxes, AlertTriangle, TrendingDown, ListOrdered, SlidersHorizontal,
  Loader2, Sparkles, Plus, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

type Tab = 'batches' | 'low-stock' | 'expiry' | 'movements';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'batches', label: 'Batches', icon: Boxes },
  { key: 'low-stock', label: 'Low Stock', icon: TrendingDown },
  { key: 'expiry', label: 'Expiry', icon: AlertTriangle },
  { key: 'movements', label: 'Stock Ledger', icon: ListOrdered },
];

export default function PharmacyInventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('batches');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Boxes className="w-6 h-6 text-cyan-600 shrink-0" />
            Inventory
          </h1>
          <p className="page-subtitle">Batch stock, expiry alerts and the stock movement ledger.</p>
        </div>
        <button onClick={() => setIsAdjustModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4" /> Adjust Stock
        </button>
      </div>

      <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === key
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'batches' && <BatchesTab />}
      {activeTab === 'low-stock' && <LowStockTab />}
      {activeTab === 'expiry' && <ExpiryTab />}
      {activeTab === 'movements' && <MovementsTab />}

      {isAdjustModalOpen && <AdjustStockModal onClose={() => setIsAdjustModalOpen(false)} />}
    </div>
  );
}

function BatchesTab() {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-batches'],
    queryFn: () => pharmacyInventoryApi.getBatches().then((r) => r.data),
  });

  return (
    <DataTable
      isLoading={isLoading}
      rows={batches}
      emptyLabel="No batches recorded yet."
      columns={[
        { header: 'Medicine', render: (b: any) => b.medicine?.name },
        { header: 'Batch No.', render: (b: any) => b.batchNo },
        { header: 'Expiry', render: (b: any) => formatDate(b.expiryDate) },
        { header: 'Quantity', render: (b: any) => b.quantity },
        {
          header: 'Status',
          render: (b: any) => (
            <StatusBadge status={b.isExpired ? 'EXPIRED' : b.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE'} />
          ),
        },
        { header: 'Supplier', render: (b: any) => b.supplier?.name || '—' },
      ]}
    />
  );
}

function LowStockTab() {
  const { data: medicines, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-low-stock'],
    queryFn: () => pharmacyInventoryApi.getLowStock().then((r) => r.data),
  });

  return (
    <DataTable
      isLoading={isLoading}
      rows={medicines}
      emptyLabel="Nothing is running low right now."
      columns={[
        { header: 'Medicine', render: (m: any) => m.name },
        { header: 'In Stock', render: (m: any) => m.totalQuantity },
        { header: 'Reorder Level', render: (m: any) => m.reorderLevel },
      ]}
    />
  );
}

function ExpiryTab() {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-expiry'],
    queryFn: () => pharmacyInventoryApi.getExpiry().then((r) => r.data),
  });

  return (
    <DataTable
      isLoading={isLoading}
      rows={batches}
      emptyLabel="Nothing is expired or expiring soon."
      columns={[
        { header: 'Medicine', render: (b: any) => b.medicine?.name },
        { header: 'Batch No.', render: (b: any) => b.batchNo },
        { header: 'Expiry', render: (b: any) => formatDate(b.expiryDate) },
        { header: 'Quantity', render: (b: any) => b.quantity },
        {
          header: 'Status',
          render: (b: any) =>
            b.isExpired ? (
              <span className="badge bg-red-50 text-red-600 text-[10px] font-bold">Expired</span>
            ) : (
              <span className="badge bg-amber-50 text-amber-700 text-[10px] font-bold">{b.daysToExpiry}d left</span>
            ),
        },
      ]}
    />
  );
}

function MovementsTab() {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-movements'],
    queryFn: () => pharmacyInventoryApi.getMovements().then((r) => r.data),
  });

  return (
    <DataTable
      isLoading={isLoading}
      rows={movements}
      emptyLabel="No stock movements recorded yet."
      columns={[
        { header: 'Date', render: (m: any) => formatDate(m.createdAt) },
        { header: 'Medicine', render: (m: any) => m.medicine?.name },
        { header: 'Batch No.', render: (m: any) => m.batch?.batchNo },
        { header: 'Type', render: (m: any) => <span className="badge bg-slate-100 text-slate-600 text-[10px] font-bold">{m.type}</span> },
        { header: 'Quantity', render: (m: any) => m.quantity },
        { header: 'Reference', render: (m: any) => m.referenceType },
      ]}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    EXPIRED: 'bg-red-50 text-red-600',
    BLOCKED: 'bg-slate-200 text-slate-600',
  };
  return <span className={`badge text-[10px] font-bold ${styles[status] || styles.ACTIVE}`}>{status}</span>;
}

function DataTable({
  isLoading,
  rows,
  emptyLabel,
  columns,
}: {
  isLoading: boolean;
  rows: any[] | undefined;
  emptyLabel: string;
  columns: { header: string; render: (row: any) => React.ReactNode }[];
}) {
  return (
    <div className="card">
      {isLoading ? (
        <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading...
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="text-center py-16">
          <Boxes className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">{emptyLabel}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                {columns.map((c) => (
                  <th key={c.header} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, idx: number) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                  {columns.map((c) => (
                    <td key={c.header} className="py-3 px-4 text-xs text-slate-700">
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdjustStockModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <Sparkles className="w-5 h-5 text-cyan-600" />
          Manual Stock Adjustment
        </h3>

        <div className="flex gap-2 mb-4 bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === 'existing' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Adjust Existing Batch
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === 'new' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Add New Batch
          </button>
        </div>

        {mode === 'existing' ? <AdjustExistingBatchForm onClose={onClose} /> : <AddNewBatchForm onClose={onClose} />}
      </div>
    </div>
  );
}

function AdjustExistingBatchForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState('');
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
      onClose();
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
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={adjustMutation.isPending} className="btn-primary">
          {adjustMutation.isPending ? 'Saving...' : 'Apply Adjustment'}
        </button>
      </div>
    </form>
  );
}

function AddNewBatchForm({ onClose }: { onClose: () => void }) {
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
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create batch'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId || !batchNo.trim() || !expiryDate || !purchasePrice || !mrp || !salePrice || !quantity || !reason.trim()) {
      toast.error('Medicine, batch no., expiry, prices, quantity and reason are all required');
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
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Medicine</label>
        <select value={medicineId} onChange={(e) => setMedicineId(e.target.value)} className="input text-sm" required>
          <option value="">Select a medicine...</option>
          {(medicines || []).map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Batch No.</label>
          <input type="text" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="BATCH-2026-01" className="input text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="100" className="input text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mfg. Date</label>
          <input type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="input text-sm" required />
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
        <div>
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
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={createBatchMutation.isPending} className="btn-primary">
          {createBatchMutation.isPending ? 'Saving...' : 'Create Batch'}
        </button>
      </div>
    </form>
  );
}
