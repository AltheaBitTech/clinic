'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import {
  Building2, Search, Mail, Phone, Calendar, 
  ShieldCheck, Loader2, Users, FileText, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HospitalsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: tenantsData, isLoading, refetch } = useQuery({
    queryKey: ['tenants', page],
    queryFn: () => tenantsApi.getAll({ page, limit: 10 }).then((r) => r.data),
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      // In MVP, we can toggle isActive using update endpoint
      await tenantsApi.update(tenantId, { isActive: !currentStatus });
      toast.success('Hospital status updated!');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="page-header flex justify-between items-center">
          <div className="w-48 h-8 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="card h-96 bg-white animate-pulse rounded-2xl" />
      </div>
    );
  }

  const tenants = tenantsData?.data || [];
  const filteredTenants = tenants.filter((t: any) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Registered Hospitals</h1>
          <p className="page-subtitle">View and manage all active hospital nodes deployed on Arogyix.</p>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals by name, slug..."
            value={searchTerm}
            onChange={handleSearch}
            className="input pl-9"
          />
        </div>
        <div className="text-xs text-slate-400 ml-0 sm:ml-auto">
          Showing {filteredTenants.length} of {tenantsData?.total || 0} hospitals
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Hospital Info</th>
                <th>Slug / Domain</th>
                <th>Contacts</th>
                <th>Sub-records</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant: any) => (
                <tr key={tenant.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 font-bold shrink-0">
                        {tenant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{tenant.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {tenant.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded text-slate-600">
                      {tenant.slug}
                    </span>
                  </td>
                  <td>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{tenant.email}</span>
                      </div>
                      {tenant.phone && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{tenant.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-4 text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5" title="Total App Admins / Staff">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{tenant._count?.users || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Total Registered Patients">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{tenant._count?.patients || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Total Booked Appointments">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{tenant._count?.appointments || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      'badge text-[10px] uppercase font-semibold px-2 py-0.5',
                      tenant.subscriptionPlan === 'FREE' && 'bg-slate-100 text-slate-700 border border-slate-200/50',
                      tenant.subscriptionPlan === 'BASIC' && 'bg-blue-50 text-blue-700 border border-blue-200/50',
                      tenant.subscriptionPlan === 'PROFESSIONAL' && 'bg-cyan-50 text-cyan-700 border border-cyan-200/50',
                      tenant.subscriptionPlan === 'ENTERPRISE' && 'bg-purple-50 text-purple-700 border border-purple-200/50'
                    )}>
                      {tenant.subscriptionPlan}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                      className={cn(
                        'badge border text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition py-0.5 px-2.5',
                        tenant.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50'
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', tenant.isActive ? 'bg-emerald-500' : 'bg-red-500')} />
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <span className="text-xs text-slate-500">
                      {new Date(tenant.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium">No hospitals matching the search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {tenantsData?.pages > 1 && (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-50">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 self-center">
              Page {page} of {tenantsData.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, tenantsData.pages))}
              disabled={page === tenantsData.pages}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
