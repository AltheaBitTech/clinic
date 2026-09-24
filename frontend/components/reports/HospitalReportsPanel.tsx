'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar, Users, Stethoscope, IndianRupee, Receipt, CreditCard,
  ClipboardList, Pill, Package, CalendarClock, XCircle, Search,
  Download, Printer, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, RefreshCw, Eye, FileBarChart,
} from 'lucide-react';
import { hospitalReportsApi, doctorsApi, departmentsApi } from '@/lib/api';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

type ReportType =
  | 'appointments' | 'patients' | 'doctor-activity' | 'revenue' | 'invoices'
  | 'payments' | 'prescriptions' | 'pharmacy-sales' | 'inventory'
  | 'follow-ups' | 'cancellations';

interface StatusOption { value: string; label: string }

interface ReportTypeConfig {
  key: ReportType;
  label: string;
  icon: React.ElementType;
  hasDoctor: boolean;
  hasDepartment: boolean;
  hasDate: boolean;
  statusLabel?: string;
  statusOptions?: StatusOption[];
}

const APPOINTMENT_STATUSES: StatusOption[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

const PAYMENT_STATUSES: StatusOption[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const REPORT_TYPES: ReportTypeConfig[] = [
  { key: 'appointments', label: 'Appointment Report', icon: Calendar, hasDoctor: true, hasDepartment: true, hasDate: true, statusLabel: 'Status', statusOptions: APPOINTMENT_STATUSES },
  { key: 'patients', label: 'Patient Report', icon: Users, hasDoctor: false, hasDepartment: false, hasDate: true },
  { key: 'doctor-activity', label: 'Doctor Activity Report', icon: Stethoscope, hasDoctor: true, hasDepartment: true, hasDate: true },
  { key: 'revenue', label: 'Revenue Report', icon: IndianRupee, hasDoctor: true, hasDepartment: true, hasDate: true },
  { key: 'invoices', label: 'Invoice Report', icon: Receipt, hasDoctor: true, hasDepartment: true, hasDate: true, statusLabel: 'Status', statusOptions: PAYMENT_STATUSES },
  { key: 'payments', label: 'Payment Report', icon: CreditCard, hasDoctor: false, hasDepartment: false, hasDate: true, statusLabel: 'Status', statusOptions: PAYMENT_STATUSES },
  { key: 'prescriptions', label: 'Prescription Report', icon: ClipboardList, hasDoctor: true, hasDepartment: true, hasDate: true },
  { key: 'pharmacy-sales', label: 'Pharmacy Sales Report', icon: Pill, hasDoctor: true, hasDepartment: true, hasDate: true },
  { key: 'inventory', label: 'Inventory Report', icon: Package, hasDoctor: false, hasDepartment: false, hasDate: false, statusLabel: 'Type', statusOptions: [{ value: 'MEDICINE', label: 'Medicine' }, { value: 'OINTMENT', label: 'Ointment' }] },
  { key: 'follow-ups', label: 'Follow-up Report', icon: CalendarClock, hasDoctor: true, hasDepartment: true, hasDate: true, statusLabel: 'Status', statusOptions: [{ value: 'upcoming', label: 'Upcoming' }, { value: 'overdue', label: 'Overdue' }] },
  { key: 'cancellations', label: 'Cancellation Report', icon: XCircle, hasDoctor: true, hasDepartment: true, hasDate: true },
];

const DATE_PRESETS: { value: string; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const PAGE_LIMIT = 10;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCell(column: { key: string; label: string }, value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDateTime(value);
  }
  if (typeof value === 'number') {
    return column.label.includes('₹') ? formatCurrency(value) : value.toLocaleString('en-IN');
  }
  return String(value);
}

export default function HospitalReportsPanel() {
  const [reportType, setReportType] = useState<ReportType>('appointments');
  const [preset, setPreset] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewRow, setViewRow] = useState<Record<string, any> | null>(null);
  const [exporting, setExporting] = useState(false);

  const config = useMemo(
    () => REPORT_TYPES.find((r) => r.key === reportType)!,
    [reportType],
  );

  const { data: doctors } = useQuery({
    queryKey: ['reports-doctors'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data?.data || r.data || []),
  });
  const { data: departments } = useQuery({
    queryKey: ['reports-departments'],
    queryFn: () => departmentsApi.getAll().then((r) => r.data || []),
  });

  const params = useMemo(() => {
    const p: Record<string, any> = { page, limit: PAGE_LIMIT };
    if (config.hasDate) {
      if (preset === 'custom') {
        if (fromDate) p.from = fromDate;
        if (toDate) p.to = toDate;
      } else {
        p.preset = preset;
      }
    }
    if (config.hasDoctor && doctorId) p.doctorId = doctorId;
    if (config.hasDepartment && departmentId) p.departmentId = departmentId;
    if (config.statusOptions && status) p.status = status;
    if (search) p.search = search;
    return p;
  }, [config, preset, fromDate, toDate, doctorId, departmentId, status, search, page]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['hospital-report', reportType, params],
    queryFn: () => hospitalReportsApi.run(reportType, params).then((r) => r.data),
  });

  function selectReportType(type: ReportType) {
    setReportType(type);
    setDoctorId('');
    setDepartmentId('');
    setStatus('');
    setSearchInput('');
    setSearch('');
    setPage(1);
    setMobileFiltersOpen(false);
  }

  function clearFilters() {
    setDoctorId('');
    setDepartmentId('');
    setStatus('');
    setPreset('month');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  function runSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  const activeFilterCount =
    (doctorId ? 1 : 0) + (departmentId ? 1 : 0) + (status ? 1 : 0) + (preset !== 'month' ? 1 : 0);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await hospitalReportsApi.export(reportType, params);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    if (!data) return;
    const win = window.open('', '_blank', 'width=1000,height=700');
    if (!win) return;
    const rowsHtml = (data.rows || [])
      .map(
        (row: Record<string, any>) =>
          `<tr>${data.columns
            .map((c: any) => `<td>${escapeHtml(formatCell(c, row[c.key]))}</td>`)
            .join('')}</tr>`,
      )
      .join('');
    const headHtml = data.columns.map((c: any) => `<th>${escapeHtml(c.label)}</th>`).join('');
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(data.label)}</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#1e293b}
        h1{font-size:18px;margin:0 0 2px}
        p{color:#64748b;font-size:12px;margin:0 0 16px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #e2e8f0;padding:6px 10px;font-size:12px;text-align:left;white-space:nowrap}
        th{background:#f1f5f9;font-weight:700}
        tr:nth-child(even){background:#f8fafc}
      </style></head>
      <body>
        <h1>${escapeHtml(data.label)}</h1>
        <p>Generated ${new Date().toLocaleString('en-IN')} · ${data.total} record(s)</p>
        <table><thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_LIMIT)) : 1;

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <FileBarChart className="w-5 h-5 text-cyan-600 shrink-0" />
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Reports</h3>
          <p className="text-xs text-slate-400">Generate, filter, and export operational reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        {/* Report type — vertical list on desktop */}
        <div className="hidden lg:flex lg:flex-col gap-1 border-r border-slate-100 pr-4">
          {REPORT_TYPES.map((r) => {
            const Icon = r.icon;
            const active = r.key === reportType;
            return (
              <button
                key={r.key}
                onClick={() => selectReportType(r.key)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all',
                  active
                    ? 'gradient-primary text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Report type — horizontal scroll chips on mobile/tablet */}
        <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {REPORT_TYPES.map((r) => {
            const Icon = r.icon;
            const active = r.key === reportType;
            return (
              <button
                key={r.key}
                onClick={() => selectReportType(r.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-all border',
                  active
                    ? 'gradient-primary text-white border-transparent shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200',
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {r.label.replace(' Report', '')}
              </button>
            );
          })}
        </div>

        <div className="min-w-0 space-y-4 lg:col-start-2 lg:row-start-1">
          {/* Filters — desktop */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            {config.hasDate && (
              <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
                {DATE_PRESETS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => { setPreset(d.value); setPage(1); }}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                      preset === d.value ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:bg-slate-50',
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            {config.hasDate && preset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="input w-auto text-xs py-1.5" />
                <span className="text-slate-300 text-xs">to</span>
                <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="input w-auto text-xs py-1.5" />
              </div>
            )}
            {config.hasDoctor && (
              <select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setPage(1); }} className="input w-auto text-xs py-1.5">
                <option value="">All Doctors</option>
                {(doctors || []).map((d: any) => (
                  <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName}</option>
                ))}
              </select>
            )}
            {config.hasDepartment && (
              <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }} className="input w-auto text-xs py-1.5">
                <option value="">All Departments</option>
                {(departments || []).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            {config.statusOptions && (
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-auto text-xs py-1.5">
                <option value="">{config.statusLabel || 'Status'}: All</option>
                {config.statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
                Clear filters
              </button>
            )}
          </div>

          {/* Filters — mobile trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex-1 flex items-center justify-between gap-2 bg-white rounded-xl border border-slate-200 pl-3 pr-2.5 py-2 shadow-sm active:scale-[0.98] transition-transform min-w-0"
            >
              <span className="flex items-center gap-2 min-w-0">
                <SlidersHorizontal className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">Filters</span>
              </span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full gradient-primary text-white text-[11px] font-bold shrink-0">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  placeholder="Search…"
                  className="input pl-8 text-xs py-1.5 w-full"
                />
              </div>
              <button onClick={runSearch} className="btn-secondary text-xs px-3 py-1.5 shrink-0">
                Search
              </button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleExport}
                disabled={exporting || isLoading || !data?.rows?.length}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
              >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export
              </button>
              <button
                onClick={handlePrint}
                disabled={isLoading || !data?.rows?.length}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Summary strip */}
          {data?.summary && (
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
              {Object.entries(data.summary)
                .filter(([k, v]) => typeof v === 'number' || typeof v === 'string')
                .map(([k, v]) => (
                  <span key={k} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}:{' '}
                    <span className="text-slate-700">
                      {typeof v === 'number' && k.toLowerCase().includes('amount')
                        ? formatCurrency(v)
                        : typeof v === 'number' && k.toLowerCase().includes('revenue')
                        ? formatCurrency(v)
                        : String(v)}
                    </span>
                  </span>
                ))}
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="py-16 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading report…
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-10 h-10 text-red-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">Couldn&apos;t load this report</p>
              <button onClick={() => refetch()} className="btn-secondary mt-4 inline-flex items-center gap-2 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : !data?.rows?.length ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-3">
                <FileBarChart className="w-7 h-7 text-cyan-300" />
              </div>
              <p className="text-slate-500 font-semibold text-sm">No records found</p>
              <p className="text-slate-400 text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className={cn('overflow-x-auto rounded-xl border border-slate-100', isFetching && 'opacity-60')}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    {data.columns.map((c: any) => (
                      <th key={c.key} className="text-left font-bold uppercase tracking-wide px-3 py-2 whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.rows.map((row: Record<string, any>, i: number) => (
                    <tr key={row.id || i} className="hover:bg-slate-50/70 transition-colors">
                      {data.columns.map((c: any) => (
                        <td key={c.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                          {formatCell(c, row[c.key])}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setViewRow(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"
                          aria-label="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > PAGE_LIMIT && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{data.total}</span> record(s) total
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-xs text-slate-600 px-2 font-medium">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 flex items-center gap-1">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View row detail modal */}
      <Dialog open={!!viewRow} onOpenChange={(open) => !open && setViewRow(null)}>
        <DialogContent>
          <DialogTitle>{config.label} — Details</DialogTitle>
          <div className="space-y-2.5">
            {viewRow && data?.columns.map((c: any) => (
              <div key={c.key} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-slate-400 font-medium shrink-0">{c.label}</span>
                <span className="text-slate-800 font-semibold text-right">{formatCell(c, viewRow[c.key])}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters — mobile sheet */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] sm:hidden" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl sm:hidden max-h-[80vh] flex flex-col animate-sheet-up">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
              <p className="font-bold text-slate-800">Filter Report</p>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Close filters">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto space-y-5">
              {config.hasDate && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Date Range</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DATE_PRESETS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setPreset(d.value)}
                        className={cn(
                          'px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                          preset === d.value ? 'gradient-primary text-white border-transparent shadow-sm' : 'bg-white text-slate-600 border-slate-200',
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  {preset === 'custom' && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input text-sm" />
                      <span className="text-slate-300 text-xs">to</span>
                      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input text-sm" />
                    </div>
                  )}
                </div>
              )}
              {config.hasDoctor && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Doctor</p>
                  <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="input text-sm">
                    <option value="">All Doctors</option>
                    {(doctors || []).map((d: any) => (
                      <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
              {config.hasDepartment && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Department</p>
                  <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input text-sm">
                    <option value="">All Departments</option>
                    {(departments || []).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {config.statusOptions && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">{config.statusLabel || 'Status'}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {config.statusOptions.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(status === s.value ? '' : s.value)}
                        className={cn(
                          'px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all truncate',
                          status === s.value ? 'gradient-primary text-white border-transparent shadow-sm' : 'bg-white text-slate-600 border-slate-200',
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 px-5 py-4 border-t border-slate-100 shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button onClick={() => { clearFilters(); }} className="text-sm font-semibold text-slate-500 hover:text-slate-700 shrink-0">
                Clear all
              </button>
              <button onClick={() => { setPage(1); setMobileFiltersOpen(false); }} className="btn-primary flex-1 text-sm">
                Show results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
