'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pathologyReportsApi } from '@/lib/api';
import {
  BarChart3, IndianRupee, ClipboardList, Building2, Users,
  Clock, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PathologyReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);

  const params = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to]);

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['pathology-reports-revenue', params],
    queryFn: () => pathologyReportsApi.getRevenue(params).then((r) => r.data),
  });

  const { data: tat, isLoading: tatLoading } = useQuery({
    queryKey: ['pathology-reports-tat', params],
    queryFn: () => pathologyReportsApi.getTat(params).then((r) => r.data),
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['pathology-reports-commissions', params],
    queryFn: () => pathologyReportsApi.getCommissions(params).then((r) => r.data),
  });

  const ordersByDoctor = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const o of commissions?.orders || []) {
      const key = o.referringDoctorId || o.referringDoctorName || 'unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(o);
    }
    return map;
  }, [commissions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-600 shrink-0" />
          Lab Reports
        </h1>
        <p className="page-subtitle">Revenue, turnaround time and referral commissions.</p>
      </div>

      <div className="card mb-6 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm" />
        </div>
        {(from || to) && (
          <button
            onClick={() => {
              setFrom('');
              setTo('');
            }}
            className="btn-secondary text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={ClipboardList}
          label="Orders"
          value={revenueLoading ? '—' : revenue?.orderCount ?? 0}
          color="cyan"
        />
        <SummaryCard
          icon={IndianRupee}
          label="Total Revenue"
          value={revenueLoading ? '—' : `₹${Number(revenue?.totalRevenue ?? 0).toFixed(0)}`}
          color="emerald"
        />
        <SummaryCard
          icon={Building2}
          label="Hospital-linked Revenue"
          value={revenueLoading ? '—' : `₹${Number(revenue?.hospitalLinkedRevenue ?? 0).toFixed(0)}`}
          color="cyan"
        />
        <SummaryCard
          icon={Users}
          label="Walk-in Revenue"
          value={revenueLoading ? '—' : `₹${Number(revenue?.walkInRevenue ?? 0).toFixed(0)}`}
          color="amber"
        />
      </div>

      {/* TAT */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800 leading-tight">
            {tatLoading ? '—' : tat?.averageTurnaroundHours != null ? `${Number(tat.averageTurnaroundHours).toFixed(1)}h` : '—'}
          </p>
          <p className="text-xs text-slate-400">
            Average turnaround time {tat?.sampleSize != null ? `· across ${tat.sampleSize} order${tat.sampleSize === 1 ? '' : 's'}` : ''}
          </p>
        </div>
      </div>

      {/* Commission ledger */}
      <div className="card">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Referring Doctor Commissions</h3>
        {commissionsLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading commissions...
          </div>
        ) : !commissions?.summary || commissions.summary.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No referral commissions in this period.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {commissions.summary.map((s: any) => {
              const key = s.doctorId || s.doctorName || 'unassigned';
              const isExpanded = expandedDoctor === key;
              const doctorOrders = ordersByDoctor[key] || [];
              return (
                <div key={key} className="py-2">
                  <button
                    onClick={() => setExpandedDoctor(isExpanded ? null : key)}
                    className="w-full flex items-center justify-between gap-3 py-2 px-2 hover:bg-slate-50/60 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{s.doctorName || 'Unassigned'}</p>
                        <p className="text-xs text-slate-400">
                          {s.orderCount} order{s.orderCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">₹{Number(s.totalCommission).toFixed(2)}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 ml-6 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order</th>
                            <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                            <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commission %</th>
                            <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctorOrders.map((o: any) => (
                            <tr key={o.id} className="border-b border-slate-50 last:border-none">
                              <td className="py-1.5 px-2 text-xs font-medium text-slate-700">{o.orderNo}</td>
                              <td className="py-1.5 px-2 text-xs text-slate-500">{formatDate(o.createdAt)}</td>
                              <td className="py-1.5 px-2 text-xs text-slate-600">₹{Number(o.total).toFixed(2)}</td>
                              <td className="py-1.5 px-2 text-xs text-slate-600">{o.commissionPercent != null ? `${o.commissionPercent}%` : '—'}</td>
                              <td className="py-1.5 px-2 text-xs font-semibold text-emerald-600">
                                {o.commissionAmount != null ? `₹${Number(o.commissionAmount).toFixed(2)}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'amber' | 'red' | 'cyan' | 'emerald';
}) {
  const colorStyles: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorStyles[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}
