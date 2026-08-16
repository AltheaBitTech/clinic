'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacyPrescriptionsApi } from '@/lib/api';
import { ClipboardList, Loader2, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type Tab = 'PENDING' | 'VERIFIED' | 'PARTIALLY_DISPENSED' | 'DISPENSED' | 'ALL';

const tabs: { key: Tab; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'PARTIALLY_DISPENSED', label: 'Partially Dispensed' },
  { key: 'DISPENSED', label: 'Dispensed' },
  { key: 'ALL', label: 'History' },
];

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  VERIFIED: 'bg-cyan-50 text-cyan-700',
  PARTIALLY_DISPENSED: 'bg-indigo-50 text-indigo-700',
  DISPENSED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

export default function PharmacyPrescriptionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('PENDING');

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['pharmacy-prescriptions', activeTab],
    queryFn: () =>
      pharmacyPrescriptionsApi
        .getAll(activeTab === 'ALL' ? undefined : { status: activeTab })
        .then((r) => r.data),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-cyan-600 shrink-0" />
          Prescriptions
        </h1>
        <p className="page-subtitle">Verify and dispense prescriptions for your patients.</p>
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
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading...
          </div>
        ) : !prescriptions || prescriptions.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No prescriptions in this queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {prescriptions.map((p: any) => (
              <Link
                key={p.id}
                href={`/dashboard/pharmacy-portal/prescriptions/${p.id}`}
                className="flex items-center justify-between gap-3 py-3 px-2 hover:bg-slate-50/60 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.patient?.name}</p>
                  <p className="text-xs text-slate-400">
                    {p.items?.length || 0} item{(p.items?.length || 0) === 1 ? '' : 's'} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge text-[10px] font-bold ${statusStyles[p.status] || 'bg-slate-100 text-slate-600'}`}>
                    {p.status.replace('_', ' ')}
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
