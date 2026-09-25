'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { patientsApi } from '@/lib/api';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Heart, Plus, X,
  MapPin, ShieldAlert, FileText, Loader2, Sparkles, ChevronDown,
  Activity, ClipboardList, Clock, Bell, HeartPulse, Stethoscope,
  Users, Pencil
} from 'lucide-react';
import { formatDate, getInitials, isValidPhone, isValidPersonName, stripDigits } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'timeline' | 'records' | 'family'>('timeline');

  // Add Family Member Modal State
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [fmName, setFmName] = useState('');
  const [fmRelation, setFmRelation] = useState('');
  const [fmDob, setFmDob] = useState('');
  const [fmGender, setFmGender] = useState('MALE');
  const [fmBloodGroup, setFmBloodGroup] = useState('O_POS');
  const [fmPhone, setFmPhone] = useState('');
  const [fmAllergies, setFmAllergies] = useState('');
  const [isFmSubmitting, setIsFmSubmitting] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  // Edit Patient Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('MALE');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [editEmergencyRelation, setEditEmergencyRelation] = useState('');
  const [editAllergyInput, setEditAllergyInput] = useState('');
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [editChronicInput, setEditChronicInput] = useState('');
  const [editChronicConditions, setEditChronicConditions] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // "Show recent, view more" expand state for long lists (better mobile UX)
  const TIMELINE_PREVIEW_COUNT = 5;
  const PRESCRIPTIONS_PREVIEW_COUNT = 3;
  const APPOINTMENTS_PREVIEW_COUNT = 5;
  const REPORTS_PREVIEW_COUNT = 4;
  const FAMILY_PREVIEW_COUNT = 4;
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [showAllFamily, setShowAllFamily] = useState(false);

  // Queries
  const { data: patient, isLoading, error, refetch } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.getOne(id).then((r) => r.data),
  });

  const { data: timeline, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['patientTimeline', id],
    queryFn: () => patientsApi.getTimeline(id).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        <span className="text-slate-500 font-medium">Loading patient file...</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-2">Failed to load patient record</h2>
        <p className="text-slate-500 mb-6">The patient may not exist or you do not have permission to view it.</p>
        <Link href="/dashboard/patients" className="btn-primary">
          Back to Patient Registry
        </Link>
      </div>
    );
  }

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fmName || !fmRelation) {
      toast.error('Name and relation are required');
      return;
    }
    if (fmPhone && !isValidPhone(fmPhone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }

    setIsFmSubmitting(true);
    const fmToast = toast.loading('Adding family member...');

    try {
      const payload = {
        name: fmName,
        relation: fmRelation,
        dateOfBirth: fmDob || undefined,
        gender: fmGender,
        bloodGroup: fmBloodGroup || undefined,
        phone: fmPhone || undefined,
        allergies: fmAllergies ? fmAllergies.split(',').map((s) => s.trim()) : undefined,
      };

      await patientsApi.addFamilyMember(id, payload);
      toast.success('Family member added successfully!', { id: fmToast });
      
      // Reset state
      setFmName('');
      setFmRelation('');
      setFmDob('');
      setFmPhone('');
      setFmAllergies('');
      setIsFamilyModalOpen(false);
      
      refetch();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to add family member';
      toast.error(errMsg, { id: fmToast });
    } finally {
      setIsFmSubmitting(false);
    }
  };

  const openEditModal = () => {
    setEditPhone(patient.user?.phone || '');
    setEditDob(patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '');
    setEditGender(patient.gender || 'MALE');
    setEditBloodGroup(patient.bloodGroup || '');
    setEditAddress(patient.address || '');
    setEditCity(patient.city || '');
    setEditEmergencyName(patient.emergencyName || '');
    setEditEmergencyPhone(patient.emergencyPhone || '');
    setEditEmergencyRelation(patient.emergencyRelation || '');
    setEditAllergies(patient.allergies || []);
    setEditChronicConditions(patient.chronicConditions || []);
    setEditNotes(patient.notes || '');
    setEditAllergyInput('');
    setEditChronicInput('');
    setIsEditModalOpen(true);
  };

  const handleEditAddAllergy = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editAllergyInput.trim() && !editAllergies.includes(editAllergyInput.trim())) {
        setEditAllergies([...editAllergies, editAllergyInput.trim()]);
      }
      setEditAllergyInput('');
    }
  };

  const handleEditAddChronic = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editChronicInput.trim() && !editChronicConditions.includes(editChronicInput.trim())) {
        setEditChronicConditions([...editChronicConditions, editChronicInput.trim()]);
      }
      setEditChronicInput('');
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPhone && !isValidPhone(editPhone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    if (editEmergencyPhone && !isValidPhone(editEmergencyPhone)) {
      toast.error('Enter a valid 10-digit emergency contact phone number');
      return;
    }
    if (editEmergencyName && !isValidPersonName(editEmergencyName)) {
      toast.error('Enter a valid emergency contact name');
      return;
    }
    if (editEmergencyRelation && !isValidPersonName(editEmergencyRelation)) {
      toast.error('Enter a valid emergency contact relation');
      return;
    }

    setIsEditSubmitting(true);
    const editToast = toast.loading('Updating patient details...');

    try {
      const payload = {
        phone: editPhone || undefined,
        dateOfBirth: editDob || undefined,
        gender: editGender,
        bloodGroup: editBloodGroup || undefined,
        address: editAddress || undefined,
        city: editCity || undefined,
        emergencyName: editEmergencyName || undefined,
        emergencyPhone: editEmergencyPhone || undefined,
        emergencyRelation: editEmergencyRelation || undefined,
        allergies: editAllergies,
        chronicConditions: editChronicConditions,
        notes: editNotes || undefined,
      };

      await patientsApi.update(id, payload);
      toast.success('Patient details updated successfully!', { id: editToast });
      setIsEditModalOpen(false);
      refetch();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to update patient details';
      toast.error(errMsg, { id: editToast });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'PRESCRIPTION':
        return <ClipboardList className="w-4 h-4 text-cyan-600" />;
      case 'MEDICINE_STARTED':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'REPORT_UPLOADED':
        return <FileText className="w-4 h-4 text-sky-600" />;
      case 'FOLLOW_UP':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'REMINDER_SENT':
        return <Clock className="w-4 h-4 text-pink-600" />;
      case 'NOTE_ADDED':
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getEventColorClass = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return 'bg-emerald-50 border-emerald-100';
      case 'PRESCRIPTION':
        return 'bg-cyan-50 border-cyan-100';
      case 'MEDICINE_STARTED':
        return 'bg-rose-50 border-rose-100';
      case 'REPORT_UPLOADED':
        return 'bg-sky-50 border-sky-100';
      case 'FOLLOW_UP':
        return 'bg-amber-50 border-amber-100';
      case 'REMINDER_SENT':
        return 'bg-pink-50 border-pink-100';
      case 'NOTE_ADDED':
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  // Helper to compute age from Date string
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'N/A';
    const birth = new Date(dobString);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <Link href="/dashboard/patients" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Registry
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-700 text-xl font-bold border border-cyan-200 shadow-sm shrink-0">
              {getInitials(patient.user.firstName, patient.user.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{patient.user.firstName} {patient.user.lastName}</h1>
                <span className="badge bg-slate-100 text-slate-600 font-semibold">{patient.patientCode}</span>
              </div>
              <p className="text-sm text-slate-500">{patient.user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEditModal}
            className="btn-secondary flex items-center gap-1.5 text-sm font-semibold px-4 py-2 self-start"
          >
            <Pencil className="w-4 h-4" /> Edit Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Summary Card */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Personal Summary
            </h3>
            
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-400">Gender</span>
                <span className="font-medium text-slate-800">{patient.gender || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Date of Birth</span>
                <span className="font-medium text-slate-800">{patient.dateOfBirth ? formatDate(patient.dateOfBirth).split(',')[0] : 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Age</span>
                <span className="font-medium text-slate-800">{calculateAge(patient.dateOfBirth)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Blood Group</span>
                <span className="badge bg-red-50 text-red-600 font-bold">{patient.bloodGroup || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Phone</span>
                <span className="font-medium text-slate-800">{patient.user.phone || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Location</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />{patient.city || 'N/A'}
                </span>
              </li>
            </ul>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Clinical Background
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Allergies</span>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies?.map((allergy: string, i: number) => (
                    <span key={i} className="badge bg-red-50 text-red-600 font-medium text-xs px-2 py-0.5">{allergy}</span>
                  ))}
                  {(!patient.allergies || patient.allergies.length === 0) && (
                    <span className="text-slate-400 text-xs">No known allergies</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Chronic Conditions</span>
                <div className="flex flex-wrap gap-1.5">
                  {patient.chronicConditions?.map((cond: string, i: number) => (
                    <span key={i} className="badge bg-amber-50 text-amber-600 font-medium text-xs px-2 py-0.5">{cond}</span>
                  ))}
                  {(!patient.chronicConditions || patient.chronicConditions.length === 0) && (
                    <span className="text-slate-400 text-xs">No active chronic conditions</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</span>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                  {patient.notes || 'No general clinical notes provided.'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Emergency Contact
            </h3>
            
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-400">Contact Person</span>
                <span className="font-semibold text-slate-800">{patient.emergencyName || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Relationship</span>
                <span className="font-medium text-slate-700">{patient.emergencyRelation || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Emergency Phone</span>
                <span className="font-semibold text-slate-800">{patient.emergencyPhone || 'N/A'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Tabbed Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs header */}
          <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-xs border border-slate-100">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 min-w-[100px] py-2.5 px-2 text-center text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all ${
                activeTab === 'timeline'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" /> <span className="truncate">Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex-1 min-w-[100px] py-2.5 px-2 text-center text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all ${
                activeTab === 'records'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" /> <span className="truncate">Records & Care</span>
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`flex-1 min-w-[100px] py-2.5 px-2 text-center text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all ${
                activeTab === 'family'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" /> <span className="truncate">Family Members</span>
            </button>
          </div>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Clinical History Timeline</h3>
                <span className="badge bg-cyan-50 text-cyan-700">{timeline?.data?.length || 0} events</span>
              </div>

              {isTimelineLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                </div>
              ) : !timeline?.data || timeline.data.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400">No events registered in this patient's history</p>
                </div>
              ) : (
                <>
                  <div className="relative pl-6 border-l border-slate-200 space-y-6 ml-3">
                    {(showAllTimeline ? timeline.data : timeline.data.slice(0, TIMELINE_PREVIEW_COUNT)).map((event: any) => (
                      <div key={event.id} className="relative">
                        {/* Timeline dot */}
                        <span className={`absolute -left-10 top-0.5 w-7 h-7 rounded-lg flex items-center justify-center border shadow-xs ${getEventColorClass(event.eventType)}`}>
                          {getEventIcon(event.eventType)}
                        </span>

                        <div>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                            <h4 className="font-semibold text-slate-800 text-sm md:text-base">{event.title}</h4>
                            <span className="text-xs text-slate-400 font-medium">{formatDate(event.occurredAt)}</span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-slate-600">{event.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {timeline.data.length > TIMELINE_PREVIEW_COUNT && (
                    <button
                      type="button"
                      onClick={() => setShowAllTimeline((v) => !v)}
                      className="w-full text-center text-xs font-semibold text-cyan-700 hover:text-cyan-800 py-2 rounded-lg hover:bg-cyan-50 transition-colors"
                    >
                      {showAllTimeline ? 'Show less' : `View more (${timeline.data.length - TIMELINE_PREVIEW_COUNT} more)`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Records & Care Tab */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              {/* Prescriptions */}
              <div className="card">
                <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-500" /> Recent Prescriptions
                </h3>

                {patient.prescriptions?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No prescriptions found</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {(showAllPrescriptions ? patient.prescriptions : patient.prescriptions?.slice(0, PRESCRIPTIONS_PREVIEW_COUNT))?.map((p: any) => (
                        <div key={p.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-800">Prescription</h4>
                              <p className="text-xs text-slate-400">{formatDate(p.createdAt)}</p>
                            </div>
                            <span className="badge bg-cyan-50 text-cyan-700 text-xs font-semibold">
                              {p.medicines?.length} Medicines
                            </span>
                          </div>
                          <ul className="text-sm space-y-1.5 text-slate-600 mt-3 list-disc pl-5">
                            {p.medicines?.map((m: any, i: number) => (
                              <li key={i}>
                                <span className="font-semibold">{m.name}</span> — {m.dosage} ({m.duration})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {patient.prescriptions?.length > PRESCRIPTIONS_PREVIEW_COUNT && (
                      <button
                        type="button"
                        onClick={() => setShowAllPrescriptions((v) => !v)}
                        className="w-full text-center text-xs font-semibold text-cyan-700 hover:text-cyan-800 py-2 mt-2 rounded-lg hover:bg-cyan-50 transition-colors"
                      >
                        {showAllPrescriptions ? 'Show less' : `View more (${patient.prescriptions.length - PRESCRIPTIONS_PREVIEW_COUNT} more)`}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Appointments */}
              <div className="card">
                <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" /> Recent Appointments
                </h3>

                {patient.appointments?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No appointments scheduled</p>
                ) : (
                  <>
                    <div className="table-container">
                      <table className="text-left w-100">
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            <th>Type</th>
                            <th>Scheduled</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllAppointments ? patient.appointments : patient.appointments?.slice(0, APPOINTMENTS_PREVIEW_COUNT))?.map((app: any) => (
                            <tr key={app.id}>
                              <td className="font-semibold text-slate-800">
                                Dr. {app.doctor.user.firstName} {app.doctor.user.lastName}
                              </td>
                              <td><span className="badge bg-slate-100 text-slate-600">{app.type}</span></td>
                              <td className="text-xs text-slate-500">{formatDate(app.scheduledAt)}</td>
                              <td>
                                <span className={`badge ${
                                  app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                                  app.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {patient.appointments?.length > APPOINTMENTS_PREVIEW_COUNT && (
                      <button
                        type="button"
                        onClick={() => setShowAllAppointments((v) => !v)}
                        className="w-full text-center text-xs font-semibold text-cyan-700 hover:text-cyan-800 py-2 mt-2 rounded-lg hover:bg-cyan-50 transition-colors"
                      >
                        {showAllAppointments ? 'Show less' : `View more (${patient.appointments.length - APPOINTMENTS_PREVIEW_COUNT} more)`}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Reports */}
              <div className="card">
                <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" /> Lab & Medical Reports
                </h3>

                {patient.reports?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No documents or reports uploaded</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(showAllReports ? patient.reports : patient.reports?.slice(0, REPORTS_PREVIEW_COUNT))?.map((rep: any) => (
                        <div key={rep.id} className="p-4 rounded-xl border border-slate-100 flex items-center gap-3 bg-slate-50">
                          <FileText className="w-8 h-8 text-sky-500 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-slate-800 truncate text-sm">{rep.name}</h4>
                            <p className="text-xs text-slate-400">{formatDate(rep.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {patient.reports?.length > REPORTS_PREVIEW_COUNT && (
                      <button
                        type="button"
                        onClick={() => setShowAllReports((v) => !v)}
                        className="w-full text-center text-xs font-semibold text-cyan-700 hover:text-cyan-800 py-2 mt-2 rounded-lg hover:bg-cyan-50 transition-colors"
                      >
                        {showAllReports ? 'Show less' : `View more (${patient.reports.length - REPORTS_PREVIEW_COUNT} more)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Family Members Tab */}
          {activeTab === 'family' && (
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Linked Family Members</h3>
                <button
                  type="button"
                  onClick={() => setIsFamilyModalOpen(true)}
                  className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Link Member
                </button>
              </div>

              {patient.familyMembers?.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400">No linked family members found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(showAllFamily ? patient.familyMembers : patient.familyMembers?.slice(0, FAMILY_PREVIEW_COUNT))?.map((fm: any) => (
                      <div key={fm.id} className="p-4 rounded-xl border border-slate-100 shadow-xs space-y-3 relative bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm">
                            {getInitials(fm.name, '')}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm">{fm.name}</h4>
                            <span className="badge bg-cyan-50 text-cyan-700 font-medium text-[10px] uppercase">{fm.relation}</span>
                          </div>
                        </div>
                        <ul className="text-xs space-y-1 text-slate-500 border-t border-slate-200/50 pt-2">
                          <li><span className="text-slate-400">Gender:</span> {fm.gender || 'N/A'}</li>
                          <li><span className="text-slate-400">Age:</span> {calculateAge(fm.dateOfBirth)}</li>
                          <li><span className="text-slate-400">Blood Group:</span> {fm.bloodGroup || 'N/A'}</li>
                          {fm.phone && <li><span className="text-slate-400">Phone:</span> {fm.phone}</li>}
                          {fm.allergies?.length > 0 && (
                            <li className="flex flex-wrap gap-1 mt-1.5">
                              <span className="text-slate-400 mr-1 self-center">Allergies:</span>
                              {fm.allergies.map((al: string, idx: number) => (
                                <span key={idx} className="badge bg-red-50 text-red-600 px-1 py-0">{al}</span>
                              ))}
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {patient.familyMembers?.length > FAMILY_PREVIEW_COUNT && (
                    <button
                      type="button"
                      onClick={() => setShowAllFamily((v) => !v)}
                      className="w-full text-center text-xs font-semibold text-cyan-700 hover:text-cyan-800 py-2 rounded-lg hover:bg-cyan-50 transition-colors"
                    >
                      {showAllFamily ? 'Show less' : `View more (${patient.familyMembers.length - FAMILY_PREVIEW_COUNT} more)`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Link Family Member Modal */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-cyan-50 border-b border-cyan-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" /> Link Family Member
              </h3>
              <button
                type="button"
                onClick={() => setIsFamilyModalOpen(false)}
                className="p-1 hover:bg-cyan-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Member Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fmName}
                  onChange={(e) => setFmName(e.target.value)}
                  placeholder="Full Name"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Relation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fmRelation}
                    onChange={(e) => setFmRelation(e.target.value)}
                    placeholder="e.g. Spouse, Son, Father"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={fmPhone}
                    onChange={(e) => setFmPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      value={fmGender}
                      onChange={(e) => setFmGender(e.target.value)}
                      className="input appearance-none pr-8"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <div className="relative">
                    <select
                      value={fmBloodGroup}
                      onChange={(e) => setFmBloodGroup(e.target.value)}
                      className="input appearance-none pr-8"
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
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    max={todayStr}
                    value={fmDob}
                    onChange={(e) => setFmDob(e.target.value)}
                    className="input px-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  value={fmAllergies}
                  onChange={(e) => setFmAllergies(e.target.value)}
                  placeholder="e.g. Peanuts, Penicillin"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFamilyModalOpen(false)}
                  className="btn-secondary text-sm font-semibold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFmSubmitting}
                  className="btn-primary text-sm font-semibold px-4 py-2 flex items-center gap-1"
                >
                  {isFmSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Link Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-cyan-50 border-b border-cyan-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-cyan-600" /> Edit Patient Details
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-cyan-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePatient} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    max={todayStr}
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="input px-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="input appearance-none pr-8"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <div className="relative">
                    <select
                      value={editBloodGroup}
                      onChange={(e) => setEditBloodGroup(e.target.value)}
                      className="input appearance-none pr-8"
                    >
                      <option value="">Unspecified</option>
                      <option value="O_POS">O+</option>
                      <option value="O_NEG">O-</option>
                      <option value="A_POS">A+</option>
                      <option value="A_NEG">A-</option>
                      <option value="B_POS">B+</option>
                      <option value="B_NEG">B-</option>
                      <option value="AB_POS">AB+</option>
                      <option value="AB_NEG">AB-</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Street details, building, apartment..."
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Mumbai"
                    className="input"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(stripDigits(e.target.value))}
                      placeholder="Full Name"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Relation
                    </label>
                    <input
                      type="text"
                      value={editEmergencyRelation}
                      onChange={(e) => setEditEmergencyRelation(stripDigits(e.target.value))}
                      placeholder="e.g. Spouse, Parent, Sibling"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editEmergencyPhone}
                      onChange={(e) => setEditEmergencyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={editAllergyInput}
                    onChange={(e) => setEditAllergyInput(e.target.value)}
                    onKeyDown={handleEditAddAllergy}
                    placeholder="Type and press Enter to add..."
                    className="input mb-2.5"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {editAllergies.map((allergy, index) => (
                      <span key={index} className="badge bg-red-50 text-red-600 flex items-center gap-1 py-1 px-2 text-xs">
                        {allergy}
                        <button type="button" onClick={() => setEditAllergies(editAllergies.filter((_, i) => i !== index))} className="hover:text-red-800">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {editAllergies.length === 0 && <span className="text-xs text-slate-400">No allergies specified</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    value={editChronicInput}
                    onChange={(e) => setEditChronicInput(e.target.value)}
                    onKeyDown={handleEditAddChronic}
                    placeholder="Type and press Enter to add..."
                    className="input mb-2.5"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {editChronicConditions.map((condition, index) => (
                      <span key={index} className="badge bg-amber-50 text-amber-600 flex items-center gap-1 py-1 px-2 text-xs">
                        {condition}
                        <button type="button" onClick={() => setEditChronicConditions(editChronicConditions.filter((_, i) => i !== index))} className="hover:text-amber-800">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {editChronicConditions.length === 0 && <span className="text-xs text-slate-400">No chronic conditions specified</span>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Clinical Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add patient history, special care guidelines, or family traits..."
                  className="input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary text-sm font-semibold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="btn-primary text-sm font-semibold px-4 py-2 flex items-center gap-1"
                >
                  {isEditSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
