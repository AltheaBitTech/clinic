'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3, IndianRupee, Layers, Activity,
  PieChart as PieIcon, AlertTriangle, RefreshCw, Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const TIER_COLORS: Record<string, string> = {
  FREE: '#94a3b8',
  BASIC: 'var(--primary)',
  PROFESSIONAL: 'var(--success)',
  ENTERPRISE: '#8b5cf6',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'var(--success)',
  CREATED: '#94a3b8',
  PENDING: 'var(--warning)',
  HALTED: 'var(--warning)',
  CANCELLED: 'var(--danger)',
  COMPLETED: 'var(--primary)',
  EXPIRED: 'var(--danger)',
};

function paiseToRupees(paise: number) {
  return paise / 100;
}

function StatCard({
  label, value, icon: Icon, color, subtext,
}: { label: string; value: string | number; icon: React.ElementType; color: string; subtext?: string }) {
  return (
    <div className="card hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}

export default function SuperAdminAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.getRevenueOverview().then((r) => r.data),
  });

  const monthlyTrend = (data?.monthlyTrend || []).map((m: any) => ({
    name: m.month,
    'New & Renewed MRR': paiseToRupees(m.newOrRenewedMrrInPaise),
  }));

  const planMix = (data?.planMix || []).map((p: any) => ({
    name: p.tier,
    value: paiseToRupees(p.mrrInPaise),
    tenantCount: p.tenantCount,
    color: TIER_COLORS[p.tier] || 'var(--primary)',
  }));

  const statusBreakdown = (data?.statusBreakdown || []).map((s: any) => ({
    name: s.status,
    Subscriptions: s.count,
    color: STATUS_COLORS[s.status] || 'var(--primary)',
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-600 shrink-0" />
          Revenue Analytics
        </h1>
        <p className="page-subtitle">Platform-wide subscription revenue, plan mix, and subscription health across all tenants.</p>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-600" /> Loading revenue analytics...
        </div>
      ) : isError ? (
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Couldn&apos;t load analytics</p>
          <p className="text-slate-400 text-sm mt-1">Something went wrong. Please try again.</p>
          <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Current MRR"
              value={formatCurrency(paiseToRupees(data?.currentMrrInPaise || 0))}
              icon={IndianRupee}
              color="bg-emerald-500"
              subtext="Monthly recurring revenue, active subscriptions"
            />
            <StatCard
              label="Active Subscriptions"
              value={data?.activeSubscriptions || 0}
              icon={Activity}
              color="bg-cyan-500"
            />
            <StatCard
              label="Plan Tiers in Use"
              value={planMix.length}
              icon={Layers}
              color="bg-purple-500"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly trend */}
            <div className="card lg:col-span-3 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-500" />
                  New &amp; Renewed MRR by Month (Last 12 Months)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Revenue from subscriptions whose billing period started in that month &mdash; not a retroactive snapshot of total MRR at each past month.
                </p>
              </div>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="New & Renewed MRR" stroke="var(--success)" fillOpacity={0.15} fill="url(#colorMrr)" />
                    <defs>
                      <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan mix */}
            <div className="card lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-500" />
                MRR by Plan Tier
              </h3>
              {planMix.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-16">No active subscriptions yet</p>
              ) : (
                <>
                  <div className="h-60 w-full text-xs flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={planMix} innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                          {planMix.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-[11px] font-semibold text-slate-500">
                    {planMix.map((p: any) => (
                      <div key={p.name} className="flex items-center justify-between gap-1.5">
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          {p.name} ({p.tenantCount})
                        </span>
                        <span>{formatCurrency(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Status breakdown */}
            <div className="card lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                Subscription Status Breakdown
              </h3>
              <div className="h-60 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="Subscriptions" radius={[4, 4, 0, 0]}>
                      {statusBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
