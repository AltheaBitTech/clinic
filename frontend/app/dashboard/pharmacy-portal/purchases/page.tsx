'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacyPurchasesApi } from '@/lib/api';
import {
  ClipboardList,
  Plus,
  Loader2,
  ChevronRight,
  Download,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-200 text-slate-600',
  ORDERED: 'bg-amber-50 text-amber-700',
  PARTIALLY_RECEIVED: 'bg-indigo-50 text-indigo-700',
  RECEIVED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function PharmacyPurchaseOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['pharmacy-purchase-orders'],
    queryFn: () => pharmacyPurchasesApi.getAll().then((r) => r.data),
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [emailOrder, setEmailOrder] = useState<any>(null);
  const [emailInput, setEmailInput] = useState('');

  const handleDownload = async (order: any) => {
    try {
      setDownloadingId(order.id);
      const res = await pharmacyPurchasesApi.downloadPdf(order.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${order.orderNo}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download purchase order');
    } finally {
      setDownloadingId(null);
    }
  };

  const openEmailDialog = (order: any) => {
    setEmailInput(order.supplier?.email || '');
    setEmailOrder(order);
  };

  const emailMutation = useMutation({
    mutationFn: (email: string) => pharmacyPurchasesApi.emailToSupplier(emailOrder.id, email || undefined),
    onSuccess: (res) => {
      toast.success(`Purchase order emailed to ${res.data.recipientEmail}`);
      setEmailOrder(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to email purchase order'),
  });

  const handleWhatsAppShare = (order: any) => {
    const link = pharmacyPurchasesApi.publicPdfUrl(order.id);
    const message = `Purchase Order ${order.orderNo} — view/download: ${link}`;
    const phoneDigits = (order.supplier?.phone || '').replace(/\D/g, '');
    const phone = phoneDigits ? (phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits) : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-cyan-600 shrink-0" />
            Purchase Orders
          </h1>
          <p className="page-subtitle">Order and receive stock from your suppliers.</p>
        </div>
        <Link
          href="/dashboard/pharmacy-portal/purchases/new"
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> New Purchase Order
        </Link>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading purchase orders...
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No purchase orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order No.</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice No.</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Payable</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordered</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">{o.orderNo}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{o.invoiceNo || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{o.supplier?.name || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{o.items?.length ?? 0}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`badge text-[10px] font-bold ${statusStyles[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{o.orderedAt ? formatDate(o.orderedAt) : '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(o)}
                          disabled={downloadingId === o.id}
                          title="Download purchase order PDF"
                          aria-label="Download purchase order PDF"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === o.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEmailDialog(o)}
                          title="Send purchase order via email"
                          aria-label="Send purchase order via email"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(o)}
                          title="Send purchase order via WhatsApp"
                          aria-label="Send purchase order via WhatsApp"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/dashboard/pharmacy-portal/purchases/${o.id}`}
                          className="inline-flex items-center gap-1 text-cyan-600 hover:bg-cyan-50 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!emailOrder} onOpenChange={(open) => !open && setEmailOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>
            <Mail className="w-4 h-4 text-cyan-600" /> Email Purchase Order
          </DialogTitle>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Recipient email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="supplier@example.com"
                className="input text-sm w-full"
              />
            </div>
            <button
              onClick={() => emailMutation.mutate(emailInput)}
              disabled={emailMutation.isPending || !emailInput}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              {emailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {emailMutation.isPending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
