'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, departmentsApi, usersApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Sparkles, ChevronLeft, Check, AlertCircle,
  GraduationCap, Briefcase, Clock, FileText, CalendarDays, User,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function NewDoctorProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();

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

  const { data: doctorsData } = useQuery({
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

  const configuredUserIds = new Set(doctorsData?.data?.map((d: any) => d.userId) || []);
  const unconfiguredDoctorUsers = usersData?.filter((u: any) => !configuredUserIds.has(u.id)) || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => doctorsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Doctor profile configured successfully!');
      router.push('/dashboard/doctors');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to configure profile';
      toast.error(msg);
    },
  });

  const handleDayToggle = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Please select a doctor user account');
      return;
    }

    if (!specialization.trim()) {
      toast.error('Specialization is required');
      return;
    }

    const notPurelyNumeric = /[a-zA-Z]/;
    if (!notPurelyNumeric.test(specialization)) {
      toast.error('Specialization cannot be a numeric value');
      return;
    }
    if (qualification && !notPurelyNumeric.test(qualification)) {
      toast.error('Qualifications cannot be a numeric value');
      return;
    }
    if (bio && !notPurelyNumeric.test(bio)) {
      toast.error('Bio / Details cannot be a numeric value');
      return;
    }

    const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeFormat.test(consultationStart)) {
      toast.error('Consultation Start must be a valid 24h time (HH:mm)');
      return;
    }
    if (!timeFormat.test(consultationEnd)) {
      toast.error('Consultation End must be a valid 24h time (HH:mm)');
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

    createMutation.mutate(payload);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/doctors"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Doctors
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200 shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Configure Doctor Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Set up consultation fees, clinical schedule, and details for a doctor account
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="configure-doctor-form">
        {/* ── Section 1: Account ── */}
        <FormSection icon={User} title="Doctor Account" description="Link this profile to a registered doctor user">
          <FormField id="doctor-user" label="Select Doctor User Account" required>
            {isLoadingUsers ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : unconfiguredDoctorUsers.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                No unconfigured Doctor accounts. Go to the Staff page to invite/register doctor user accounts.
              </div>
            ) : (
              <select
                id="doctor-user"
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input appearance-none"
              >
                <option value="">-- Choose User --</option>
                {unconfiguredDoctorUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </FormSection>

        {/* ── Section 2: Specialization & Department ── */}
        <FormSection icon={Stethoscope} title="Specialization" description="Field of practice and department">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="specialization" label="Specialization" required>
              <input
                id="specialization"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Cardiologist, Dermatologist"
                className="input"
              />
            </FormField>

            <FormField id="department" label="Department">
              <select
                id="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="input appearance-none"
              >
                <option value="">General / None</option>
                {departmentsData?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </FormField>
          </div>
        </FormSection>

        {/* ── Section 3: Qualification, Reg No, Experience ── */}
        <FormSection icon={GraduationCap} title="Credentials" description="Qualifications and registration details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField id="qualification" label="Qualifications">
              <input
                id="qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. MBBS, MD, FRCS"
                className="input"
              />
            </FormField>

            <FormField id="registration-no" label="Medical Reg No.">
              <input
                id="registration-no"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="e.g. MC-56789"
                className="input"
              />
            </FormField>

            <FormField id="experience-years" label="Experience (Years)">
              <input
                id="experience-years"
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                min={0}
                className="input"
              />
            </FormField>
          </div>
        </FormSection>

        {/* ── Section 4: Fee & Slots ── */}
        <FormSection icon={Briefcase} title="Consultation & Scheduling" description="Fee, slot duration, and consultation hours">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="consultation-fee" label="Consultation Fee (INR)" required>
              <input
                id="consultation-fee"
                type="number"
                required
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                min={0}
                className="input"
              />
            </FormField>

            <FormField id="slot-duration" label="Slot Duration (Minutes)">
              <input
                id="slot-duration"
                type="number"
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                min={10}
                max={120}
                className="input"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="consultation-start" label="Consultation Start (24h)">
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="consultation-start"
                  type="time"
                  value={consultationStart}
                  onChange={(e) => setConsultationStart(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </FormField>

            <FormField id="consultation-end" label="Consultation End (24h)">
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="consultation-end"
                  type="time"
                  value={consultationEnd}
                  onChange={(e) => setConsultationEnd(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </FormField>
          </div>
        </FormSection>

        {/* ── Section 5: Bio ── */}
        <FormSection icon={FileText} title="Bio / Details" description="Shown to patients when browsing doctors">
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell patients about this doctor's specialization, accomplishments…"
            rows={3}
            className="input resize-none"
          />
        </FormSection>

        {/* ── Section 6: Availability ── */}
        <FormSection icon={CalendarDays} title="Weekly Availability" description="Days this doctor sees patients">
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
        </FormSection>

        {/* ── Submit ── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            id="submit-doctor-btn"
            type="submit"
            disabled={createMutation.isPending || !selectedUserId}
            className="btn-primary flex items-center gap-2 px-6 disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
          <Link href="/dashboard/doctors" className="btn-secondary text-sm px-6">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-600" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
