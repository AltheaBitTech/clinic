'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { medicalCatalogApi } from '@/lib/api';
import { ArrowLeft, Pencil, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import MedicineForm, {
  CatalogType,
  MedicineFormValues,
  defaultMedicineForm,
  toMedicinePayload,
} from '@/components/medicines/MedicineForm';

const toForm = (item: any): MedicineFormValues => {
  const type: CatalogType = item.type === 'OINTMENT' ? 'OINTMENT' : 'MEDICINE';
  const defaults = defaultMedicineForm(type);
  return {
    name: item.name || '',
    type,
    dosage: item.dosage || '',
    frequency: item.frequency || defaults.frequency,
    timing: item.timing || defaults.timing,
  };
};

export default function EditMedicinePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const qc = useQueryClient();

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['medical-catalog', 'item', id],
    queryFn: () => medicalCatalogApi.getOne(id).then((r) => r.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (values: MedicineFormValues) => medicalCatalogApi.update(id, toMedicinePayload(values)),
    onSuccess: (_res, values) => {
      qc.invalidateQueries({ queryKey: ['medical-catalog'] });
      toast.success('Catalog item updated');
      router.push(`/dashboard/medicines?type=${values.type}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update item'),
  });

  const backHref = `/dashboard/medicines${item?.type ? `?type=${item.type}` : ''}`;

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
          <Pencil className="w-6 h-6 text-cyan-600 shrink-0" /> Edit Catalog Item
        </h1>
        <p className="page-subtitle">Update the defaults suggested when this item is prescribed.</p>
      </div>

      {isLoading ? (
        <div className="card py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading item...
        </div>
      ) : isError || !item ? (
        <div className="card py-12 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">This catalog item could not be found.</p>
        </div>
      ) : (
        <MedicineForm
          key={item.id}
          initialValues={toForm(item)}
          submitLabel="Save Changes"
          isSubmitting={updateMutation.isPending}
          onSubmit={(values) => updateMutation.mutate(values)}
          cancelHref={backHref}
        />
      )}
    </div>
  );
}
