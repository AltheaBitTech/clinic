'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { pathologyOrdersApi } from '@/lib/api';
import {
  ClipboardList, Plus, Loader2, ChevronRight,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

type Tab = 'ALL' | 'ORDERED' | 'IN_PROGRESS' | 'REPORT_READY' | 'DELIVERED' | 'CANCELLED';

const tabs: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ORDERED', label: 'Ordered' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'REPORT_READY', label: 'Report Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const TAB_STATUSES: Record<Tab, string[] | null> = {
  ALL: null,
  ORDERED: ['ORDERED', 'SAMPLE_SCHEDULED', 'SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'ACCEPTED', 'SAMPLE_REJECTED', 'RECOLLECTION_REQUESTED'],
  IN_PROGRESS: ['IN_PROGRESS'],
  REPORT_READY: ['RESULT_READY', 'PENDING_VERIFICATION', 'VERIFIED'],
  DELIVERED: ['REPORT_DELIVERED'],
  CANCELLED: ['CANCELLED'],
};

const STATUS_STYLES: Record<string, string> = {
  ORDERED: 'bg-blue-50 text-blue-700',
  SAMPLE_SCHEDULED: 'bg-indigo-50 text-indigo-700',
  SAMPLE_COLLECTED: 'bg-indigo-50 text-indigo-700',
  RECEIVED_AT_LAB: 'bg-indigo-50 text-indigo-700',
  ACCEPTED: 'bg-indigo-50 text-indigo-700',
  SAMPLE_REJECTED: 'bg-red-50 text-red-700',
  RECOLLECTION_REQUESTED: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  RESULT_READY: 'bg-cyan-50 text-cyan-700',
  PENDING_VERIFICATION: 'bg-cyan-50 text-cyan-700',
  VERIFIED: 'bg-cyan-50 text-cyan-700',
  REPORT_DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

function PathologyOrdersContent() {
  const searchParams = useSearchParams();
  const labIdParam = searchParams.get('labId');
  const [activeTab, setActiveTab] = useState<Tab>('ALL');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['pathology-orders'],
    queryFn: () => pathologyOrdersApi.getAll().then((r) => r.data),
  });

  const list: any[] = Array.isArray(orders) ? orders : [];

  const filtered = useMemo(() => {
    const statuses = TAB_STATUSES[activeTab];
    return statuses ? list.filter((o) => statuses.includes(o.status)) : list;
  }, [list, activeTab]);

  const newOrderHref = labIdParam
    ? `/dashboard/pathology-orders/new?labId=${labIdParam}`
    : '/dashboard/pathology-orders/new';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-cyan-600 shrink-0" />
            Lab Orders
          </h1>
          <p className="page-subtitle">Track pathology test orders placed for your patients</p>
        </div>
        <Link
          href={newOrderHref}
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> New Order
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === key
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No orders in this queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order No</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lab</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Placed</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o: any) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/pathology-orders/${o.id}`} className="text-sm font-semibold text-cyan-600 hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{o.lab?.name || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{o.patient?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge text-[10px] font-bold ${STATUS_STYLES[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700 font-medium">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{formatDate(o.createdAt)}</td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/pathology-orders/${o.id}`}>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PathologyOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <PathologyOrdersContent />
    </Suspense>
  );
}
