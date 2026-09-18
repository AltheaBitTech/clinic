'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pathologyOrdersApi, pathologyCollectorsApi, pathologyResultsApi } from '@/lib/api';
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin, Building2, Truck,
  CalendarClock, FlaskConical, ShieldCheck, PackageCheck, Ban, FileDown,
  Plus, Trash2, ClipboardCheck, PackageOpen, XCircle, RotateCcw,
  ClipboardList, AlertTriangle, BellRing, CheckCheck, FileEdit, Barcode,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

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

const itemStatusStyles: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-500',
};

const flagStyles: Record<string, string> = {
  NORMAL: 'bg-emerald-50 text-emerald-700',
  LOW: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-700',
  ABNORMAL: 'bg-red-50 text-red-700',
  CRITICAL: 'bg-red-600 text-white',
};

const rejectionReasonOptions = [
  'INSUFFICIENT_SAMPLE',
  'WRONG_CONTAINER',
  'HEMOLYZED',
  'SAMPLE_EXPIRED',
  'CONTAMINATED',
  'OTHER',
];

const sampleTypeOptions = ['BLOOD', 'URINE', 'STOOL', 'SPUTUM', 'SWAB', 'CSF', 'TISSUE', 'BIOPSY', 'FNAC', 'BODY_FLUID', 'OTHER'];

