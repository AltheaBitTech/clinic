'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi, usersApi } from '@/lib/api';
import { Stethoscope, Plus, Search, Edit2, Clock } from 'lucide-react';
import Link from 'next/link';
import { getInitials, formatCurrency } from '@/lib/utils';

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'DOCTOR'],
    queryFn: () => usersApi.getAll({ role: 'DOCTOR' }).then((r) => r.data),
  });

  // Calculate doctor users who don't have a profile configured yet
  const configuredUserIds = new Set(doctorsData?.data?.map((d: any) => d.userId) || []);
  const unconfiguredDoctorUsers = usersData?.filter((u: any) => !configuredUserIds.has(u.id)) || [];

  // Filter list
  const filteredDoctors = doctorsData?.data?.filter((doc: any) => {
    const fullName = `${doc.user.firstName} ${doc.user.lastName}`.toLowerCase();
    const spec = doc.specialization.toLowerCase();
    const dept = (doc.department?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || spec.includes(query) || dept.includes(query);
  }) || [];

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-cyan-600 shrink-0" />
            Doctors Directory
          </h1>
          <p className="page-subtitle">Configure doctor consultation fees, clinical schedules, and details.</p>
        </div>
        <Link
          href="/dashboard/doctors/new"
          className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Configure Doctor Profile
        </Link>
      </div>

      {unconfiguredDoctorUsers.length === 0 && usersData !== undefined && (
        <p className="text-xs text-slate-400 -mt-4 mb-6">
          No unconfigured Doctor accounts. Go to the Staff page to invite/register doctor user accounts.
        </p>
      )}

      {/* Search and Filters */}
      <div className="card mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, specialization, or department..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Grid of Doctor profiles */}
      {isLoadingDoctors ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card text-center py-16">
          <Stethoscope className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No configured doctor profiles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc: any) => (
            <div key={doc.id} className="card card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-700 text-sm font-bold flex items-center justify-center shrink-0 border border-cyan-100">
                      {getInitials(doc.user.firstName, doc.user.lastName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">
                        Dr. {doc.user.firstName} {doc.user.lastName}
                      </h3>
                      <p className="text-xs text-cyan-600 font-medium mt-0.5">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-400 truncate">{doc.department?.name || 'General Department'}</p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/doctors/${doc.id}/edit`}
                    aria-label={`Edit Dr. ${doc.user.firstName} ${doc.user.lastName}`}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {doc.bio && (
                  <p className="text-xs text-slate-500 line-clamp-3 italic mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    &ldquo;{doc.bio}&rdquo;
                  </p>
                )}

                <div className="space-y-2 text-xs text-slate-600 mb-4 border-t border-slate-50 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(doc.consultationFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-medium text-slate-800">{doc.experienceYears} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reg No:</span>
                    <span className="font-medium text-slate-800">{doc.registrationNo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timing:</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {doc.consultationStart} - {doc.consultationEnd} ({doc.slotDuration}m slots)
                    </span>
                  </div>
                </div>
              </div>

              {/* Available Days */}
              <div className="border-t border-slate-50 pt-3 mt-auto">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Availability</span>
                <div className="flex flex-wrap gap-1">
                  {daysOfWeek.map((day) => {
                    const isAvailable = doc.availableDays.includes(day);
                    return (
                      <span
                        key={day}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-50 text-slate-300 border border-slate-100/50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
