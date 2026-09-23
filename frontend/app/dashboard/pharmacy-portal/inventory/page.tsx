'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyInventoryApi, pharmacySuppliersApi } from '@/lib/api';
import {
  Boxes, AlertTriangle, TrendingDown, ListOrdered, SlidersHorizontal,
  Loader2, Pencil, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const BATCHES_PAGE_SIZE = 10;

type Tab = 'batches' | 'low-stock' | 'expiry' | 'movements';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'batches', label: 'Batches', icon: Boxes },
  { key: 'low-stock', label: 'Low Stock', icon: TrendingDown },
  { key: 'expiry', label: 'Expiry', icon: AlertTriangle },
  { key: 'movements', label: 'Stock Ledger', icon: ListOrdered },
];

const isTab = (value: string | null): value is Tab => tabs.some((t) => t.key === value);

function PharmacyInventoryContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(isTab(tabParam) ? tabParam : 'batches');

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
        <Link
          href="/dashboard/pharmacy-portal/inventory/adjust"
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <SlidersHorizontal className="w-4 h-4" /> Adjust Stock
        </Link>
      </div>

      {/* Mobile: dropdown selector for better UX than a horizontal scroller */}
      <div className="sm:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className="input text-sm font-semibold appearance-none w-full"
        >
          {tabs.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Desktop/tablet: horizontal tab bar */}
      <div className="hidden sm:flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
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
    </div>
  );
}

export default function PharmacyInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <PharmacyInventoryContent />
    </Suspense>
  );
}

type BatchForm = {
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  purchasePrice: string;
  mrp: string;
  salePrice: string;
  supplierId: string;
  active: boolean;
};

function BatchesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [form, setForm] = useState<BatchForm | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-batches'],
    queryFn: () => pharmacyInventoryApi.getBatches().then((r) => r.data),
  });
  const { data: lowStockMedicines } = useQuery({
    queryKey: ['pharmacy-inventory-low-stock'],
    queryFn: () => pharmacyInventoryApi.getLowStock().then((r) => r.data),
  });
  const { data: suppliers } = useQuery({
    queryKey: ['pharmacy-suppliers-all'],
    queryFn: () => pharmacySuppliersApi.getAll().then((r) => r.data),
  });
  const lowStockIds = new Set((lowStockMedicines || []).map((m: any) => m.id));

  const totalPages = Math.max(1, Math.ceil((batches?.length || 0) / BATCHES_PAGE_SIZE));
  const paginatedBatches = (batches || []).slice((page - 1) * BATCHES_PAGE_SIZE, page * BATCHES_PAGE_SIZE);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pharmacyInventoryApi.updateBatch(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-low-stock'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-expiry'] });
      toast.success('Batch updated');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update batch'),
  });

  const openEditModal = (batch: any) => {
    setEditingBatch(batch);
    setForm({
      batchNo: batch.batchNo || '',
      mfgDate: batch.mfgDate ? formatDate(batch.mfgDate, 'yyyy-MM-dd') : '',
      expiryDate: batch.expiryDate ? formatDate(batch.expiryDate, 'yyyy-MM-dd') : '',
      purchasePrice: String(batch.purchasePrice ?? ''),
      mrp: String(batch.mrp ?? ''),
      salePrice: String(batch.salePrice ?? ''),
      supplierId: batch.supplierId || '',
      active: batch.status !== 'BLOCKED',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBatch(null);
    setForm(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !editingBatch) return;
    if (!form.batchNo.trim() || !form.expiryDate || !form.purchasePrice || !form.mrp || !form.salePrice) {
      toast.error('Batch no., expiry, purchase price, MRP and sale price are required');
      return;
    }
    updateMutation.mutate({
      id: editingBatch.id,
      data: {
        batchNo: form.batchNo.trim(),
        mfgDate: form.mfgDate || undefined,
        expiryDate: form.expiryDate,
        purchasePrice: Number(form.purchasePrice),
        mrp: Number(form.mrp),
        salePrice: Number(form.salePrice),
        supplierId: form.supplierId || undefined,
        status: form.active ? 'ACTIVE' : 'BLOCKED',
      },
    });
  };

  const isSaving = updateMutation.isPending;

  return (
    <>
      <DataTable
        isLoading={isLoading}
        rows={paginatedBatches}
        emptyLabel="No batches recorded yet."
        getRowClassName={(b: any) => (lowStockIds.has(b.medicineId) ? 'bg-amber-50/60 border-l-2 border-l-amber-400' : '')}
        columns={[
          {
            header: 'Medicine',
            render: (b: any) => (
              <span className="inline-flex items-center gap-1.5">
                {lowStockIds.has(b.medicineId) && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label="Below reorder level" />
                )}
                {b.medicine?.name}
              </span>
            ),
          },
          { header: 'Batch No.', render: (b: any) => b.batchNo },
          { header: 'Expiry', render: (b: any) => formatDate(b.expiryDate) },
          {
            header: 'Quantity',
            render: (b: any) => (
              <span className={lowStockIds.has(b.medicineId) ? 'font-bold text-amber-700' : ''}>{b.quantity}</span>
            ),
          },
          {
            header: 'Status',
            render: (b: any) => (
              <StatusBadge status={b.isExpired ? 'EXPIRED' : b.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE'} />
            ),
          },
          { header: 'Supplier', render: (b: any) => b.supplier?.name || '—' },
          {
            header: 'Actions',
            render: (b: any) => (
              <button
                onClick={() => openEditModal(b)}
                aria-label={`Edit batch ${b.batchNo}`}
                className="text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ),
          },
        ]}
      />

      {batches && batches.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{paginatedBatches.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{batches.length}</span> batches
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

      {isModalOpen && form && editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              Edit Batch — {editingBatch.medicine?.name}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Batch No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.batchNo}
                  onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mfg. Date</label>
                  <input
                    type="date"
                    value={form.mfgDate}
                    onChange={(e) => setForm({ ...form, mfgDate: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    MRP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sale Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Supplier</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="input text-sm"
                >
                  <option value="">— None —</option>
                  {(suppliers || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                Quantity is managed separately via Adjust Stock and isn&apos;t editable here.
              </p>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Batch is active and available for sale/dispensing
                {!form.active && <span className="text-red-500 font-semibold ml-auto">Will be deactivated</span>}
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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
      getRowClassName={() => 'bg-amber-50/60 border-l-2 border-l-amber-400'}
      columns={[
        {
          header: 'Medicine',
          render: (m: any) => (
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label="Below reorder level" /> {m.name}
            </span>
          ),
        },
        { header: 'In Stock', render: (m: any) => <span className="font-bold text-amber-700">{m.totalQuantity}</span> },
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
  getRowClassName,
}: {
  isLoading: boolean;
  rows: any[] | undefined;
  emptyLabel: string;
  columns: { header: string; render: (row: any) => React.ReactNode }[];
  /** Returns an override className for a row (e.g. to flag a warning state); falls back to zebra striping when empty. */
  getRowClassName?: (row: any) => string;
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
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 divide-x divide-slate-200/70">
                {columns.map((c) => (
                  <th key={c.header} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row: any, idx: number) => {
                const rowClass = getRowClassName?.(row);
                return (
                  <tr
                    key={row.id || idx}
                    className={`divide-x divide-slate-100 transition-colors hover:bg-cyan-50/30 ${
                      rowClass || (idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white')
                    }`}
                  >
                    {columns.map((c) => (
                      <td key={c.header} className="py-3 px-4 text-xs text-slate-700">
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
