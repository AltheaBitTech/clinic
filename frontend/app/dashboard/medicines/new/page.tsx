'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalCatalogApi } from '@/lib/api';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MedicineForm, {
  CatalogType,
  MedicineFormValues,
  defaultMedicineForm,
  toMedicinePayload,
} from '@/components/medicines/MedicineForm';

function NewMedicineContent() {
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const initialType: CatalogType = searchParams.get('type') === 'OINTMENT' ? 'OINTMENT' : 'MEDICINE';

  const createMutation = useMutation({
    mutationFn: (values: MedicineFormValues) => medicalCatalogApi.create(toMedicinePayload(values)),
    onSuccess: (_res, values) => {
      qc.invalidateQueries({ queryKey: ['medical-catalog'] });
      toast.success(`${values.type === 'MEDICINE' ? 'Medicine' : 'Ointment'} added to catalog!`);
      router.push(`/dashboard/medicines?type=${values.type}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add item'),
  });

  const backHref = `/dashboard/medicines?type=${initialType}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-5 sm:mb-8">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 shrink-0" /> Add to Catalog
        </h1>
        <p className="page-subtitle">Preconfigure a medicine or ointment so prescriptions autofill its defaults.</p>
      </div>

      <MedicineForm
        initialValues={defaultMedicineForm(initialType)}
        submitLabel="Add to Catalog"
        isSubmitting={createMutation.isPending}
        onSubmit={(values) => createMutation.mutate(values)}
        cancelHref={backHref}
      />
    </div>
  );
}

export default function NewMedicinePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
        </div>
      }
    >
      <NewMedicineContent />
    </Suspense>
  );
}
