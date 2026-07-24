'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import { 
  BarChart3, Loader2, Calendar, Users, ClipboardList, 
  TrendingUp, IndianRupee, PieChart as PieIcon, Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

export default function AnalyticsPage() {
  // Queries
  const { data: stats, isLoading } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: () => tenantsApi.getMyStats().then((r) => r.data),
  });

  // Mock historical data for premium visualization
  const appointmentTrends = [
    { name: 'Mon', 'Appointments': 12, 'Walk-ins': 4 },
    { name: 'Tue', 'Appointments': 18, 'Walk-ins': 6 },
    { name: 'Wed', 'Appointments': 15, 'Walk-ins': 3 },
    { name: 'Thu', 'Appointments': 22, 'Walk-ins': 8 },
    { name: 'Fri', 'Appointments': 28, 'Walk-ins': 10 },
    { name: 'Sat', 'Appointments': 10, 'Walk-ins': 2 },
    { name: 'Sun', 'Appointments': 5, 'Walk-ins': 1 },
  ];

  const financialTrends = [
    { name: 'Jan', 'Collected': 25000, 'Unpaid': 4000 },
    { name: 'Feb', 'Collected': 29000, 'Unpaid': 3500 },
    { name: 'Mar', 'Collected': 36000, 'Unpaid': 6000 },
    { name: 'Apr', 'Collected': 42000, 'Unpaid': 7200 },
    { name: 'May', 'Collected': 58000, 'Unpaid': 9500 },
    { name: 'Jun', 'Collected': 64000, 'Unpaid': 8000 },
  ];

  const deptShares = [
    { name: 'Cardiology', value: 35, color: '#6366f1' },
    { name: 'Pediatrics', value: 25, color: '#10b981' },
    { name: 'Neurology', value: 20, color: '#f59e0b' },
    { name: 'General Medicine', value: 20, color: '#ef4444' },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Analytics Dashboard
        </h1>
        <p className="page-subtitle">Real-time clinical metrics, revenue performance reports, and appointment volumes.</p>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> Loading metrics analysis...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Stats overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Appts', value: stats?.totalAppointments || 0, icon: Calendar, color: 'bg-indigo-500', change: '+14% from last week' },
              { label: 'Registered Patients', value: stats?.totalPatients || 0, icon: Users, color: 'bg-emerald-500', change: '+8% this month' },
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
                <Calendar className="w-4 h-4 text-indigo-500" />
                Appointment Distribution (This Week)
              </h3>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="Appointments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Walk-ins" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department share donut chart */}
            <div className="card lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-500" />
                Consultation Share by Dept.
              </h3>
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
                      {deptShares.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold text-slate-850">4 Depts</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Configured</span>
                </div>
              </div>
              
              {/* Legend checklist */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 mt-2">
                {deptShares.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial trends Area chart */}
            <div className="card lg:col-span-3 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-500" />
                Financial Billings Growth (Last 6 Months)
              </h3>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="Collected" stroke="#10b981" fillOpacity={0.1} fill="url(#colorCollected)" />
                    <Area type="monotone" dataKey="Unpaid" stroke="#f59e0b" fillOpacity={0.05} fill="url(#colorUnpaid)" />
                    
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUnpaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
