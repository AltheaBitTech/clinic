'use client';

import { Suspense, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { doctorsApi, patientsApi, prescriptionsApi, medicalCatalogApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import {
  Plus, Search, ArrowLeft, AlertCircle, CheckCircle2,
  Stethoscope, Loader2, FileText, ChevronDown, Sparkles, Trash2, Pill, Clock, PlusCircle, User
} from 'lucide-react';
import toast from 'react-hot-toast';

function NewPrescriptionContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const patientIdParam = searchParams.get('patientId');
  const appointmentIdParam = searchParams.get('appointmentId');

  // State for Selection
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  // Prescription info state
  const [diagnosis, setDiagnosis] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  
  // Dynamic medicines state
  const [medicines, setMedicines] = useState<any[]>([
    {
      name: '',
      dosage: '',
      frequency: 'Once daily',
      duration: '5 days',
      timing: 'AFTER_FOOD',
      instructions: '',
      reminderTimes: [],
      newTime: '',
      suggestions: [],
      isSuggestionsOpen: false
    }
  ]);

  // Dynamic ointments state
  const [ointments, setOintments] = useState<any[]>([
    {
      name: '',
      dosage: '',
      frequency: 'As needed (PRN)',
      duration: '5 days',
      timing: 'AFTER_FOOD',
      instructions: '',
      reminderTimes: [],
      newTime: '',
      suggestions: [],
      isSuggestionsOpen: false
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Patient Registration Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('MALE');
  const [regDob, setRegDob] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O_POS');
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);

  // Auto-populate patient from query param
  const { data: paramPatientProfile } = useQuery({
    queryKey: ['patient-by-id', patientIdParam],
    queryFn: () => patientsApi.getMe().then((r) => r.data).catch(() => patientsApi.getOne(patientIdParam!).then((r) => r.data)),
    enabled: !!patientIdParam,
  });

  useEffect(() => {
    if (paramPatientProfile) {
      setSelectedPatient(paramPatientProfile);
      setPatientSearch(`${paramPatientProfile.user.firstName} ${paramPatientProfile.user.lastName}`);
    }
  }, [paramPatientProfile]);
     

  // Query Doctors (for Admin role, and as a fallback for a DOCTOR user
  // whose own profile wasn't embedded on the auth response)
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
    enabled: user?.role === 'HOSPITAL_ADMIN' || (user?.role === 'DOCTOR' && !user?.doctor),
  });

  // Auto-populate doctor if user is DOCTOR, falling back to matching
  // their own doctor record by userId if it wasn't already on `user`
  useEffect(() => {
    if (user?.role !== 'DOCTOR') return;
    const own = user.doctor ?? doctorsData?.data?.find((d: any) => d.userId === user.id);
    if (own) {
      setSelectedDoctor(own);
      setDoctorSearch(`Dr. ${user.firstName} ${user.lastName}`);
    }
  }, [user, doctorsData]);

  // Query Patients
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientsApi.getAll({ search: patientSearch, limit: 10 }).then((r) => r.data),
  });

  // Filter doctors based on search (Admin use cases)
  const filteredDoctors = doctorsData?.data?.filter((doc: any) => {
    const fullName = `${doc.user.firstName} ${doc.user.lastName}`.toLowerCase();
    const query = doctorSearch.toLowerCase();
    return fullName.includes(query);
  }) || [];

  // Medicine functions
  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '5 days',
        timing: 'AFTER_FOOD',
        instructions: '',
        reminderTimes: [],
        newTime: '',
        suggestions: [],
        isSuggestionsOpen: false
      }
    ]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length === 1 && ointments.filter(o => o.name.trim()).length === 0) {
      toast.error('A prescription must contain at least one item.');
      return;
    }
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: string, value: any) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    console.log('Updated Medicines:', updated);
    setMedicines(updated);
  };

  // Ointment functions
  const addOintment = () => {
    setOintments([
      ...ointments,
      {
        name: '',
        dosage: '',
        frequency: 'As needed (PRN)',
        duration: '5 days',
        timing: 'AFTER_FOOD',
        instructions: '',
        reminderTimes: [],
        newTime: '',
        suggestions: [],
        isSuggestionsOpen: false
      }
    ]);
  };

  const removeOintment = (index: number) => {
    if (ointments.length === 1 && medicines.filter(m => m.name.trim()).length === 0) {
      toast.error('A prescription must contain at least one item.');
      return;
    }
    setOintments(ointments.filter((_, i) => i !== index));
  };

  const updateOintment = (index: number, field: string, value: any) => {
    const updated = [...ointments];
    updated[index] = { ...updated[index], [field]: value };
    setOintments(updated);
  };

  // Autocomplete fetchers
  const fetchSuggestions = async (
  query: string,
  type: 'MEDICINE' | 'OINTMENT',
  index: number
) => {
  const updateItem = type === 'MEDICINE' ? setMedicines : setOintments;

  if (!query.trim()) {
    updateItem((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, suggestions: [], isSuggestionsOpen: false }
          : item
      )
    );
    return;
  }

  try {
    const response = await medicalCatalogApi.getAll({
      type,
      search: query,
      limit: 5,
    });

    // API likely returns { data: [...] }, not the array directly.
    const suggestions = Array.isArray(response.data)
      ? response.data
      : response.data?.data ?? [];

    updateItem((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, suggestions, isSuggestionsOpen: suggestions.length > 0 }
          : item
      )
    );
  } catch (error) {
    console.error('Failed to fetch medicine catalog suggestions:', error);
  }
};;

  const selectSuggestion = (type: 'MEDICINE' | 'OINTMENT', index: number, item: any) => {
    if (type === 'MEDICINE') {
      const updated = [...medicines];
      updated[index] = {
        ...updated[index],
        name: item.name,
        dosage: item.dosage || updated[index].dosage,
        frequency: item.frequency || updated[index].frequency,
        timing: item.timing || updated[index].timing,
        suggestions: [],
        isSuggestionsOpen: false
      };
      setMedicines(updated);
    } else {
      const updated = [...ointments];
      updated[index] = {
        ...updated[index],
        name: item.name,
        dosage: item.dosage || updated[index].dosage,
        frequency: item.frequency || updated[index].frequency,
        timing: item.timing || updated[index].timing,
        suggestions: [],
        isSuggestionsOpen: false
      };
      setOintments(updated);
    }
  };

  // Reminder times management
  const addReminderTime = (type: 'MEDICINE' | 'OINTMENT', index: number) => {
    const list = type === 'MEDICINE' ? medicines : ointments;
    const med = list[index];
    if (!med.newTime) return;
    
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(med.newTime)) {
      toast.error('Please enter a valid time (e.g. 08:30, 21:00)');
      return;
    }

    if (med.reminderTimes.includes(med.newTime)) {
      toast.error('Time already added');
      return;
    }

    const updated = [...list];
    updated[index].reminderTimes = [...med.reminderTimes, med.newTime].sort();
    updated[index].newTime = '';
    
    if (type === 'MEDICINE') {
      setMedicines(updated);
    } else {
      setOintments(updated);
    }
  };

  const removeReminderTime = (type: 'MEDICINE' | 'OINTMENT', medIndex: number, timeIndex: number) => {
    const list = type === 'MEDICINE' ? medicines : ointments;
    const updated = [...list];
    updated[medIndex].reminderTimes = updated[medIndex].reminderTimes.filter((_: any, i: number) => i !== timeIndex);
    
    if (type === 'MEDICINE') {
      setMedicines(updated);
    } else {
      setOintments(updated);
    }
  };

  const getAutoScheduledTimes = (frequency: string) => {
    const map: Record<string, string[]> = {
      'Once daily': ['09:00'],
      'Twice daily': ['09:00', '21:00'],
      'Thrice daily': ['08:00', '14:00', '20:00'],
      'Four times daily': ['08:00', '12:00', '16:00', '20:00'],
      'Before bed': ['21:00'],
      'Morning': ['09:00'],
    };
    return map[frequency] || ['09:00'];
  };

  // Submit Prescription
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

    const validMeds = medicines.filter(m => m.name.trim());
    const validOints = ointments.filter(o => o.name.trim());

    if (validMeds.length === 0 && validOints.length === 0) {
      toast.error('Please prescribe at least one medicine or ointment.');
      return;
    }

    // Validate medicines fields
    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      if (med.name.trim()) {
        if (!med.dosage.trim()) {
          toast.error(`Please enter dosage for Medicine #${i + 1}`);
          return;
        }
        if (!med.duration.trim()) {
          toast.error(`Please enter duration for Medicine #${i + 1}`);
          return;
        }
      }
    }

    // Validate ointments fields
    for (let i = 0; i < ointments.length; i++) {
      const oint = ointments[i];
      if (oint.name.trim()) {
        if (!oint.dosage.trim()) {
          toast.error(`Please enter dosage for Ointment #${i + 1}`);
          return;
        }
        if (!oint.duration.trim()) {
          toast.error(`Please enter duration for Ointment #${i + 1}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Generating digital prescription...');

    try {
      const mergedItems = [
        ...validMeds.map((m) => ({
          name: m.name,
          type: 'MEDICINE',
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          timing: m.timing,
          instructions: m.instructions || undefined,
          reminderTimes: m.reminderTimes.length > 0 ? m.reminderTimes : undefined,
        })),
        ...validOints.map((o) => ({
          name: o.name,
          type: 'OINTMENT',
          dosage: o.dosage,
          frequency: o.frequency,
          duration: o.duration,
          timing: o.timing,
          instructions: o.instructions || undefined,
          reminderTimes: o.reminderTimes.length > 0 ? o.reminderTimes : undefined,
        })),
      ];

      const payload = {
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        appointmentId: appointmentIdParam || undefined,
        diagnosis: diagnosis || undefined,
        notes: notes || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        medicines: mergedItems,
      };

      await prescriptionsApi.create(payload);
      toast.success('Prescription created successfully!', { id: loadingToast });
      router.push('/dashboard/prescriptions');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to create prescription';
      toast.error(errMsg, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Patient Register Submission
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFirstName || !regLastName || !regEmail) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsRegSubmitting(true);
    const regToast = toast.loading('Registering patient profile...');

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

  const todayStr = new Date().toISOString().split('T')[0];

  const totalItemsCount = medicines.filter(m => m.name.trim()).length + ointments.filter(o => o.name.trim()).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Back Link */}
      <Link
        href="/dashboard/prescriptions"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 text-sm font-medium mb-5 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Prescriptions
      </Link>

      <div className="page-header sm:mb-8">
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 animate-pulse shrink-0" />
          Write New Prescription
        </h1>
        <p className="page-subtitle">Prescribe oral medications and topical ointments separately with catalog autocomplete assistance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: PATIENT INFORMATION */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0">1</span>
                <h3 className="font-semibold text-slate-800">Patient Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegModalOpen(true)}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 bg-cyan-50/50 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Register New Patient
              </button>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Select Patient
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
                  placeholder="Search patient by name, email, or code..."
                  className="input pl-10"
                />
                {selectedPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch('');
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-650 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
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
              {isPatientDropdownOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsPatientDropdownOpen(false)} />
              )}
            </div>

            {selectedPatient && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mt-2">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Code</span>
                  <span className="font-medium text-slate-800 text-sm">{selectedPatient.patientCode}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Gender</span>
                  <span className="font-medium text-slate-800 text-sm">{selectedPatient.gender || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Blood Group</span>
                  <span className="font-medium text-slate-800 text-sm">{selectedPatient.bloodGroup?.replace('_POS', '+').replace('_NEG', '-') || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Birth Date</span>
                  <span className="font-medium text-slate-800 text-sm">{selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-IN') : 'Not specified'}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: DOCTOR SELECTION */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">2</span>
              <h3 className="font-semibold text-slate-800">Prescribing Doctor</h3>
            </div>

            {user?.role === 'DOCTOR' ? (
              selectedDoctor ? (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 text-sm font-bold flex items-center justify-center shrink-0">
                    DR
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Dr. {user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-slate-500">{selectedDoctor?.specialization} · {selectedDoctor?.department?.name || 'General'}</p>
                  </div>
                  <span className="badge bg-cyan-100 text-cyan-800 text-xs ml-auto">Prescribing Self</span>
                </div>
              ) : isLoadingDoctors ? (
                <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading your doctor profile...
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800">
                    Your doctor profile hasn&apos;t been configured yet, so you can&apos;t write
                    prescriptions. Ask your hospital admin to set it up under Doctors.
                  </p>
                </div>
              )
            ) : (
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Doctor
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
                    placeholder="Search doctor by name, department..."
                    className="input pl-10"
                  />
                  {selectedDoctor && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoctor(null);
                        setDoctorSearch('');
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-650 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
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
                      <div className="p-4 text-center text-sm text-slate-400">No doctors match search.</div>
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
                              <p className="text-xs text-slate-400">{doc.specialization} · {doc.department?.name || 'General'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {isDoctorDropdownOpen && (
                  <div className="fixed inset-0 z-0" onClick={() => setIsDoctorDropdownOpen(false)} />
                )}
              </div>
            )}
          </div>

          {/* STEP 3: DIAGNOSIS & DATE */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">3</span>
              <h3 className="font-semibold text-slate-800">Diagnosis & Validity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Diagnosis / Assessment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Hypertension, Acute Gastritis..."
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Prescription Valid Until (Optional)
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* STEP 4A: ORAL MEDICINES SECTION */}
          <div className="card space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0">4A</span>
                <h3 className="font-semibold text-slate-800">Prescribed Oral Medicines</h3>
              </div>
              <button
                type="button"
                onClick={addMedicine}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 bg-cyan-50/50 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Oral Medicine
              </button>
            </div>

            <div className="space-y-6 divide-y divide-slate-100">
              {medicines.map((med, index) => (
                <div key={index} className={`pt-4 first:pt-0 space-y-4 relative ${index > 0 ? 'mt-4' : ''}`}>
                  
                  {/* Medicine Subheader & Delete Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-cyan-500 animate-pulse" /> Oral Medicine #{index + 1}
                    </span>
                    {(medicines.length > 1 || ointments.filter(o => o.name.trim()).length > 0) && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="text-red-500 hover:text-red-605 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Medicine Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={(e) => {
                          updateMedicine(index, 'name', e.target.value);
                          fetchSuggestions(e.target.value, 'MEDICINE', index);
                        }}
                        placeholder="Search or type name..."
                        className="input text-sm"
                      />
                      {/* Suggestions Dropdown */}
                      {med.isSuggestionsOpen && med.suggestions?.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto divide-y divide-slate-50">
                          {med.suggestions.map((item: any) => (
                            <div
                              key={item.id}
                              onClick={() => selectSuggestion('MEDICINE', index, item)}
                              className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center"
                            >
                              <span>{item.name}</span>
                              {item.dosage && <span className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">{item.dosage}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {med.isSuggestionsOpen && (
                        <div className="fixed inset-0 z-10" onClick={() => updateMedicine(index, 'isSuggestionsOpen', false)} />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Dosage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={med.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        placeholder="e.g. 500 mg, 1 tablet"
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={med.frequency}
                          onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                          className="input text-sm appearance-none pr-10"
                        >
                          <option value="Once daily">Once daily (OD)</option>
                          <option value="Twice daily">Twice daily (BD)</option>
                          <option value="Thrice daily">Thrice daily (TDS)</option>
                          <option value="Four times daily">Four times daily (QDS)</option>
                          <option value="Before bed">Before bed</option>
                          <option value="Morning">Morning</option>
                          <option value="As needed (PRN)">As needed (PRN)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={med.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        placeholder="e.g. 5 days, 1 week"
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Timing
                      </label>
                      <div className="relative">
                        <select
                          value={med.timing}
                          onChange={(e) => updateMedicine(index, 'timing', e.target.value)}
                          className="input text-sm appearance-none pr-10"
                        >
                          <option value="AFTER_FOOD">After Food (PC)</option>
                          <option value="BEFORE_FOOD">Before Food (AC)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Specific Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                        placeholder="e.g. Take with warm water"
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {/* Reminders list */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Medicine Reminders
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {med.reminderTimes.length === 0 ? (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 py-1">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          <span>Using Auto-Scheduled Times: </span>
                          <span className="font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100/50">
                            {getAutoScheduledTimes(med.frequency).join(', ')}
                          </span>
                        </div>
                      ) : (
                        med.reminderTimes.map((time: string, timeIdx: number) => (
                          <div key={timeIdx} className="flex items-center gap-1 bg-cyan-50 border border-cyan-100 rounded-lg px-2.5 py-1 text-xs font-semibold text-cyan-700">
                            <Clock className="w-3 h-3 text-cyan-500" />
                            {time}
                            <button
                              type="button"
                              onClick={() => removeReminderTime('MEDICINE', index, timeIdx)}
                              className="text-cyan-400 hover:text-cyan-650 ml-1 hover:bg-cyan-100 rounded p-0.5 cursor-pointer border-none bg-transparent"
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 max-w-[280px]">
                      <input
                        type="text"
                        placeholder="Custom 24h Time (e.g. 08:30)"
                        value={med.newTime || ''}
                        onChange={(e) => updateMedicine(index, 'newTime', e.target.value)}
                        className="input text-xs py-1.5 px-3"
                      />
                      <button
                        type="button"
                        onClick={() => addReminderTime('MEDICINE', index)}
                        className="text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 border-none cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Set
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4B: TOPICAL OINTMENTS SECTION */}
          <div className="card space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0">4B</span>
                <h3 className="font-semibold text-slate-800">Prescribed Topical Ointments</h3>
              </div>
              <button
                type="button"
                onClick={addOintment}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 bg-cyan-50/50 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Topical Ointment
              </button>
            </div>

            <div className="space-y-6 divide-y divide-slate-100">
              {ointments.map((oint, index) => (
                <div key={index} className={`pt-4 first:pt-0 space-y-4 relative ${index > 0 ? 'mt-4' : ''}`}>
                  
                  {/* Ointment Subheader & Delete Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-500 animate-pulse" /> Topical Ointment #{index + 1}
                    </span>
                    {(ointments.length > 1 || medicines.filter(m => m.name.trim()).length > 0) && (
                      <button
                        type="button"
                        onClick={() => removeOintment(index)}
                        className="text-red-500 hover:text-red-605 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Ointment Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={oint.name}
                        onChange={(e) => {
                          updateOintment(index, 'name', e.target.value);
                          fetchSuggestions(e.target.value, 'OINTMENT', index);
                        }}
                        placeholder="Search or type name..."
                        className="input text-sm"
                      />

                      {/* Suggestions Dropdown */}
                      {oint.isSuggestionsOpen && oint.suggestions?.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto divide-y divide-slate-50">
                          {oint.suggestions.map((item: any) => (
                            <div
                              key={item.id}
                              onClick={() => selectSuggestion('OINTMENT', index, item)}
                              className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center"
                            >
                              <span>{item.name}</span>
                              {item.dosage && <span className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">{item.dosage}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {oint.isSuggestionsOpen && (
                        <div className="fixed inset-0 z-10" onClick={() => updateOintment(index, 'isSuggestionsOpen', false)} />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Application Dosage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={oint.dosage}
                        onChange={(e) => updateOintment(index, 'dosage', e.target.value)}
                        placeholder="e.g. Apply thin layer, 2 drops"
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={oint.frequency}
                          onChange={(e) => updateOintment(index, 'frequency', e.target.value)}
                          className="input text-sm appearance-none pr-10"
                        >
                          <option value="As needed (PRN)">As needed (PRN)</option>
                          <option value="Once daily">Once daily (OD)</option>
                          <option value="Twice daily">Twice daily (BD)</option>
                          <option value="Thrice daily">Thrice daily (TDS)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={oint.duration}
                        onChange={(e) => updateOintment(index, 'duration', e.target.value)}
                        placeholder="e.g. 5 days, until healed"
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Timing
                      </label>
                      <div className="relative">
                        <select
                          value={oint.timing}
                          onChange={(e) => updateOintment(index, 'timing', e.target.value)}
                          className="input text-sm appearance-none pr-10"
                        >
                          <option value="AFTER_FOOD">After Food (PC)</option>
                          <option value="BEFORE_FOOD">Before Food (AC)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Specific Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={oint.instructions}
                        onChange={(e) => updateOintment(index, 'instructions', e.target.value)}
                        placeholder="e.g. Apply to clean skin"
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {/* Reminders list */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Application Reminders
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {oint.reminderTimes.length === 0 ? (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 py-1">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          <span>Using Auto-Scheduled Times: </span>
                          <span className="font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100/50">
                            {getAutoScheduledTimes(oint.frequency).join(', ')}
                          </span>
                        </div>
                      ) : (
                        oint.reminderTimes.map((time: string, timeIdx: number) => (
                          <div key={timeIdx} className="flex items-center gap-1 bg-cyan-50 border border-cyan-100 rounded-lg px-2.5 py-1 text-xs font-semibold text-cyan-700">
                            <Clock className="w-3 h-3 text-cyan-500" />
                            {time}
                            <button
                              type="button"
                              onClick={() => removeReminderTime('OINTMENT', index, timeIdx)}
                              className="text-cyan-400 hover:text-cyan-655 ml-1 hover:bg-cyan-100 rounded p-0.5 cursor-pointer border-none bg-transparent"
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 max-w-[280px]">
                      <input
                        type="text"
                        placeholder="Custom 24h Time (e.g. 08:30)"
                        value={oint.newTime || ''}
                        onChange={(e) => updateOintment(index, 'newTime', e.target.value)}
                        className="input text-xs py-1.5 px-3"
                      />
                      <button
                        type="button"
                        onClick={() => addReminderTime('OINTMENT', index)}
                        className="text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 border-none cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Set
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 5: ADDITIONAL NOTES */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">5</span>
              <h3 className="font-semibold text-slate-800">Doctor Notes & Remarks</h3>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                General Notes / Patient Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include extra remarks, dietary advice, warning symptoms, or follow-up schedules..."
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
              Prescription Summary
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
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prescribing Doctor</span>

                {selectedDoctor ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold flex items-center justify-center shrink-0">
                      Dr
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        Dr. {selectedDoctor.user?.firstName || user?.firstName} {selectedDoctor.user?.lastName || user?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{selectedDoctor.specialization}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No doctor resolved</p>
                )}
              </div>

              {/* Diagnosis */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</span>
                {diagnosis ? (
                  <p className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">{diagnosis}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No diagnosis provided yet</p>
                )}
              </div>

              {/* Medicines Summary */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prescription Items</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-cyan-900 text-sm">{totalItemsCount} Prescribed Item(s)</p>
                    <p className="text-xs text-cyan-700 font-medium">
                      {medicines.filter(m => m.name.trim()).length} Meds · {ointments.filter(o => o.name.trim()).length} Ointments
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedPatient || !selectedDoctor || !diagnosis.trim()}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-cyan-100 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Prescribing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Generate Prescription
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

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegSubmitting}
                  className="btn-primary"
                >
                  {isRegSubmitting ? 'Registering...' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewPrescriptionPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    }>
      <NewPrescriptionContent />
    </Suspense>
  );
}
