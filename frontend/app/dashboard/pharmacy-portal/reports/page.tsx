'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyReportsApi, pharmacySuppliersApi } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  BarChart3, Receipt, ShoppingCart, Truck, Download, Loader2, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'sales' | 'purchases' | 'suppliers';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'sales', label: 'Sales', icon: Receipt },
  { key: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { key: 'suppliers', label: 'Supplier History', icon: Truck },
];

export default function PharmacyReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sales');

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-600 shrink-0" />
          Reports
        </h1>
        <p className="page-subtitle">Sales revenue, purchasing and supplier history, with export.</p>
      </div>

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

      {activeTab === 'sales' && <SalesReportTab />}
      {activeTab === 'purchases' && <PurchasesReportTab />}
      {activeTab === 'suppliers' && <SupplierHistoryTab />}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'cyan',
}: {
  label: string;
  value: string | number;
  color?: 'cyan' | 'emerald' | 'amber' | 'red' | 'indigo';
}) {
  const colorStyles: Record<string, string> = {
    cyan: 'text-cyan-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
  };
  return (
    <div className="card">
      <p className={`text-lg font-bold leading-tight ${colorStyles[color]}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

async function downloadBlob(fetcher: () => Promise<any>, fileName: string) {
  const res = await fetcher();
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

function ExportButtons({
  onCsv,
  onPdf,
}: {
  onCsv: () => Promise<void>;
  onPdf: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);
  const run = async (kind: 'csv' | 'pdf', fn: () => Promise<void>) => {
    try {
      setBusy(kind);
      await fn();
    } catch {
      toast.error(`Failed to export ${kind.toUpperCase()}`);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => run('csv', onCsv)}
        disabled={busy !== null}
        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
      >
        {busy === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        CSV
      </button>
      <button
        onClick={() => run('pdf', onPdf)}
        disabled={busy !== null}
        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
      >
        {busy === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
        PDF
      </button>
    </div>
  );
}

function SalesReportTab() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const params = { from: from || undefined, to: to || undefined, paymentStatus: paymentStatus || undefined };

  const { data: report, isLoading } = useQuery({
    queryKey: ['pharmacy-reports-sales', params],
    queryFn: () => pharmacyReportsApi.getSales(params).then((r) => r.data),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input text-sm">
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="ml-auto">
          <ExportButtons
            onCsv={() => downloadBlob(() => pharmacyReportsApi.exportSales({ ...params, format: 'csv' }), 'sales-report.csv')}
            onPdf={() => downloadBlob(() => pharmacyReportsApi.exportSales({ ...params, format: 'pdf' }), 'sales-report.pdf')}
          />
        </div>
      </div>

      {isLoading || !report ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Today's Sales" value={`${report.today.count} / ${formatCurrency(report.today.revenue)}`} color="emerald" />
            <StatCard label="Total Revenue" value={formatCurrency(report.totals.revenue)} />
            <StatCard label="Payment Collected" value={formatCurrency(report.totals.paymentsCollected)} color="emerald" />
            <StatCard label="Outstanding" value={formatCurrency(report.totals.outstanding)} color="amber" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Discount Given" value={formatCurrency(report.totals.discount)} />
            <StatCard label="GST / Tax Collected" value={formatCurrency(report.totals.tax)} />
            <StatCard label="Refunds" value={`${report.refunds.count} / ${formatCurrency(report.refunds.amount)}`} color="indigo" />
            <StatCard label="Cancelled Sales" value={`${report.cancelled.count} / ${formatCurrency(report.cancelled.amount)}`} color="red" />
          </div>

          <BreakdownGrid
            title="Month-wise Revenue"
            labelHeader="Month"
            rows={report.monthWise.map((m: any) => ({ label: m.month, count: m.count, value: m.revenue }))}
          />
          <BreakdownGrid
            title="Year-wise Revenue"
            labelHeader="Year"
            rows={report.yearWise.map((y: any) => ({ label: y.year, count: y.count, value: y.revenue }))}
          />

          <div className="card overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 px-3">Invoice</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 px-3">Paid</th>
                  <th className="py-2 px-3">Outstanding</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.sales.slice(0, 50).map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="py-2 px-3 font-medium">{s.invoiceNo}</td>
                    <td className="py-2 px-3 text-slate-500">{formatDateTime(s.createdAt)}</td>
                    <td className="py-2 px-3">{formatCurrency(s.total)}</td>
                    <td className="py-2 px-3">{formatCurrency(s.paid)}</td>
                    <td className="py-2 px-3">{formatCurrency(s.outstanding)}</td>
                    <td className="py-2 px-3">{s.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.sales.length > 50 && (
              <p className="text-xs text-slate-400 pt-3 px-3">Showing first 50 of {report.sales.length} — export for the full list.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PurchasesReportTab() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');

  const { data: suppliers } = useQuery({
    queryKey: ['pharmacy-suppliers-all'],
    queryFn: () => pharmacySuppliersApi.getAll().then((r) => r.data),
  });

  const params = {
    from: from || undefined,
    to: to || undefined,
    supplierId: supplierId || undefined,
    status: status || undefined,
    orderNo: orderNo || undefined,
    invoiceNo: invoiceNo || undefined,
  };

  const { data: report, isLoading } = useQuery({
    queryKey: ['pharmacy-reports-purchases', params],
    queryFn: () => pharmacyReportsApi.getPurchases(params).then((r) => r.data),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Supplier</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input text-sm">
            <option value="">All</option>
            {(suppliers || []).map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input text-sm">
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Order No.</label>
          <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className="input text-sm w-32" placeholder="PO-..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Invoice No.</label>
          <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="input text-sm w-32" />
        </div>
        <div className="ml-auto">
          <ExportButtons
            onCsv={() => downloadBlob(() => pharmacyReportsApi.exportPurchases({ ...params, format: 'csv' }), 'purchase-report.csv')}
            onPdf={() => downloadBlob(() => pharmacyReportsApi.exportPurchases({ ...params, format: 'pdf' }), 'purchase-report.pdf')}
          />
        </div>
      </div>

      {isLoading || !report ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Today's Purchases" value={`${report.today.count} / ${formatCurrency(report.today.amount)}`} color="emerald" />
            <StatCard label="Total Purchase Amount" value={formatCurrency(report.totals.amount)} />
            <StatCard label="Received Stock Value" value={formatCurrency(report.receivedStockValue)} color="emerald" />
            <StatCard label="Pending Orders" value={`${report.pending.count} / ${formatCurrency(report.pending.amount)}`} color="amber" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Cancelled Orders" value={`${report.cancelled.count} / ${formatCurrency(report.cancelled.amount)}`} color="red" />
            <StatCard label="Purchase Returns" value={`${report.returns.count} / ${formatCurrency(report.returns.amount)}`} color="indigo" />
          </div>

          <BreakdownGrid
            title="Month-wise Purchases"
            labelHeader="Month"
            rows={report.monthWise.map((m: any) => ({ label: m.month, count: m.count, value: m.amount }))}
          />
          <BreakdownGrid
            title="Supplier-wise Purchases"
            labelHeader="Supplier"
            rows={report.supplierWise.map((s: any) => ({ label: s.supplierName, count: s.count, value: s.amount }))}
          />

          <div className="card overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 px-3">Order No</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3">Invoice No</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.orders.slice(0, 50).map((o: any) => (
                  <tr key={o.id} className="border-b border-slate-50">
                    <td className="py-2 px-3 font-medium">{o.orderNo}</td>
                    <td className="py-2 px-3 text-slate-500">{formatDate(o.createdAt)}</td>
                    <td className="py-2 px-3">{o.supplier?.name}</td>
                    <td className="py-2 px-3">{o.invoiceNo || '-'}</td>
                    <td className="py-2 px-3">{o.status}</td>
                    <td className="py-2 px-3">{formatCurrency(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.orders.length > 50 && (
              <p className="text-xs text-slate-400 pt-3 px-3">Showing first 50 of {report.orders.length} — export for the full list.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SupplierHistoryTab() {
  const [supplierId, setSupplierId] = useState('');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['pharmacy-reports-supplier-summary'],
    queryFn: () => pharmacyReportsApi.getSupplierHistorySummary().then((r) => r.data),
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['pharmacy-reports-supplier-history', supplierId],
    queryFn: () => pharmacyReportsApi.getSupplierHistory(supplierId).then((r) => r.data),
    enabled: !!supplierId,
  });

  if (!supplierId) {
    return (
      <div>
        {loadingSummary ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div>
        ) : !summary?.length ? (
          <div className="card text-center py-12 text-sm text-slate-400">No purchases recorded against any supplier yet.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3">Orders</th>
                  <th className="py-2 px-3">Total Purchased</th>
                  <th className="py-2 px-3">Last Order</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s: any) => (
                  <tr key={s.supplierId} className="border-b border-slate-50">
                    <td className="py-2 px-3 font-medium">{s.supplierName}</td>
                    <td className="py-2 px-3">{s.orderCount}</td>
                    <td className="py-2 px-3">{formatCurrency(s.totalAmount)}</td>
                    <td className="py-2 px-3 text-slate-500">{formatDate(s.lastOrderAt)}</td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => setSupplierId(s.supplierId)} className="text-cyan-600 hover:text-cyan-700 text-xs font-semibold">
                        View history →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setSupplierId('')} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 mb-4">
        ← Back to all suppliers
      </button>

      {loadingHistory || !history ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-800">{history.supplier?.name}</h2>
            <ExportButtons
              onCsv={() => downloadBlob(() => pharmacyReportsApi.exportSupplierHistory(supplierId, { format: 'csv' }), `${history.supplier?.name || 'supplier'}-history.csv`)}
              onPdf={() => downloadBlob(() => pharmacyReportsApi.exportSupplierHistory(supplierId, { format: 'pdf' }), `${history.supplier?.name || 'supplier'}-history.pdf`)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Orders" value={history.totals.totalOrders} />
            <StatCard label="Total Purchase Amount" value={formatCurrency(history.totals.totalPurchaseAmount)} />
            <StatCard label="Items Purchased" value={history.totals.totalItems} />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 px-3">Medicine</th>
                  <th className="py-2 px-3">Batch No</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Purchase Price</th>
                  <th className="py-2 px-3">MRP</th>
                  <th className="py-2 px-3">Sale Price</th>
                  <th className="py-2 px-3">Purchase Date</th>
                  <th className="py-2 px-3">Expiry</th>
                  <th className="py-2 px-3">Invoice No</th>
                  <th className="py-2 px-3">Order No</th>
                </tr>
              </thead>
              <tbody>
                {history.products.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 px-3 font-medium">{p.medicineName}</td>
                    <td className="py-2 px-3">{p.batchNo}</td>
                    <td className="py-2 px-3">{p.quantity}</td>
                    <td className="py-2 px-3">{formatCurrency(p.purchasePrice)}</td>
                    <td className="py-2 px-3">{p.mrp != null ? formatCurrency(p.mrp) : '-'}</td>
                    <td className="py-2 px-3">{p.salePrice != null ? formatCurrency(p.salePrice) : '-'}</td>
                    <td className="py-2 px-3 text-slate-500">{formatDate(p.purchaseDate)}</td>
                    <td className="py-2 px-3 text-slate-500">{formatDate(p.expiryDate)}</td>
                    <td className="py-2 px-3">{p.invoiceNo || '-'}</td>
                    <td className="py-2 px-3">{p.orderNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.products.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No purchase line items for this supplier yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BreakdownGrid({
  title,
  labelHeader,
  rows,
}: {
  title: string;
  labelHeader: string;
  rows: { label: string; count: number; value: number }[];
}) {
  if (!rows.length) return null;
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-400 border-b border-slate-100">
              <th className="py-1.5 px-3">{labelHeader}</th>
              <th className="py-1.5 px-3">Count</th>
              <th className="py-1.5 px-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-50">
                <td className="py-1.5 px-3 font-medium">{r.label}</td>
                <td className="py-1.5 px-3">{r.count}</td>
                <td className="py-1.5 px-3">{formatCurrency(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
