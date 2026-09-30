'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalCatalogApi } from '@/lib/api';
import {
  Pill, Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight,
  Loader2, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

type CatalogType = 'MEDICINE' | 'OINTMENT';

function MedicinesCatalogContent() {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: CatalogType = searchParams.get('type') === 'OINTMENT' ? 'OINTMENT' : 'MEDICINE';
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const setActiveTab = (tab: CatalogType) => {
    router.replace(`/dashboard/medicines?type=${tab}`, { scroll: false });
  };

  // Queries
  const { data: catalogItems, isLoading } = useQuery({
    queryKey: ['medical-catalog', activeTab],
    queryFn: () => medicalCatalogApi.getAll({ type: activeTab }).then((r) => r.data),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => medicalCatalogApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-catalog', activeTab] });
      toast.success('Catalog item removed');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to remove item';
      toast.error(msg);
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this item from the catalog?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredItems = catalogItems?.filter((item: any) => {
    const n = item.name.toLowerCase();
    const d = (item.dosage || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return n.includes(q) || d.includes(q);
  }) || [];

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredItems, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Pill className="w-6 h-6 text-cyan-600 animate-pulse shrink-0" />
            Medicines & Ointments Catalog
          </h1>
          <p className="page-subtitle">Define preconfigured medicines and topical ointments for faster autocompleted prescription writing.</p>
        </div>
        <Link
          href={`/dashboard/medicines/new?type=${activeTab}`}
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add {activeTab === 'MEDICINE' ? 'Medicine' : 'Ointment'}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => { setActiveTab('MEDICINE'); setSearchQuery(''); }}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'MEDICINE'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Pill className="w-4 h-4" /> Oral Medicines
        </button>
        <button
          onClick={() => { setActiveTab('OINTMENT'); setSearchQuery(''); }}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'OINTMENT'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Topical Ointments
        </button>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search catalog ${activeTab === 'MEDICINE' ? 'medicines' : 'ointments'} by name or dosage...`}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading catalogue...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Pill className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No {activeTab === 'MEDICINE' ? 'medicines' : 'ointments'} found in the catalogue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">Item Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">Default Dosage</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">Default Frequency</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">Default Timing</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100">Date Configured</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item: any, idx: number) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-cyan-50/40 transition-colors border-b border-slate-100 last:border-none ${
                      idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900 border-r border-slate-100">{item.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 border-r border-slate-100">{item.dosage || 'None'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 border-r border-slate-100">{item.frequency || 'None'}</td>
                    <td className="py-3 px-4 text-xs border-r border-slate-100">
                      {item.timing ? (
                        <span className="badge bg-cyan-50 text-cyan-700 text-[10px] font-bold">
                          {item.timing.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 border-r border-slate-100">{formatDate(item.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/medicines/${item.id}/edit`}
                        aria-label={`Edit ${item.name}`}
                        className="inline-flex text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                        aria-label={`Delete ${item.name}`}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border-none bg-transparent transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredItems.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{filteredItems.length}</span>{' '}
            {activeTab === 'MEDICINE' ? 'medicines' : 'ointments'} total
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn-secondary text-sm px-3.5 py-2 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-slate-600 px-3 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary text-sm px-3.5 py-2 disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function MedicinesCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
        </div>
      }
    >
      <MedicinesCatalogContent />
    </Suspense>
  );
}
