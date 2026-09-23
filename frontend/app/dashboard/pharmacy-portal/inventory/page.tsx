'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { pharmacyInventoryApi } from '@/lib/api';
import {
  Boxes, AlertTriangle, TrendingDown, ListOrdered, SlidersHorizontal,
  Loader2,
} from 'lucide-react';
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

function BatchesTab() {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-batches'],
    queryFn: () => pharmacyInventoryApi.getBatches().then((r) => r.data),
  });
  const { data: lowStockMedicines } = useQuery({
    queryKey: ['pharmacy-inventory-low-stock'],
    queryFn: () => pharmacyInventoryApi.getLowStock().then((r) => r.data),
  });
  const lowStockIds = new Set((lowStockMedicines || []).map((m: any) => m.id));

  return (
    <DataTable
      isLoading={isLoading}
      rows={batches}
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
