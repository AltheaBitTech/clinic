'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { pathologyCatalogApi } from '@/lib/api';
import { Microscope, Plus, Search, Loader2, Pencil } from 'lucide-react';

export default function PathologyTestCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: tests, isLoading } = useQuery({
    queryKey: ['pathology-tests', searchQuery],
    queryFn: () => pathologyCatalogApi.getAll(searchQuery || undefined).then((r) => r.data),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Microscope className="w-6 h-6 text-cyan-600 shrink-0" />
            Test Catalog
          </h1>
          <p className="page-subtitle">Lab tests your facility offers, with reference parameters.</p>
        </div>
        <Link
          href="/dashboard/pathology-portal/tests/new"
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Add Test
        </Link>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, code or category..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600" /> Loading catalog...
          </div>
        ) : !tests || tests.length === 0 ? (
          <div className="text-center py-16">
            <Microscope className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No tests in your catalog yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAT</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Params</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {t.name}
                      {t.category && <p className="text-[11px] text-slate-400 font-normal">{t.category}</p>}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.department || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.sampleType}{t.container ? ` (${t.container})` : ''}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">₹{Number(t.price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.turnaroundHours ? `${t.turnaroundHours}h` : '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{t.parameters?.length || 0}</td>
                    <td className="py-3 px-4 text-xs">
                      {t.isActive !== false ? (
                        <span className="badge bg-emerald-50 text-emerald-700 text-[10px] font-bold">Active</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-600 text-[10px] font-bold">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-right">
                      <Link
                        href={`/dashboard/pathology-portal/tests/${t.id}/edit`}
                        aria-label={`Edit ${t.name}`}
                        className="inline-flex text-cyan-600 hover:bg-cyan-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
