'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { pathologyOrdersApi } from '@/lib/api';
import {
  ArrowLeft, FlaskConical, User, Phone, Loader2, Truck, Stethoscope, Download, Barcode, AlertTriangle,
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';

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

const ITEM_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const FLAG_STYLES: Record<string, string> = {
  NORMAL: 'text-slate-500',
  LOW: 'text-blue-600 font-semibold',
  HIGH: 'text-amber-600 font-semibold',
  ABNORMAL: 'text-red-600 font-semibold',
  CRITICAL: 'text-red-600 font-bold',
};

const STATUS_STEPS = [
  'ORDERED',
  'SAMPLE_SCHEDULED',
  'SAMPLE_COLLECTED',
  'RECEIVED_AT_LAB',
  'ACCEPTED',
  'IN_PROGRESS',
  'RESULT_READY',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REPORT_DELIVERED',
];

export default function PathologyOrderDetailPage() {
  const { id } = useParams() as { id: string };

  const { data: order, isLoading } = useQuery({
    queryKey: ['pathology-order', id],
    queryFn: () => pathologyOrdersApi.getOne(id).then((r) => r.data),
  });

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      <Link
        href="/dashboard/pathology-orders"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lab Orders
      </Link>

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="page-title">{order.orderNo}</h1>
            <p className="page-subtitle">Placed {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <span className={`badge text-xs font-bold ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {!['CANCELLED', 'SAMPLE_REJECTED', 'RECOLLECTION_REQUESTED'].includes(order.status) && (
        <div className="card mb-6 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${i <= stepIndex ? 'bg-cyan-500' : 'bg-slate-200'}`} />
                  <span
                    className={`text-[10px] font-semibold whitespace-nowrap ${
                      i <= stepIndex ? 'text-cyan-700' : 'text-slate-400'
                    }`}
                  >
                    {s.replace(/_/g, ' ')}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <span className={`w-8 sm:w-12 h-0.5 mx-1 ${i < stepIndex ? 'bg-cyan-500' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Patient</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{order.patient?.name}</p>
              {order.patient?.phone && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.patient.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Lab</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
              <FlaskConical className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{order.lab?.name}</p>
              {order.lab?.phone && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.lab.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Collection</p>
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
            {order.collectionType === 'HOME' ? <Truck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {order.collectionType === 'HOME' ? 'Home' : 'Walk-in'}
          </p>
        </div>
        {order.scheduledAt && (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Scheduled</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatDateTime(order.scheduledAt)}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Payment</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">{order.paymentStatus}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatCurrency(order.total)}</p>
        </div>
        {order.sampleId && (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium flex items-center gap-1"><Barcode className="w-3 h-3" /> Sample ID</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{order.sampleId}</p>
          </div>
        )}
      </div>

      {order.status === 'SAMPLE_REJECTED' && (
        <div className="card mb-6 bg-red-50 border-red-100">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Sample Rejected
          </p>
          <p className="text-sm text-red-600">
            {order.rejectionReason?.replace(/_/g, ' ')}
            {order.rejectionNotes ? ` — ${order.rejectionNotes}` : ''}
          </p>
        </div>
      )}

      {(order.referringDoctorName || order.referringDoctorId) && (
        <div className="card mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" /> Referring Doctor
          </h3>
          <p className="text-sm text-slate-700">
            {order.referringDoctorName || 'On file'}
            {order.referringDoctorPhone ? ` · ${order.referringDoctorPhone}` : ''}
          </p>
        </div>
      )}

      <div className="card mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tests</h3>
        <div className="space-y-4">
          {(order.items || []).map((item: any) => (
            <div key={item.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="font-semibold text-slate-800 text-sm">{item.testNameSnapshot}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">{formatCurrency(item.price)}</span>
                  <span className={`badge text-[10px] font-bold ${ITEM_STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-600'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              {item.resultValues?.length > 0 && (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-1.5 pr-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parameter</th>
                        <th className="py-1.5 pr-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Value</th>
                        <th className="py-1.5 pr-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</th>
                        <th className="py-1.5 pr-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Range</th>
                        <th className="py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.resultValues.map((rv: any) => (
                        <tr key={rv.id} className="border-b border-slate-50 last:border-none">
                          <td className="py-1.5 pr-3 text-xs text-slate-700">{rv.parameterNameSnapshot}</td>
                          <td className={`py-1.5 pr-3 text-xs ${FLAG_STYLES[rv.flag] || 'text-slate-600'}`}>{rv.value}</td>
                          <td className="py-1.5 pr-3 text-xs text-slate-500">{rv.unit || '—'}</td>
                          <td className="py-1.5 pr-3 text-xs text-slate-500">{rv.refRangeText || '—'}</td>
                          <td className={`py-1.5 text-xs ${FLAG_STYLES[rv.flag] || 'text-slate-600'}`}>{rv.flag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="card mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-sm text-slate-600">{order.notes}</p>
        </div>
      )}

      {order.report?.fileUrl && (
        <div className="card flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Report</h3>
            <p className="text-sm text-slate-600">
              {order.report.status === 'DELIVERED'
                ? 'Delivered'
                : order.report.status === 'VERIFIED'
                  ? 'Verified — ready to view'
                  : 'Draft'}
            </p>
          </div>
          <a
            href={`${BASE_URL}${order.report.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Download Report
          </a>
        </div>
      )}
    </div>
  );
}