export default function PathologyOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const qc = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(rejectionReasonOptions[0]);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showAmendForm, setShowAmendForm] = useState(false);
  const [amendReason, setAmendReason] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['pathology-order', id],
    queryFn: () => pathologyOrdersApi.getOne(id).then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pathology-order', id] });
    qc.invalidateQueries({ queryKey: ['pathology-orders'] });
  };

  const receiveMutation = useMutation({
    mutationFn: () => pathologyOrdersApi.receive(id),
    onSuccess: () => {
      toast.success('Sample received at lab');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const acceptSampleMutation = useMutation({
    mutationFn: () => pathologyOrdersApi.acceptSample(id),
    onSuccess: () => {
      toast.success('Sample accepted for processing');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to accept sample'),
  });

  const rejectSampleMutation = useMutation({
    mutationFn: () => pathologyOrdersApi.rejectSample(id, { rejectionReason, rejectionNotes: rejectionNotes || undefined }),
    onSuccess: () => {
      toast.success('Sample rejected');
      setShowRejectForm(false);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reject sample'),
  });

  const requestRecollectionMutation = useMutation({
    mutationFn: () => pathologyOrdersApi.requestRecollection(id),
    onSuccess: () => {
      toast.success('Recollection requested');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to request recollection'),
  });

  const startProcessingMutation = useMutation({
    mutationFn: () => pathologyOrdersApi.startProcessing(id),
    onSuccess: () => {
      toast.success('Processing started');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => pathologyOrdersApi.cancel(id, { cancelReason: cancelReason || undefined }),
    onSuccess: () => {
      toast.success('Order cancelled');
      setShowCancelForm(false);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel'),
  });

  const submitForVerificationMutation = useMutation({
    mutationFn: () => pathologyResultsApi.submitForVerification(id),
    onSuccess: () => {
      toast.success('Submitted for pathologist verification');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to submit'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => pathologyResultsApi.verify(id),
    onSuccess: () => {
      toast.success('Report verified');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to verify'),
  });

  const deliverMutation = useMutation({
    mutationFn: () => pathologyResultsApi.deliver(id),
    onSuccess: () => {
      toast.success('Report delivered');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to deliver'),
  });

  const amendMutation = useMutation({
    mutationFn: () => pathologyResultsApi.amend(id, { reason: amendReason }),
    onSuccess: () => {
      toast.success('Report reopened for correction');
      setShowAmendForm(false);
      setAmendReason('');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to amend'),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const status = order.status;
  const canSchedule = status === 'ORDERED' || status === 'SAMPLE_SCHEDULED' || status === 'RECOLLECTION_REQUESTED';
  const canMarkCollected = status === 'SAMPLE_SCHEDULED';
  const canReceive = status === 'SAMPLE_COLLECTED';
  const canAcceptOrReject = status === 'RECEIVED_AT_LAB';
  const canRequestRecollection = status === 'SAMPLE_REJECTED';
  const canStartProcessing = status === 'ACCEPTED';
  const canEnterResults = status === 'ACCEPTED' || status === 'IN_PROGRESS';
  const canSubmitForVerification = status === 'RESULT_READY';
  const canVerify = status === 'PENDING_VERIFICATION';
  const canDeliver = status === 'VERIFIED';
  const canAmend = (status === 'VERIFIED' || status === 'REPORT_DELIVERED') && !showAmendForm;
  const canCancel = status !== 'REPORT_DELIVERED' && status !== 'CANCELLED';

  const isMutating =
    receiveMutation.isPending ||
    acceptSampleMutation.isPending ||
    rejectSampleMutation.isPending ||
    requestRecollectionMutation.isPending ||
    startProcessingMutation.isPending ||
    cancelMutation.isPending ||
    submitForVerificationMutation.isPending ||
    verifyMutation.isPending ||
    deliverMutation.isPending ||
    amendMutation.isPending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      <Link href="/dashboard/pathology-portal/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="page-title">{order.orderNo}</h1>
            <p className="page-subtitle">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge text-[10px] font-semibold ${order.hospitalTenantId ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            {order.hospitalTenantId ? 'Hospital-linked' : 'Walk-in'}
          </span>
          <span className={`badge text-xs font-bold ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Patient info */}
      <div className="card mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Patient</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={User} label="Name" value={order.patient?.name} />
          {order.patient?.phone && <InfoRow icon={Phone} label="Phone" value={order.patient.phone} />}
          {order.patient?.email && <InfoRow icon={Mail} label="Email" value={order.patient.email} />}
          {order.patient?.gender && <InfoRow icon={User} label="Gender" value={order.patient.gender} />}
          {order.patient?.dateOfBirth && (
            <InfoRow icon={CalendarClock} label="Date of Birth" value={formatDate(order.patient.dateOfBirth)} />
          )}
          {order.patient?.address && <InfoRow icon={MapPin} label="Address" value={order.patient.address} />}
        </div>
      </div>

      {/* Timeline / billing summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Timeline</h3>
          <div className="space-y-2">
            {order.scheduledAt && <InfoRow icon={CalendarClock} label="Scheduled" value={formatDateTime(order.scheduledAt)} />}
            {order.sampleCollectedAt && <InfoRow icon={Truck} label="Collected" value={formatDateTime(order.sampleCollectedAt)} />}
            {order.receivedAtLabAt && <InfoRow icon={Building2} label="Received at Lab" value={formatDateTime(order.receivedAtLabAt)} />}
            {order.resultReadyAt && <InfoRow icon={FlaskConical} label="Result Ready" value={formatDateTime(order.resultReadyAt)} />}
            {order.verifiedAt && <InfoRow icon={ShieldCheck} label="Verified" value={formatDateTime(order.verifiedAt)} />}
            {order.reportDeliveredAt && <InfoRow icon={PackageCheck} label="Delivered" value={formatDateTime(order.reportDeliveredAt)} />}
            {!order.scheduledAt && !order.sampleCollectedAt && (
              <p className="text-xs text-slate-400">No collection scheduled yet.</p>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Billing</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-700">₹{Number(order.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium text-slate-700">₹{Number(order.discount).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-medium text-slate-700">₹{Number(order.tax).toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5"><span className="font-semibold text-slate-700">Total</span><span className="font-bold text-slate-900">₹{Number(order.total).toFixed(2)}</span></div>
            <div className="flex justify-between pt-1"><span className="text-slate-500">Payment</span><span className="badge text-[10px] font-bold bg-slate-100 text-slate-600">{order.paymentStatus}</span></div>
          </div>
        </div>
      </div>

      {order.collector && (
        <div className="card mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Assigned Collector</p>
            <p className="text-sm font-semibold text-slate-700">{order.collector.name} {order.collector.phone ? `· ${order.collector.phone}` : ''}</p>
          </div>
        </div>
      )}

      {order.sampleId && (
        <div className="card mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium flex items-center gap-1"><Barcode className="w-3 h-3" /> Sample ID</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{order.sampleId}</p>
          </div>
          {order.sampleType && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Sample Type</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{order.sampleType}</p>
            </div>
          )}
          {order.container && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Container</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{order.container}</p>
            </div>
          )}
          {order.acceptedAt && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Accepted</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatDateTime(order.acceptedAt)}</p>
            </div>
          )}
        </div>
      )}

      {status === 'SAMPLE_REJECTED' && (
        <div className="card mb-6 bg-red-50 border-red-100">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Sample Rejected
          </p>
          <p className="text-sm text-red-600">
            {order.rejectionReason?.replace(/_/g, ' ')}
            {order.rejectionNotes ? ` — ${order.rejectionNotes}` : ''}
          </p>
          {canRequestRecollection && (
            <button
              onClick={() => requestRecollectionMutation.mutate()}
              disabled={isMutating}
              className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {requestRecollectionMutation.isPending ? 'Requesting...' : 'Request Recollection'}
            </button>
          )}
        </div>
      )}

      {order.report?.isAmended && (
        <div className="card mb-6 bg-amber-50 border-amber-100">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <FileEdit className="w-3.5 h-3.5" /> Amended Report
          </p>
          <p className="text-sm text-amber-700">{order.report.amendmentReason}</p>
        </div>
      )}

      {canSchedule && (
        <ScheduleCollectionCard
          orderId={id}
          order={order}
          onDone={invalidate}
        />
      )}

      {canMarkCollected && <CollectSampleCard orderId={id} onDone={invalidate} />}

      {/* Report download */}
      {order.report?.fileUrl && (
        <div className="card mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Lab Report</p>
            <p className="text-xs text-slate-400">
              Status: {order.report.status}
              {order.report.deliveredAt ? ` · Delivered ${formatDateTime(order.report.deliveredAt)}` : ''}
            </p>
          </div>
          <a
            href={`${BASE_URL}${order.report.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <FileDown className="w-4 h-4" /> Download
          </a>
        </div>
      )}

      {/* Items */}
      <div className="card mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tests</h3>
        <div className="space-y-4">
          {(order.items || []).map((item: any) => (
            <OrderItem key={item.id} item={item} canEnterResults={canEnterResults} onSaved={invalidate} />
          ))}
        </div>
      </div>

      {order.cancelReason && (
        <div className="card mb-6 bg-red-50 border-red-100">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Cancellation Reason</p>
          <p className="text-sm text-red-600">{order.cancelReason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canReceive && (
          <button
            onClick={() => receiveMutation.mutate()}
            disabled={isMutating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Building2 className="w-4 h-4" />
            {receiveMutation.isPending ? 'Updating...' : 'Receive at Lab'}
          </button>
        )}
        {canAcceptOrReject && (
          <button
            onClick={() => acceptSampleMutation.mutate()}
            disabled={isMutating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <PackageOpen className="w-4 h-4" />
            {acceptSampleMutation.isPending ? 'Accepting...' : 'Accept Sample'}
          </button>
        )}
        {canAcceptOrReject && !showRejectForm && (
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={isMutating}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4" /> Reject Sample
          </button>
        )}
        {canStartProcessing && (
          <button
            onClick={() => startProcessingMutation.mutate()}
            disabled={isMutating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FlaskConical className="w-4 h-4" />
            {startProcessingMutation.isPending ? 'Updating...' : 'Start Processing'}
          </button>
        )}
        {canSubmitForVerification && (
          <button
            onClick={() => submitForVerificationMutation.mutate()}
            disabled={isMutating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <ClipboardList className="w-4 h-4" />
            {submitForVerificationMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
          </button>
        )}
        {canVerify && (
          <button
            onClick={() => verifyMutation.mutate()}
            disabled={isMutating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            {verifyMutation.isPending ? 'Verifying...' : 'Verify Report'}
          </button>
        )}
        {canDeliver && (
          <button
            onClick={() => deliverMutation.mutate()}
            disabled={isMutating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <PackageCheck className="w-4 h-4" />
            {deliverMutation.isPending ? 'Delivering...' : 'Deliver Report'}
          </button>
        )}
        {canAmend && (
          <button
            onClick={() => setShowAmendForm(true)}
            disabled={isMutating}
            className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl transition-colors"
          >
            <FileEdit className="w-4 h-4" /> Amend Report
          </button>
        )}
        {canCancel && !showCancelForm && (
          <button
            onClick={() => setShowCancelForm(true)}
            disabled={isMutating}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
          >
            <Ban className="w-4 h-4" /> Cancel Order
          </button>
        )}
      </div>

      {showRejectForm && (
        <div className="card mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejection Reason</label>
          <select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="input text-sm">
            {rejectionReasonOptions.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <textarea
            value={rejectionNotes}
            onChange={(e) => setRejectionNotes(e.target.value)}
            rows={2}
            className="input resize-none text-sm"
            placeholder="Additional notes (optional)..."
          />
          <div className="flex gap-3">
            <button
              onClick={() => rejectSampleMutation.mutate()}
              disabled={rejectSampleMutation.isPending}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {rejectSampleMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button onClick={() => setShowRejectForm(false)} className="btn-secondary text-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showAmendForm && (
        <div className="card mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Amendment Reason</label>
          <textarea
            value={amendReason}
            onChange={(e) => setAmendReason(e.target.value)}
            rows={2}
            className="input resize-none text-sm"
            placeholder="Why is this report being corrected?"
          />
          <div className="flex gap-3">
            <button
              onClick={() => amendMutation.mutate()}
              disabled={amendMutation.isPending || !amendReason.trim()}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {amendMutation.isPending ? 'Reopening...' : 'Reopen for Correction'}
            </button>
            <button onClick={() => setShowAmendForm(false)} className="btn-secondary text-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showCancelForm && (
        <div className="card mt-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancellation Reason</label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            className="input resize-none text-sm"
            placeholder="Optional reason..."
          />
          <div className="flex gap-3">
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
            <button onClick={() => setShowCancelForm(false)} className="btn-secondary text-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Collect sample card ────────────────────────────────────────────────── */

function CollectSampleCard({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [sampleType, setSampleType] = useState('BLOOD');
  const [container, setContainer] = useState('');
  const [notes, setNotes] = useState('');

  const collectMutation = useMutation({
    mutationFn: () =>
      pathologyOrdersApi.markCollected(orderId, {
        sampleType,
        container: container || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Sample registered as collected');
      onDone();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to register sample'),
  });

  return (
    <div className="card mb-6 space-y-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Barcode className="w-3.5 h-3.5" /> Register Sample Collection
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sample Type</label>
          <select value={sampleType} onChange={(e) => setSampleType(e.target.value)} className="input text-sm">
            {sampleTypeOptions.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Container</label>
          <input
            type="text"
            value={container}
            onChange={(e) => setContainer(e.target.value)}
            placeholder="e.g. EDTA tube"
            className="input text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-sm" />
      </div>
      <button onClick={() => collectMutation.mutate()} disabled={collectMutation.isPending} className="btn-primary text-sm">
        {collectMutation.isPending ? 'Saving...' : 'Mark Collected — Assign Sample ID'}
      </button>
    </div>
  );
}

/* ── Schedule collection card ───────────────────────────────────────────── */

function ScheduleCollectionCard({ orderId, order, onDone }: { orderId: string; order: any; onDone: () => void }) {
  const [collectionType, setCollectionType] = useState(order.collectionType || 'LAB_VISIT');
  const [scheduledAt, setScheduledAt] = useState(order.scheduledAt ? order.scheduledAt.slice(0, 16) : '');
  const [collectionAddress, setCollectionAddress] = useState(order.collectionAddress || '');
  const [collectorId, setCollectorId] = useState(order.collector?.id || '');

  const { data: collectors } = useQuery({
    queryKey: ['pathology-collectors'],
    queryFn: () => pathologyCollectorsApi.getAll().then((r) => r.data),
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      pathologyOrdersApi.scheduleCollection(orderId, {
        collectionType: collectionType || undefined,
        scheduledAt: scheduledAt || undefined,
        collectionAddress: collectionAddress || undefined,
        collectorId: collectorId || undefined,
      }),
    onSuccess: () => {
      toast.success('Collection scheduled');
      onDone();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to schedule collection'),
  });

  return (
    <div className="card mb-6 space-y-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Schedule Sample Collection</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Collection Type</label>
          <select value={collectionType} onChange={(e) => setCollectionType(e.target.value)} className="input text-sm">
            <option value="LAB_VISIT">Lab Visit</option>
            <option value="HOME_COLLECTION">Home Collection</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Scheduled At</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="input text-sm"
          />
        </div>
      </div>
      {collectionType === 'HOME_COLLECTION' && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Collection Address</label>
          <input
            type="text"
            value={collectionAddress}
            onChange={(e) => setCollectionAddress(e.target.value)}
            className="input text-sm"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Collector</label>
        <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="input text-sm">
          <option value="">Unassigned</option>
          {(collectors || [])
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
        </select>
      </div>
      <button
        onClick={() => scheduleMutation.mutate()}
        disabled={scheduleMutation.isPending}
        className="btn-primary text-sm"
      >
        {scheduleMutation.isPending ? 'Saving...' : order.status === 'SAMPLE_SCHEDULED' ? 'Update Schedule' : 'Schedule Collection'}
      </button>
    </div>
  );
}

/* ── Order item + result entry ──────────────────────────────────────────── */

type ResultRow = {
  parameterId?: string;
  parameterNameSnapshot: string;
  value: string;
  unit: string;
  refRangeText: string;
  flag: string;
  comment: string;
};

function OrderItem({ item, canEnterResults, onSaved }: { item: any; canEnterResults: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<ResultRow[]>([]);

  useEffect(() => {
    if (item.resultValues?.length) {
      setRows(
        item.resultValues.map((rv: any) => ({
          parameterId: rv.parameterId,
          parameterNameSnapshot: rv.parameterNameSnapshot || '',
          value: rv.value != null ? String(rv.value) : '',
          unit: rv.unit || '',
          refRangeText: rv.refRangeText || '',
          flag: rv.flag || 'NORMAL',
          comment: rv.comment || '',
        })),
      );
    } else if (item.test?.parameters?.length) {
      setRows(
        item.test.parameters.map((p: any) => ({
          parameterId: p.id,
          parameterNameSnapshot: p.name,
          value: '',
          unit: p.unit || '',
          refRangeText: p.refRangeText || '',
          flag: 'NORMAL',
          comment: '',
        })),
      );
    } else {
      setRows([{ parameterNameSnapshot: item.testNameSnapshot || item.test?.name || '', value: '', unit: '', refRangeText: '', flag: 'NORMAL', comment: '' }]);
    }
  }, [item]);

  const enterMutation = useMutation({
    mutationFn: (results: any[]) => pathologyResultsApi.enter(item.id, { results }),
    onSuccess: () => {
      toast.success('Results saved');
      setEditing(false);
      onSaved();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save results'),
  });

  const notifyMutation = useMutation({
    mutationFn: (resultValueId: string) => pathologyResultsApi.notifyCritical(resultValueId),
    onSuccess: () => {
      toast.success('Doctor notification recorded');
      onSaved();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record notification'),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (resultValueId: string) => pathologyResultsApi.acknowledgeCritical(resultValueId),
    onSuccess: () => {
      toast.success('Acknowledgement recorded');
      onSaved();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record acknowledgement'),
  });

  const addRow = () => setRows((prev) => [...prev, { parameterNameSnapshot: '', value: '', unit: '', refRangeText: '', flag: 'NORMAL', comment: '' }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const setRow = (i: number, field: keyof ResultRow, value: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const handleSave = () => {
    const invalid = rows.find((r) => !r.parameterNameSnapshot.trim() || !r.value.trim());
    if (invalid) {
      toast.error('Every result row needs a parameter name and value');
      return;
    }
    enterMutation.mutate(
      rows.map((r) => ({
        parameterId: r.parameterId || undefined,
        parameterNameSnapshot: r.parameterNameSnapshot.trim(),
        value: r.value.trim(),
        unit: r.unit || undefined,
        refRangeText: r.refRangeText || undefined,
        flag: r.flag || undefined,
        comment: r.comment || undefined,
      })),
    );
  };

  return (
    <div className="border border-slate-100 rounded-xl p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{item.testNameSnapshot}</p>
          <p className="text-xs text-slate-400">₹{Number(item.price).toFixed(2)} · {item.test?.sampleType}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge text-[10px] font-bold ${itemStatusStyles[item.status] || 'bg-slate-100 text-slate-600'}`}>
            {item.status}
          </span>
          {canEnterResults && !editing && (
            <button onClick={() => setEditing(true)} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">
              {item.resultValues?.length ? 'Edit Results' : 'Enter Results'}
            </button>
          )}
        </div>
      </div>

      {!editing && item.resultValues?.length > 0 && (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parameter</th>
                <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Value</th>
                <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Range</th>
                <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flag</th>
                <th className="py-1.5 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical</th>
              </tr>
            </thead>
            <tbody>
              {item.resultValues.map((rv: any) => (
                <tr key={rv.id} className="border-b border-slate-50 last:border-none align-top">
                  <td className="py-1.5 px-2 text-xs font-medium text-slate-700">{rv.parameterNameSnapshot}</td>
                  <td className="py-1.5 px-2 text-xs text-slate-600">
                    {rv.value} {rv.unit || ''}
                    {rv.comment && <p className="text-[11px] text-slate-400 mt-0.5">{rv.comment}</p>}
                  </td>
                  <td className="py-1.5 px-2 text-xs text-slate-500">{rv.refRangeText || '—'}</td>
                  <td className="py-1.5 px-2 text-xs">
                    <span className={`badge text-[10px] font-bold ${flagStyles[rv.flag] || 'bg-slate-100 text-slate-600'}`}>
                      {rv.flag}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-xs">
                    {rv.isCritical ? (
                      rv.acknowledgedAt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCheck className="w-3 h-3" /> Acknowledged
                        </span>
                      ) : rv.doctorNotified ? (
                        <button
                          onClick={() => acknowledgeMutation.mutate(rv.id)}
                          disabled={acknowledgeMutation.isPending}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg"
                        >
                          <AlertTriangle className="w-3 h-3" /> Awaiting ack
                        </button>
                      ) : (
                        <button
                          onClick={() => notifyMutation.mutate(rv.id)}
                          disabled={notifyMutation.isPending}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg"
                        >
                          <BellRing className="w-3 h-3" /> Notify Doctor
                        </button>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="space-y-2 mt-2">
          {rows.map((r, i) => (
            <div key={i} className="space-y-1.5 p-2 rounded-lg bg-slate-50/60">
              <div className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Parameter *"
                  value={r.parameterNameSnapshot}
                  onChange={(e) => setRow(i, 'parameterNameSnapshot', e.target.value)}
                  className="input text-xs col-span-3"
                />
                <input
                  type="text"
                  placeholder="Value *"
                  value={r.value}
                  onChange={(e) => setRow(i, 'value', e.target.value)}
                  className="input text-xs col-span-2"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={r.unit}
                  onChange={(e) => setRow(i, 'unit', e.target.value)}
                  className="input text-xs col-span-2"
                />
                <input
                  type="text"
                  placeholder="Ref range"
                  value={r.refRangeText}
                  onChange={(e) => setRow(i, 'refRangeText', e.target.value)}
                  className="input text-xs col-span-2"
                />
                <select
                  value={r.flag}
                  onChange={(e) => setRow(i, 'flag', e.target.value)}
                  className="input text-xs col-span-2"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">Low</option>
                  <option value="HIGH">High</option>
                  <option value="ABNORMAL">Abnormal</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label="Remove row"
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer col-span-1 flex justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Comment / microscopy finding (optional)"
                value={r.comment}
                onChange={(e) => setRow(i, 'comment', e.target.value)}
                className="input text-xs w-full"
              />
            </div>
          ))}
          <p className="text-[11px] text-slate-400">
            Values outside a parameter&apos;s critical range are auto-flagged CRITICAL on save, regardless of the flag chosen here.
          </p>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={enterMutation.isPending}
              className="btn-primary flex items-center gap-2 text-xs px-4 py-2"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              {enterMutation.isPending ? 'Saving...' : 'Save Results'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
