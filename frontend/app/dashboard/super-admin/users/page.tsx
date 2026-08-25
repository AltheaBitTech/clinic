'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import {
  ArrowLeft, Search, ChevronDown, ChevronLeft, ChevronRight,
  Users, Shield, Stethoscope, Briefcase, HeartPulse, Building2, Mail, Phone,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admins' },
  { value: 'HOSPITAL_ADMIN', label: 'Hospital Admins' },
  { value: 'DOCTOR', label: 'Doctors' },
  { value: 'RECEPTIONIST', label: 'Receptionists' },
  { value: 'PATIENT', label: 'Patients' },
];

function getRoleIcon(role: string) {
  switch (role) {
    case 'SUPER_ADMIN': return Shield;
    case 'HOSPITAL_ADMIN': return Building2;
    case 'DOCTOR': return Stethoscope;
    case 'PATIENT': return HeartPulse;
    default: return Briefcase;
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'SUPER_ADMIN': return 'bg-slate-800 text-white border-slate-800';
    case 'HOSPITAL_ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200/50';
    case 'DOCTOR': return 'bg-cyan-50 text-cyan-700 border-cyan-200/50';
    case 'RECEPTIONIST': return 'bg-blue-50 text-blue-700 border-blue-200/50';
    default: return 'bg-slate-100 text-slate-600 border-slate-200/50';
  }
}

export default function PlatformUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: users, isLoading } = useQuery({
    queryKey: ['platform-users', roleFilter, page],
    queryFn: () =>
      usersApi.getPlatform({ role: roleFilter || undefined, page }).then((r) => r.data),
  });

  const list = users || [];
  const filtered = list.filter((u: any) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || u.email.toLowerCase().includes(query);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col gap-3">
        <Link
          href="/dashboard/super-admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-cyan-600 transition w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Super Admin Portal
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600 shrink-0" />
            Platform Users
          </h1>
          <p className="page-subtitle">Every user account across all hospital and pharmacy tenants on Arogyix.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="input pl-10"
          />
        </div>

        <div className="relative w-full sm:w-56 shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="input appearance-none pr-10"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Tenant</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">Loading platform users…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u: any) => {
                  const RoleIcon = getRoleIcon(u.role);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200">
                            {getInitials(u.firstName, u.lastName)}
                          </div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{u.firstName} {u.lastName}</p>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          'badge font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 border inline-flex items-center gap-1',
                          getRoleBadgeColor(u.role)
                        )}>
                          <RoleIcon className="w-2.5 h-2.5" />
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600">{u.tenant?.name || '—'}</span>
                      </td>
                      <td>
                        <span className={cn(
                          'badge font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5',
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-red-50 text-red-700 border border-red-200/50'
                        )}>
                          {u.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
          <p className="text-xs text-slate-400">Page {page}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={list.length < 20}
              className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
