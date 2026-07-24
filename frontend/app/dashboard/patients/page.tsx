'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/lib/api';
import { Users, Search, Plus, Phone, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getInitials } from '@/lib/utils';

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => patientsApi.getAll({ search, page, limit: 15 }).then((r) => r.data),
  });

  return (
    <div className="p-8 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patient records and medical history</p>
        </div>
        <Link href="/dashboard/patients/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Register Patient
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, patient code..."
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Code</th>
              <th>Phone</th>
              <th>Blood Group</th>
              <th>City</th>
              <th>Registered</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400">No patients found</p>
                </td>
              </tr>
            ) : (
              data?.data?.map((patient: any) => (
                <tr key={patient.id} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                        {getInitials(patient.user.firstName, patient.user.lastName)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{patient.user.firstName} {patient.user.lastName}</p>
                        <p className="text-xs text-slate-400">{patient.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge bg-slate-100 text-slate-600">{patient.patientCode}</span></td>
                  <td>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />{patient.user.phone || 'N/A'}
                    </span>
                  </td>
                  <td><span className="badge bg-red-50 text-red-600">{patient.bloodGroup || 'N/A'}</span></td>
                  <td>
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />{patient.city || 'N/A'}
                    </span>
                  </td>
                  <td className="text-slate-500 text-xs">{formatDate(patient.createdAt)}</td>
                  <td>
                    <Link href={`/dashboard/patients/${patient.id}`}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      View <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">Showing {data.data.length} of {data.total} patients</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-600 px-3">{page} / {data.pages}</span>
            <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
