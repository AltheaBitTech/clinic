'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { doctorsApi, patientsApi, appointmentsApi } from '@/lib/api';
import { formatCurrency, getInitials } from '@/lib/utils';
import {
  Calendar, Clock, User, Plus, Search, ArrowLeft,
  AlertCircle, CheckCircle2, Stethoscope, Loader2,
  DollarSign, Activity, FileText, Check, ChevronDown, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isPatient = user?.role === 'PATIENT';

  // State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('CONSULTATION');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Patient Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('MALE');
  const [regDob, setRegDob] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O_POS');
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);

  // If the user is a patient, auto-populate the patient selection
  const { data: myPatientProfile } = useQuery({
    queryKey: ['my-patient-profile'],
    queryFn: () => patientsApi.getMe().then((r) => r.data),
    enabled: isPatient,
  });

  useEffect(() => {
    if (isPatient && myPatientProfile) {
      setSelectedPatient(myPatientProfile);
    }
  }, [isPatient, myPatientProfile]);

  // Query Doctors
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
  });

  // Query Patients (Staff only)
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientsApi.getAll({ search: patientSearch, limit: 10 }).then((r) => r.data),
    enabled: !isPatient,
  });

  // Query Slots
  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['slots', selectedDoctor?.id, selectedDate],
    queryFn: () => doctorsApi.getSlots(selectedDoctor.id, selectedDate).then((r) => r.data),
    enabled: !!selectedDoctor?.id && !!selectedDate,
  });

  // Reset slot selection if doctor or date changes
  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDoctor, selectedDate]);

  // Filter doctors based on search
  const filteredDoctors = doctorsData?.data?.filter((doc: any) => {
    const fullName = `${doc.user.firstName} ${doc.user.lastName}`.toLowerCase();
    const spec = doc.specialization.toLowerCase();
    const dept = (doc.department?.name || '').toLowerCase();
    const query = doctorSearch.toLowerCase();
    return fullName.includes(query) || spec.includes(query) || dept.includes(query);
  }) || [];

  // Handle Booking Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient?.id) {
      toast.error('Please select a patient');
      return;
    }
    if (!selectedDoctor?.id) {
      toast.error('Please select a doctor');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select an appointment date');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    // Construct scheduledAt DateTime ISO string
    // selectedDate is 'YYYY-MM-DD', selectedSlot is 'HH:MM'
    const [hours, minutes] = selectedSlot.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    if (scheduledDateTime.getTime() < Date.now()) {
      toast.error('Cannot book an appointment in the past. Please pick a future date or time.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Booking appointment...');

    try {
      const payload = {
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        scheduledAt: scheduledDateTime.toISOString(),
        type: appointmentType,
        reason: reason || undefined,
        notes: notes || undefined,
      };

      await appointmentsApi.create(payload);
      toast.success('Appointment scheduled successfully!', { id: loadingToast });
      router.push('/dashboard/appointments');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to schedule appointment';
      toast.error(errMsg, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Patient Registration
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFirstName || !regLastName || !regEmail) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsRegSubmitting(true);
    const regToast = toast.loading('Registering patient...');

    try {
      const payload = {
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        phone: regPhone || undefined,
        gender: regGender,
        dateOfBirth: regDob || undefined,
        bloodGroup: regBloodGroup || undefined,
      };

      const response = await patientsApi.create(payload);
      const newPatient = response.data;
      
      setSelectedPatient(newPatient);
      setPatientSearch(`${newPatient.user.firstName} ${newPatient.user.lastName}`);
      
      toast.success('Patient registered and selected!', { id: regToast });
      
      // Reset Modal Form
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPhone('');
      setRegDob('');
      setIsRegModalOpen(false);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to register patient';
      toast.error(errMsg, { id: regToast });
    } finally {
      setIsRegSubmitting(false);
    }
  };

  // Minimum date for picker is today
  const todayStr = new Date().toISOString().split('T')[0];

  // Selected details breakdown
  const consultationFee = Number(selectedDoctor?.consultationFee || 0);
  const serviceTax = consultationFee * 0.18; // 18% tax
  const totalCost = consultationFee + serviceTax;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Back Link */}
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 text-sm font-medium mb-5 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Appointments
      </Link>

      <div className="page-header sm:mb-8">
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 animate-pulse shrink-0" />
          Schedule New Appointment
        </h1>
        <p className="page-subtitle">Set up a consultation slot with one of our specialized clinic doctors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: PATIENT INFORMATION */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0">1</span>
                <h3 className="font-semibold text-slate-800">Patient Information</h3>
              </div>
              {!isPatient && (
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(true)}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 bg-cyan-50/50 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Register New Patient
                </button>
              )}
            </div>

            {isPatient ? (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 text-sm font-bold flex items-center justify-center">
                  {selectedPatient ? getInitials(selectedPatient.user.firstName, selectedPatient.user.lastName) : '...'}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {selectedPatient ? `${selectedPatient.user.firstName} ${selectedPatient.user.lastName}` : 'Loading profile...'}
                  </p>
                  <p className="text-xs text-slate-500">{selectedPatient?.user?.email} · {selectedPatient?.patientCode || 'Loading...'}</p>
                </div>
                <span className="badge bg-cyan-100 text-cyan-800 text-xs ml-auto">Your Profile</span>
              </div>
            ) : (
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Registered Patient
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    placeholder="Search by patient name, email, phone or code..."
                    className="input pl-10"
                  />
                  {selectedPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch('');
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Patient Search Dropdown */}
                {isPatientDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {isLoadingPatients ? (
                      <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Searching...
                      </div>
                    ) : patientsData?.data?.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-400">
                        No patients found.
                        <button
                          type="button"
                          onClick={() => {
                            setIsPatientDropdownOpen(false);
                            setIsRegModalOpen(true);
                          }}
                          className="text-cyan-600 hover:underline font-semibold ml-1 block w-full mt-1.5"
                        >
                          Register this patient
                        </button>
                      </div>
                    ) : (
                      patientsData?.data?.map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientSearch(`${p.user.firstName} ${p.user.lastName}`);
                            setIsPatientDropdownOpen(false);
                          }}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center shrink-0">
                              {getInitials(p.user.firstName, p.user.lastName)}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-slate-800 text-sm">{p.user.firstName} {p.user.lastName}</p>
                              <p className="text-xs text-slate-400">{p.user.email} · {p.user.phone || 'No phone'}</p>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                            {p.patientCode}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {/* Close Dropdown Backdrop Overlay */}
                {isPatientDropdownOpen && (
                  <div className="fixed inset-0 z-0" onClick={() => setIsPatientDropdownOpen(false)} />
                )}
              </div>
            )}
          </div>

          {/* STEP 2: SELECT DOCTOR */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">2</span>
              <h3 className="font-semibold text-slate-800">Select Doctor</h3>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Doctor / Specialist
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={doctorSearch}
                  onFocus={() => setIsDoctorDropdownOpen(true)}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value);
                    setIsDoctorDropdownOpen(true);
                  }}
                  placeholder="Search doctor by name, department, or specialization..."
                  className="input pl-10"
                />
                {selectedDoctor && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDoctor(null);
                      setDoctorSearch('');
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Doctor Selection Dropdown */}
              {isDoctorDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {isLoadingDoctors ? (
                    <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Loading doctors...
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">No doctors match your search.</div>
                  ) : (
                    filteredDoctors.map((doc: any) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setDoctorSearch(`Dr. ${doc.user.firstName} ${doc.user.lastName}`);
                          setIsDoctorDropdownOpen(false);
                        }}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold flex items-center justify-center shrink-0">
                            {getInitials(doc.user.firstName, doc.user.lastName)}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-800 text-sm">Dr. {doc.user.firstName} {doc.user.lastName}</p>
                            <p className="text-xs text-slate-400">
                              {doc.specialization} · {doc.department?.name || 'General'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg shrink-0">
                          {formatCurrency(doc.consultationFee)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {/* Close Dropdown Backdrop Overlay */}
              {isDoctorDropdownOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsDoctorDropdownOpen(false)} />
              )}
            </div>

            {selectedDoctor && (
              <div className="flex items-start gap-3 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100/50 mt-3 animate-fade-in">
                <Stethoscope className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Selected Doctor Info</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-medium text-slate-700">Specialization:</span> {selectedDoctor.specialization}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Department:</span> {selectedDoctor.department?.name || 'General'}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Consultation Fee:</span> {formatCurrency(selectedDoctor.consultationFee)}
                  </p>
                  <p className="text-xs text-cyan-600 font-medium mt-1">
                    Available: {selectedDoctor.availableDays.join(', ')} ({selectedDoctor.consultationStart} - {selectedDoctor.consultationEnd})
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: SCHEDULE DATE & TIME */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">3</span>
              <h3 className="font-semibold text-slate-800">Select Date & Time</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Appointment Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input pl-10"
                    disabled={!selectedDoctor}
                  />
                </div>
              </div>
            </div>

            {selectedDoctor && selectedDate && (
              <div className="space-y-3 mt-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Available Slots
                </label>

                {isLoadingSlots ? (
                  <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                    <span className="text-sm font-medium">Fetching doctor availability slots...</span>
                  </div>
                ) : slotsData?.available === false ? (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    Doctor is not available on this day. Please select another date.
                  </div>
                ) : slotsData?.slots?.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    All slots are booked for this day. Please choose another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {slotsData.slots.map((slot: string) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex items-center justify-center py-2.5 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                          selectedSlot === slot
                            ? 'bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-200 scale-[1.03]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/30'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 mr-1.5 ${selectedSlot === slot ? 'text-white' : 'text-slate-400'}`} />
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 4: VISIT DETAILS */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">4</span>
              <h3 className="font-semibold text-slate-800">Visit Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Appointment Type
                </label>
                <div className="relative">
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    className="input appearance-none pr-10"
                  >
                    <option value="CONSULTATION">Regular Consultation</option>
                    <option value="FOLLOW_UP">Follow Up Visit</option>
                    <option value="CHECKUP">General Checkup</option>
                    <option value="PROCEDURE">Clinical Procedure</option>
                    <option value="EMERGENCY">Emergency Care</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Reason for Visit
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Mild fever, follow-up on test report..."
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="List down any symptoms, medications, or details the doctor should know..."
                className="input min-h-[100px] resize-y"
              />
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: BOOKING SUMMARY CARD */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6 border border-slate-100 shadow-md space-y-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-cyan-600" />
              Booking Summary
            </h3>

            {/* Summary Details */}
            <div className="space-y-4">
              {/* Patient Profile */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</span>
                {selectedPatient ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {getInitials(selectedPatient.user.firstName, selectedPatient.user.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{selectedPatient.patientCode}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No patient selected</p>
                )}
              </div>

              {/* Doctor Details */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor</span>
                {selectedDoctor ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0">
                      Dr
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{selectedDoctor.specialization}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No doctor selected</p>
                )}
              </div>

              {/* Date / Time */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduled For</span>
                {selectedDate && selectedSlot ? (
                  <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-cyan-900 text-sm">{selectedDate}</p>
                      <p className="text-xs text-cyan-700 font-medium">Slot Time: {selectedSlot}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Select date & available slot</p>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            {selectedDoctor && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cost Breakdown</span>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Consultation Fee</span>
                  <span>{formatCurrency(consultationFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Service GST (18%)</span>
                  <span>{formatCurrency(serviceTax)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-800 text-base border-t border-slate-100 pt-2 mt-1">
                  <span>Total Payable</span>
                  <span className="text-cyan-600">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedPatient || !selectedDoctor || !selectedDate || !selectedSlot}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-cyan-100 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Scheduling...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Schedule Appointment
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QUICK PATIENT REGISTRATION MODAL */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <User className="w-5 h-5 text-cyan-600" />
              Register Patient Profile
            </h3>

            <form onSubmit={handleRegisterPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="patient@email.com"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="input appearance-none pr-10"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    max={todayStr}
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <div className="relative">
                    <select
                      value={regBloodGroup}
                      onChange={(e) => setRegBloodGroup(e.target.value)}
                      className="input appearance-none pr-10"
                    >
                      <option value="O_POS">O+</option>
                      <option value="O_NEG">O-</option>
                      <option value="A_POS">A+</option>
                      <option value="A_NEG">A-</option>
                      <option value="B_POS">B+</option>
                      <option value="B_NEG">B-</option>
                      <option value="AB_POS">AB+</option>
                      <option value="AB_NEG">AB-</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="btn-secondary px-5 py-2.5 text-sm font-semibold"
                  disabled={isRegSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2.5 text-sm font-semibold flex items-center gap-1.5"
                  disabled={isRegSubmitting}
                >
                  {isRegSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Register Patient
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
