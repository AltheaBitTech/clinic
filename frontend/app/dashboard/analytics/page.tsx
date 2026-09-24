'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import {
  BarChart3, Loader2, Calendar, Users, ClipboardList,
  TrendingUp, IndianRupee, PieChart as PieIcon, Sparkles,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import HospitalReportsPanel from '@/components/reports/HospitalReportsPanel';

export default function AnalyticsPage() {
  // Queries
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: () => tenantsApi.getMyStats().then((r) => r.data),
  });

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['tenant-analytics'],
    queryFn: () => tenantsApi.getMyAnalytics().then((r) => r.data),
  });

  const appointmentTrends = analytics?.appointmentTrends || [];
  const financialTrends = analytics?.financialTrends || [];
  const deptShares = analytics?.departmentDistribution || [];

  const loading = isLoading || isAnalyticsLoading;
  const errored = isError || isAnalyticsError;
  const retry = () => {
    refetch();
    refetchAnalytics();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-600 shrink-0" />
          Analytics Dashboard
        </h1>
        <p className="page-subtitle">Real-time clinical metrics, revenue performance reports, and appointment volumes.</p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-600" /> Loading metrics analysis...
        </div>
      ) : errored ? (
        <div className="card text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Couldn&apos;t load analytics</p>
          <p className="text-slate-400 text-sm mt-1">Something went wrong. Please try again.</p>
          <button onClick={() => retry()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Stats overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Appts', value: stats?.totalAppointments || 0, icon: Calendar, color: 'bg-cyan-500', change: 'All-time appointment volume' },
              { label: 'Registered Patients', value: stats?.totalPatients || 0, icon: Users, color: 'bg-emerald-500', change: 'Total patients on record' },
              { label: 'Active Doctors', value: stats?.totalDoctors || 0, icon: TrendingUp, color: 'bg-blue-500', change: 'Fully active profiles' },
              { label: 'Pending Bills', value: stats?.pendingInvoices || 0, icon: ClipboardList, color: 'bg-amber-500', change: 'Awaiting cash collect' },
            ].map((s) => (
              <div key={s.label} className="card relative overflow-hidden group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{s.label}</span>
                    <p className="text-2xl font-black text-slate-900">{s.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">{s.change}</span>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Appointment Trend Chart */}
            <div className="card lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-500" />
                Appointment Distribution (Last 7 Days)
              </h3>
              {appointmentTrends.every((d: any) => d.Completed === 0 && d.Scheduled === 0) ? (
                <div className="h-72 w-full flex items-center justify-center text-slate-400 text-sm font-medium">
                  No appointments in the last 7 days
                </div>
              ) : (
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--muted)" />
                      <YAxis stroke="var(--muted)" allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar dataKey="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Scheduled" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Department share donut chart */}
            <div className="card lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-500" />
                Consultation Share by Dept.
              </h3>
              {deptShares.length === 0 ? (
                <div className="h-60 w-full flex items-center justify-center text-slate-400 text-sm font-medium text-center px-4">
                  No department appointment data yet
                </div>
              ) : (
                <>
                  <div className="h-60 w-full text-xs flex justify-center items-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deptShares}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {deptShares.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-bold text-slate-850">{deptShares.length} Depts</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active</span>
                    </div>
                  </div>

                  {/* Legend checklist */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 mt-2">
                    {deptShares.map((d: any) => (
                      <div key={d.name} className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="truncate">{d.name} ({d.value}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Financial trends Area chart */}
            <div className="card lg:col-span-3 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-500" />
                Financial Billings Growth (Last 6 Months)
              </h3>
              {financialTrends.every((d: any) => d.Collected === 0 && d.Unpaid === 0) ? (
                <div className="h-72 w-full flex items-center justify-center text-slate-400 text-sm font-medium">
                  No billing activity in the last 6 months
                </div>
              ) : (
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--muted)" />
                      <YAxis stroke="var(--muted)" />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="Collected" stroke="var(--success)" fillOpacity={0.1} fill="url(#colorCollected)" />
                      <Area type="monotone" dataKey="Unpaid" stroke="var(--warning)" fillOpacity={0.05} fill="url(#colorUnpaid)" />

                      <defs>
                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorUnpaid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Reports */}
          <HospitalReportsPanel />
        </div>
      )}
    </div>
  );
}
