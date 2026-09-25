'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { pathologyOrdersApi } from '@/lib/api';
import { ClipboardList, Loader2, ChevronRight, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type Tab = 'ALL' | 'ACTIVE' | 'NEEDS_ATTENTION' | 'AWAITING_VERIFICATION' | 'DELIVERED' | 'CANCELLED';

const tabs: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'NEEDS_ATTENTION', label: 'Needs Attention' },
  { key: 'AWAITING_VERIFICATION', label: 'Awaiting Verification' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const tabStatuses: Record<Tab, string[] | null> = {
  ALL: null,
  ACTIVE: ['ORDERED', 'SAMPLE_SCHEDULED', 'SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'ACCEPTED', 'IN_PROGRESS'],
  NEEDS_ATTENTION: ['SAMPLE_REJECTED', 'RECOLLECTION_REQUESTED'],
  AWAITING_VERIFICATION: ['RESULT_READY', 'PENDING_VERIFICATION', 'VERIFIED'],
  DELIVERED: ['REPORT_DELIVERED'],
  CANCELLED: ['CANCELLED'],
};

const statusStyles: Record<string, string> = {
  ORDERED: 'bg-slate-100 text-slate-700',
  SAMPLE_SCHEDULED: 'bg-amber-50 text-amber-700',
  SAMPLE_COLLECTED: 'bg-amber-50 text-amber-700',
  RECEIVED_AT_LAB: 'bg-indigo-50 text-indigo-700',
  ACCEPTED: 'bg-indigo-50 text-indigo-700',
  SAMPLE_REJECTED: 'bg-red-50 text-red-700',
  RECOLLECTION_REQUESTED: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700',
  RESULT_READY: 'bg-cyan-50 text-cyan-700',
  PENDING_VERIFICATION: 'bg-cyan-50 text-cyan-700',
  VERIFIED: 'bg-cyan-50 text-cyan-700',
  REPORT_DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

export default function PathologyOrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ACTIVE');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['pathology-orders'],
    queryFn: () => pathologyOrdersApi.getAll().then((r) => r.data),
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const statuses = tabStatuses[activeTab];
    if (!statuses) return orders;
    return orders.filter((o: any) => statuses.includes(o.status));
  }, [orders, activeTab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-cyan-600 shrink-0" />
            Orders
          </h1>
          <p className="page-subtitle">Lab orders from linked hospitals and walk-in patients.</p>
        </div>
        <Link
          href="/dashboard/pathology-portal/orders/new"
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> New Walk-in Order
        </Link>
      </div>

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

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading orders...
          </div>
        ) : !filteredOrders || filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No orders in this queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredOrders.map((o: any) => (
              <Link
                key={o.id}
                href={`/dashboard/pathology-portal/orders/${o.id}`}
                className="flex items-center justify-between gap-3 py-3 px-2 hover:bg-slate-50/60 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {o.orderNo} · {o.patient?.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {o.items?.length || 0} test{(o.items?.length || 0) === 1 ? '' : 's'} · {formatDate(o.createdAt)}
                    {' · '}
                    {o.hospitalTenantId ? 'Hospital-linked' : 'Walk-in'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge text-[10px] font-bold ${statusStyles[o.status] || 'bg-slate-100 text-slate-600'}`}>
                    {o.status.replace(/_/g, ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
