'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { appointmentsApi, billingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft, Calendar, Clock, User, Phone, Mail, FileText, Plus, Check,
  X, AlertCircle, Loader2, Sparkles, HeartPulse, Activity, CreditCard,
  ChevronRight, CalendarPlus, FileCheck, Ban, CheckSquare, RefreshCw,
  Heart, ShieldAlert, Award, FileSpreadsheet, Stethoscope
} from 'lucide-react';
import { cn, formatDateTime, getStatusColor, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AppointmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Role Checks
  const isDoctor = user?.role === 'DOCTOR';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isAdmin = user?.role === 'HOSPITAL_ADMIN';
  const isPatient = user?.role === 'PATIENT';
  const isStaff = isDoctor || isReceptionist || isAdmin;

  // Local component states
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isNotesChanged, setIsNotesChanged] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Invoice form states
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState(500);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [invoiceTax, setInvoiceTax] = useState(90); // 18% of 500
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Auto-calculate tax on amount/discount change
  useEffect(() => {
    const net = Math.max(0, invoiceAmount - invoiceDiscount);
    setInvoiceTax(Math.round(net * 0.18 * 100) / 100);
  }, [invoiceAmount, invoiceDiscount]);

  // Queries
  const { data: appt, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.getOne(id).then((r) => r.data),
  });

  // Sync initial clinical notes
  useEffect(() => {
    if (appt?.notes) {
      setClinicalNotes(appt.notes);
    }
  }, [appt]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status: string; cancelReason?: string; followUpDate?: string; followUpNotes?: string }) =>
      appointmentsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Appointment status updated successfully');
      refetch();
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: (notes: string) => appointmentsApi.update(id, { notes }),
    onSuccess: () => {
      toast.success('Clinical notes saved successfully');
      setIsNotesChanged(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save clinical notes');
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: any) => billingApi.createInvoice(payload),
    onSuccess: () => {
      toast.success('Invoice generated successfully');
      setShowInvoiceForm(false);
      refetch();
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    },
  });

  const payInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => billingApi.markPaid(invoiceId),
    onSuccess: () => {
      toast.success('Invoice marked as paid');
      refetch();
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-slate-500 font-medium animate-pulse">Loading appointment details...</span>
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="p-8 text-center max-w-md mx-auto min-h-[50vh] flex flex-col justify-center items-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Appointment Not Found</h2>
        <p className="text-slate-500 mb-6">This appointment may have been deleted, or you don't have access permissions.</p>
        <Link href="/dashboard/appointments" className="btn-primary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </Link>
      </div>
    );
  }

  // Pre-populate amount if doctor has consultationFee
  const handleOpenInvoiceForm = () => {
    const fee = Number(appt.doctor?.consultationFee || 500);
    setInvoiceAmount(fee);
    setInvoiceDiscount(0);
    setInvoiceTax(Math.round(fee * 0.18 * 100) / 100);
    setShowInvoiceForm(true);
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoiceMutation.mutate({
      patientId: appt.patientId,
      appointmentId: appt.id,
      amount: Number(invoiceAmount),
      discount: Number(invoiceDiscount),
      tax: Number(invoiceTax),
      notes: invoiceNotes || undefined,
    });
  };

  const handleStatusChange = (status: string) => {
    if (status === 'CANCELLED') {
      setShowCancelDialog(true);
      return;
    }
    updateStatusMutation.mutate({ status });
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Please enter a reason for cancellation');
      return;
    }
    updateStatusMutation.mutate({
      status: 'CANCELLED',
      cancelReason: cancelReason.trim(),
    });
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) {
      toast.error('Please select a follow-up date');
      return;
    }
    updateStatusMutation.mutate({
      status: appt.status, // keep current status or update, here we just attach follow-up info
      followUpDate: new Date(followUpDate).toISOString(),
      followUpNotes: followUpNotes.trim() || undefined,
    });
    setShowFollowUpForm(false);
    setFollowUpDate('');
    setFollowUpNotes('');
  };

  const getPatientAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/appointments" className="p-2 bg-white rounded-xl border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Link href="/dashboard" className="hover:text-indigo-600">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/dashboard/appointments" className="hover:text-indigo-600">Appointments</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-500">Details</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Appointment Details</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn('badge text-sm px-3.5 py-1.5 font-semibold rounded-full shadow-sm', getStatusColor(appt.status))}>
            {appt.status}
          </span>
          <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            {appt.type}
          </span>
        </div>
      </div>

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Detail Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Appointment Schedule Box */}
          <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scheduled Date & Time</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{formatDateTime(appt.scheduledAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 shrink-0">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">30 Min Consultation</span>
            </div>
          </div>

          {/* Patient Details Section */}
          <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">Patient Registry Info</h3>
              </div>
              {isStaff && (
                <Link href={`/dashboard/patients/${appt.patient?.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View Full File <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xl shadow-inner">
                {appt.patient?.user ? `${appt.patient.user.firstName[0]}${appt.patient.user.lastName[0]}`.toUpperCase() : 'P'}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">
                  {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                </h4>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Patient ID: <span className="font-mono">{appt.patient?.id}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Age</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {appt.patient?.dateOfBirth ? `${getPatientAge(appt.patient.dateOfBirth)} Yrs` : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{appt.patient?.gender?.toLowerCase() || 'N/A'}</p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Blood Group</p>
                <p className="text-sm font-bold text-red-600 mt-0.5">{appt.patient?.bloodGroup?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Allergies</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 truncate" title={appt.patient?.allergies?.join(', ') || 'None'}>
                  {appt.patient?.allergies && appt.patient.allergies.length > 0 ? appt.patient.allergies.join(', ') : 'None'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-600">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">{appt.patient?.user?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium truncate">{appt.patient?.user?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Doctor Info Section */}
          <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800">Assigned Practitioner</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-inner">
                {appt.doctor?.user ? `Dr. ${appt.doctor.user.firstName[0]}${appt.doctor.user.lastName[0]}` : 'Dr.'}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}</h4>
                <p className="text-xs font-semibold text-indigo-600">{appt.doctor?.department?.name || 'General Medicine'}</p>
              </div>
            </div>
          </div>

          {/* Reason for Visit & Clinical Notes */}
          <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800">Visit Purpose & Clinical Information</h3>
            </div>

            <div>
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Reason for Visit</h4>
              <p className="text-sm font-semibold text-slate-700 mt-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {appt.reason || 'No specific symptoms or reasons described.'}
              </p>
            </div>

            {/* Clinical Notes - Edit for Doctor, View-Only for others */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Clinical / Consultation Notes</h4>
                {isDoctor && isNotesChanged && (
                  <button
                    onClick={() => saveNotesMutation.mutate(clinicalNotes)}
                    disabled={saveNotesMutation.isPending}
                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {saveNotesMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Notes
                  </button>
                )}
              </div>

              {isDoctor && appt.status !== 'CANCELLED' ? (
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => {
                    setClinicalNotes(e.target.value);
                    setIsNotesChanged(true);
                  }}
                  placeholder="Enter diagnosis, clinical observations, and vital summaries..."
                  className="w-full min-h-[140px] text-sm input p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-300 resize-y"
                />
              ) : (
                <p className={cn(
                  "text-sm p-4 rounded-xl border min-h-[80px]",
                  appt.notes ? "bg-slate-50 border-slate-100 text-slate-700 font-medium" : "bg-slate-50/50 border-slate-100 text-slate-400 italic"
                )}>
                  {appt.notes || 'No clinical notes recorded yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Prescriptions issued card */}
          <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">Prescribed Medications</h3>
              </div>

              {isDoctor && (appt.status === 'IN_PROGRESS' || appt.status === 'COMPLETED') && (
                <Link
                  href={`/dashboard/prescriptions/new?appointmentId=${appt.id}`}
                  className="btn-primary text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Write Prescription
                </Link>
              )}
            </div>

            {appt.prescriptions && appt.prescriptions.length > 0 ? (
              <div className="space-y-4">
                {appt.prescriptions.map((pres: any) => (
                  <div key={pres.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-indigo-600">Diagnosis</p>
                        <p className="text-sm font-bold text-slate-800">{pres.diagnosis || 'General follow-up'}</p>
                      </div>
                      {pres.validUntil && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Valid Until</p>
                          <p className="text-xs font-semibold text-slate-600">{new Date(pres.validUntil).toLocaleDateString('en-IN')}</p>
                        </div>
                      )}
                    </div>

                    {pres.notes && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">Notes: </span>{pres.notes}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicines</p>
                      {pres.medicines && pres.medicines.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {pres.medicines.map((med: any) => (
                            <div key={med.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{med.name}</span>
                                <span className="text-slate-400 mx-1.5">•</span>
                                <span className="text-slate-500">{med.dosage}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold">{med.frequency}</span>
                                <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">{med.duration}</span>
                                <span className="text-slate-400 font-medium italic capitalize">{med.timing.toLowerCase().replace('_', ' ')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No medicine entries.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <Heart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No prescriptions written for this appointment</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Status Workflow & Invoice Panel */}
        <div className="space-y-6">
          
          {/* Status & Actions Box */}
          <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="border-b border-slate-50 pb-3">
              <h3 className="font-bold text-slate-800">Workflow Control</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage the status lifecycle of this appointment.</p>
            </div>

            {/* Action flow based on state and role */}
            <div className="space-y-3">
              {updateStatusMutation.isPending && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              )}

              {/* Scheduled / Confirmed State -> In Progress */}
              {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') && isStaff && (
                <div className="space-y-2">
                  {appt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStatusChange('CONFIRMED')}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-indigo-100"
                    >
                      <CheckSquare className="w-4 h-4" /> Confirm Appointment
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-indigo-100"
                  >
                    <Activity className="w-4 h-4 animate-pulse" /> Check In & Start Visit
                  </button>
                </div>
              )}

              {/* In Progress State -> Completed */}
              {appt.status === 'IN_PROGRESS' && isStaff && (
                <button
                  onClick={() => {
                    handleStatusChange('COMPLETED');
                    setShowFollowUpForm(true);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-green-100"
                >
                  <FileCheck className="w-4 h-4" /> Complete Appointment
                </button>
              )}

              {/* Cancellation Option (Only available before completion or cancellation) */}
              {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED' || appt.status === 'IN_PROGRESS') && (
                <div>
                  {!showCancelDialog ? (
                    <button
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel Appointment
                    </button>
                  ) : (
                    <form onSubmit={handleCancelSubmit} className="bg-red-50/50 p-4 rounded-xl border border-red-100 space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-800">Reason for Cancellation</span>
                        <button type="button" onClick={() => setShowCancelDialog(false)} className="text-red-500 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g. Patient request, doctor unavailable"
                        className="w-full input text-xs p-2 rounded-lg border border-red-200 focus:border-red-500 focus:ring-red-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                      >
                        Confirm Cancellation
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Show follow up creation if completed */}
              {appt.status === 'COMPLETED' && !appt.followUpDate && isDoctor && (
                <div>
                  {!showFollowUpForm ? (
                    <button
                      onClick={() => setShowFollowUpForm(true)}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" /> Schedule Follow Up
                    </button>
                  ) : (
                    <form onSubmit={handleFollowUpSubmit} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-800">Schedule Follow-up</span>
                        <button type="button" onClick={() => setShowFollowUpForm(false)} className="text-indigo-500 hover:text-indigo-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full input text-xs p-2 rounded-lg border border-indigo-200 focus:border-indigo-500"
                        required
                      />
                      <textarea
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        placeholder="Follow-up advice/notes"
                        className="w-full input text-xs p-2 rounded-lg border border-indigo-200 focus:border-indigo-500 resize-none h-16"
                      />
                      <button
                        type="submit"
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                      >
                        Schedule
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Show follow up details if already scheduled */}
              {appt.followUpDate && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-indigo-500">Scheduled Follow-up</p>
                  <p className="text-sm font-bold text-indigo-900">{new Date(appt.followUpDate).toLocaleDateString('en-IN')}</p>
                  {appt.followUpNotes && (
                    <p className="text-xs text-indigo-700 mt-1 italic font-medium">"{appt.followUpNotes}"</p>
                  )}
                </div>
              )}

              {/* Cancel reason box if cancelled */}
              {appt.status === 'CANCELLED' && appt.cancelReason && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-red-500">Cancellation Reason</p>
                  <p className="text-xs text-red-800 font-semibold italic">"{appt.cancelReason}"</p>
                </div>
              )}

              {/* No actions block if completed / cancelled */}
              {(appt.status === 'COMPLETED' || appt.status === 'CANCELLED') && !isDoctor && (
                <p className="text-xs text-slate-400 italic text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
                  This appointment is archived and cannot be edited.
                </p>
              )}
            </div>
          </div>

          {/* Billing & Invoice Panel */}
          <div className="card bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Billing Statement</h3>
                <p className="text-xs text-slate-400 mt-0.5">Invoice detail and status for this visit.</p>
              </div>
              <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
            </div>

            {/* Display Invoice Info */}
            {appt.invoice ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">Invoice No</span>
                    <p className="text-sm font-mono font-bold text-slate-800">{appt.invoice.invoiceNo}</p>
                  </div>
                  <span className={cn('badge text-xs px-2.5 py-1 font-bold rounded-full uppercase', getStatusColor(appt.invoice.status))}>
                    {appt.invoice.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-medium space-y-2.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Amount</span>
                    <span className="font-bold text-slate-800">{formatCurrency(appt.invoice.amount)}</span>
                  </div>
                  {appt.invoice.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount</span>
                      <span>-{formatCurrency(appt.invoice.discount)}</span>
                    </div>
                  )}
                  {appt.invoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax (18% GST)</span>
                      <span>{formatCurrency(appt.invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-800">
                    <span>Total Bill</span>
                    <span className="text-indigo-600">{formatCurrency(appt.invoice.total)}</span>
                  </div>
                </div>

                {appt.invoice.notes && (
                  <p className="text-xs text-slate-400 italic">Notes: "{appt.invoice.notes}"</p>
                )}

                {/* Mark paid for staff, pay bill simulation for patients */}
                {appt.invoice.status === 'PENDING' && (
                  <div>
                    {isStaff ? (
                      <button
                        onClick={() => payInvoiceMutation.mutate(appt.invoice.id)}
                        disabled={payInvoiceMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {payInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Record Cash/Card Payment
                      </button>
                    ) : isPatient ? (
                      <button
                        onClick={() => payInvoiceMutation.mutate(appt.invoice.id)}
                        disabled={payInvoiceMutation.isPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {payInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        Pay Invoice Online
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              // Invoice doesn't exist
              <div className="space-y-4">
                <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                  <p className="text-sm font-semibold text-slate-400">No invoice has been created.</p>
                </div>

                {(isReceptionist || isAdmin) && !showInvoiceForm && (
                  <button
                    onClick={handleOpenInvoiceForm}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 border border-indigo-100"
                  >
                    <Plus className="w-4 h-4" /> Generate Invoice
                  </button>
                )}

                {showInvoiceForm && (
                  <form onSubmit={handleGenerateInvoice} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Generate Invoice</span>
                      <button type="button" onClick={() => setShowInvoiceForm(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Consultation Fee (INR)</label>
                        <input
                          type="number"
                          value={invoiceAmount}
                          onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                          className="w-full input text-xs p-2 rounded-lg border border-slate-200"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Discount (INR)</label>
                        <input
                          type="number"
                          value={invoiceDiscount}
                          onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                          className="w-full input text-xs p-2 rounded-lg border border-slate-200"
                          min="0"
                          required
                        />
                      </div>
                      <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 font-semibold">18% GST (Auto-calculated):</span>
                        <span className="font-bold text-slate-800">{formatCurrency(invoiceTax)}</span>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Billing Notes (Optional)</label>
                        <input
                          type="text"
                          value={invoiceNotes}
                          onChange={(e) => setInvoiceNotes(e.target.value)}
                          placeholder="e.g. Regular health check checkup"
                          className="w-full input text-xs p-2 rounded-lg border border-slate-200"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={createInvoiceMutation.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      {createInvoiceMutation.isPending ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Confirm & Create Invoice'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
