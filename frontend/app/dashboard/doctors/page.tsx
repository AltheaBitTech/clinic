'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, departmentsApi, usersApi } from '@/lib/api';
import { Stethoscope, Plus, Search, Edit2, Check, X, Calendar, Clock, Loader2, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials, formatCurrency } from '@/lib/utils';

export default function DoctorsPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);

  // Form fields state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [qualification, setQualification] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [experienceYears, setExperienceYears] = useState(2);
  const [consultationFee, setConsultationFee] = useState(500);
  const [bio, setBio] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [consultationStart, setConsultationStart] = useState('09:00');
  const [consultationEnd, setConsultationEnd] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);

  // Queries
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll().then((r) => r.data),
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'DOCTOR'],
    queryFn: () => usersApi.getAll({ role: 'DOCTOR' }).then((r) => r.data),
  });

  // Calculate doctor users who don't have a profile configured yet
  const configuredUserIds = new Set(doctorsData?.data?.map((d: any) => d.userId) || []);
  const unconfiguredDoctorUsers = usersData?.filter((u: any) => !configuredUserIds.has(u.id)) || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => doctorsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Doctor profile configured successfully!');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to configure profile';
      toast.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => doctorsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor profile updated!');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    }
  });

  const closeModal = () => {
    setIsConfigModalOpen(false);
    setEditingDoctor(null);
    setSelectedUserId('');
    setSpecialization('');
    setDepartmentId('');
    setQualification('');
    setRegistrationNo('');
    setExperienceYears(2);
    setConsultationFee(500);
    setBio('');
    setAvailableDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
    setConsultationStart('09:00');
    setConsultationEnd('17:00');
    setSlotDuration(30);
  };

  const openConfigNew = () => {
    closeModal();
    setIsConfigModalOpen(true);
  };

  const openEdit = (doc: any) => {
    setEditingDoctor(doc);
    setSelectedUserId(doc.userId);
    setSpecialization(doc.specialization);
    setDepartmentId(doc.departmentId || '');
    setQualification(doc.qualification || '');
    setRegistrationNo(doc.registrationNo || '');
    setExperienceYears(Number(doc.experienceYears || 0));
    setConsultationFee(Number(doc.consultationFee || 0));
    setBio(doc.bio || '');
    setAvailableDays(doc.availableDays);
    setConsultationStart(doc.consultationStart);
    setConsultationEnd(doc.consultationEnd);
    setSlotDuration(Number(doc.slotDuration || 30));
    setIsConfigModalOpen(true);
  };

  const handleDayToggle = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!specialization.trim()) {
      toast.error('Specialization is required');
      return;
    }

    const payload = {
      userId: selectedUserId,
      specialization,
      departmentId: departmentId || undefined,
      qualification: qualification || undefined,
      registrationNo: registrationNo || undefined,
      experienceYears: Number(experienceYears),
      consultationFee: Number(consultationFee),
      bio: bio || undefined,
      availableDays,
      consultationStart,
      consultationEnd,
      slotDuration: Number(slotDuration),
    };

    if (editingDoctor) {
      updateMutation.mutate({ id: editingDoctor.id, payload });
    } else {
      if (!selectedUserId) {
        toast.error('Please select a doctor user account');
        return;
      }
      createMutation.mutate(payload);
    }
  };

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
        <button onClick={openConfigNew} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Configure Doctor Profile
        </button>
      </div>

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
                  <button
                    onClick={() => openEdit(doc)}
                    aria-label={`Edit Dr. ${doc.user.firstName} ${doc.user.lastName}`}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
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

      {/* CONFIGURE DOCTOR MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden animate-scale-up relative">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-6 pt-6 pb-3 border-b border-slate-100 shrink-0 sticky top-0 bg-white z-10">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              {editingDoctor ? `Edit Profile: Dr. ${editingDoctor.user.firstName}` : 'Configure Doctor Profile'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-4 overflow-y-auto">

              {/* Account Selection (Only for Create) */}
              {!editingDoctor && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Doctor User Account <span className="text-red-500">*</span>
                  </label>
                  {unconfiguredDoctorUsers.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      No unconfigured Doctor accounts. Go to the Staff page to invite/register doctor user accounts.
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        required
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="input appearance-none pr-10"
                      >
                        <option value="">-- Choose User --</option>
                        {unconfiguredDoctorUsers.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              )}

              {/* Specialization & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Cardiologist, Dermatologist"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="input appearance-none pr-10"
                    >
                      <option value="">General / None</option>
                      {departmentsData?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Qualification, Reg No, Experience */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD, FRCS"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Medical Reg No.
                  </label>
                  <input
                    type="text"
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    placeholder="e.g. MC-56789"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    min={0}
                    className="input"
                  />
                </div>
              </div>

              {/* Fee & Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Consultation Fee (INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    min={0}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Slot Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    min={10}
                    max={120}
                    className="input"
                  />
                </div>
              </div>

              {/* Consultation Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Consultation Start (24h)
                  </label>
                  <input
                    type="text"
                    value={consultationStart}
                    onChange={(e) => setConsultationStart(e.target.value)}
                    placeholder="09:00"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Consultation End (24h)
                  </label>
                  <input
                    type="text"
                    value={consultationEnd}
                    onChange={(e) => setConsultationEnd(e.target.value)}
                    placeholder="17:00"
                    className="input"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Bio / Details
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell patients about this doctor's specialization, accomplishments..."
                  className="input min-h-[80px]"
                />
              </div>

              {/* Days checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Weekly Available Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const checked = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          checked
                            ? 'bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || (!editingDoctor && !selectedUserId)}
                  className="btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
