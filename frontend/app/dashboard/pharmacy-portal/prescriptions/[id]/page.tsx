'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pharmacyPrescriptionsApi } from '@/lib/api';
import { ArrowLeft, ClipboardCheck, PackageCheck, Loader2, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  VERIFIED: 'bg-cyan-50 text-cyan-700',
  PARTIALLY_DISPENSED: 'bg-indigo-50 text-indigo-700',
  DISPENSED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

export default function PharmacyPrescriptionDetailPage() {
  const { id } = useParams() as { id: string };
  const qc = useQueryClient();
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, string>>({});

  const { data: prescription, isLoading } = useQuery({
    queryKey: ['pharmacy-prescription', id],
    queryFn: () => pharmacyPrescriptionsApi.getOne(id).then((r) => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: () => pharmacyPrescriptionsApi.verify(id),
    onSuccess: () => {
      toast.success('Prescription verified');
      qc.invalidateQueries({ queryKey: ['pharmacy-prescription', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to verify'),
  });

  const dispenseMutation = useMutation({
    mutationFn: (items: { prescriptionItemId: string; quantity: number }[]) =>
      pharmacyPrescriptionsApi.dispense(id, { items }),
    onSuccess: () => {
      toast.success('Prescription dispensed');
      setDispenseQuantities({});
      qc.invalidateQueries({ queryKey: ['pharmacy-prescription', id] });
      qc.invalidateQueries({ queryKey: ['pharmacy-inventory-batches'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to dispense'),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!prescription) return null;

  const remainingQty = (item: any) => {
    const dispensedQty = (prescription.dispenses || [])
      .flatMap((d: any) => d.items || [])
      .filter((di: any) => di.prescriptionItemId === item.id)
      .reduce((sum: number, di: any) => sum + di.quantity, 0);
    return item.quantity - dispensedQty;
  };

  const canDispense = prescription.status === 'VERIFIED' || prescription.status === 'PARTIALLY_DISPENSED';

  const handleDispense = () => {
    const items = Object.entries(dispenseQuantities)
      .filter(([, qty]) => qty && Number(qty) > 0)
      .map(([prescriptionItemId, qty]) => ({ prescriptionItemId, quantity: Number(qty) }));
    if (items.length === 0) {
      toast.error('Enter a quantity for at least one item');
      return;
    }
    dispenseMutation.mutate(items);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-3xl mx-auto">
      <Link href="/dashboard/pharmacy-portal/prescriptions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Prescriptions
      </Link>

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="page-title">{prescription.patient?.name}</h1>
            <p className="page-subtitle">{formatDate(prescription.createdAt)}</p>
          </div>
        </div>
        <span className={`badge text-xs font-bold ${statusStyles[prescription.status] || 'bg-slate-100 text-slate-600'}`}>
          {prescription.status.replace('_', ' ')}
        </span>
      </div>

      {(prescription.diagnosis || prescription.advice) && (
        <div className="card mb-6 space-y-2">
          {prescription.diagnosis && (
            <p className="text-sm"><span className="font-semibold text-slate-600">Diagnosis: </span>{prescription.diagnosis}</p>
          )}
          {prescription.advice && (
            <p className="text-sm"><span className="font-semibold text-slate-600">Advice: </span>{prescription.advice}</p>
          )}
        </div>
      )}

      <div className="card mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosage</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</th>
                {canDispense && (
                  <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispense Qty</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(prescription.items || []).map((item: any) => {
                const remaining = remainingQty(item);
                return (
                  <tr key={item.id} className="border-b border-slate-50 last:border-none">
                    <td className="py-2 px-3 text-xs font-semibold text-slate-800">{item.medicineName}</td>
                    <td className="py-2 px-3 text-xs text-slate-500">
                      {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-600">{item.quantity}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{remaining}</td>
                    {canDispense && (
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          disabled={remaining <= 0 || !item.medicineId}
                          value={dispenseQuantities[item.id] || ''}
                          onChange={(e) =>
                            setDispenseQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder={!item.medicineId ? 'Not mapped' : remaining <= 0 ? 'Done' : '0'}
                          className="input text-xs w-24 py-1.5"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        {prescription.status === 'PENDING' && (
          <button
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <ClipboardCheck className="w-4 h-4" />
            {verifyMutation.isPending ? 'Verifying...' : 'Verify Prescription'}
          </button>
        )}
        {canDispense && (
          <button
            onClick={handleDispense}
            disabled={dispenseMutation.isPending}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <PackageCheck className="w-4 h-4" />
            {dispenseMutation.isPending ? 'Dispensing...' : 'Dispense Selected Items'}
          </button>
        )}
      </div>
    </div>
  );
}
