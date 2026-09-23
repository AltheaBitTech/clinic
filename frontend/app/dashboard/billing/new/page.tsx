'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { billingApi, patientsApi, doctorsApi } from '@/lib/api';
import { getInitials, formatCurrency } from '@/lib/utils';
import {
  Sparkles, Search, ArrowLeft, Loader2, FileText, Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewInvoicePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  const [amount, setAmount] = useState(500);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientsApi.getAll({ search: patientSearch, limit: 10 }).then((r) => r.data),
  });

  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors-search', doctorSearch],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: any) => billingApi.createInvoice(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice generated successfully!');
      router.push('/dashboard/billing');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create invoice';
      toast.error(msg);
    }
  });

  const handleDoctorSelect = (doc: any) => {
    setSelectedDoctor(doc);
    setDoctorSearch(`Dr. ${doc.user.firstName} ${doc.user.lastName}`);
    const fee = Number(doc.consultationFee || 500);
    setAmount(fee);
    setIsDoctorDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient?.id) {
      toast.error('Please select a patient');
      return;
    }

    createInvoiceMutation.mutate({
      patientId: selectedPatient.id,
      amount: Number(amount),
      discount: Number(discount),
      tax: Number(tax),
      notes: notes || undefined,
    });
  };

  const filteredDoctors = doctorsData?.data?.filter((doc: any) => {
    const fullName = `${doc.user.firstName} ${doc.user.lastName}`.toLowerCase();
    const query = doctorSearch.toLowerCase();
    return fullName.includes(query);
  }) || [];

  const netTotal = Number(amount) - Number(discount) + Number(tax);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 text-sm font-medium mb-5 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Billing
      </Link>

      <div className="page-header sm:mb-8">
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-600 animate-pulse shrink-0" />
          Generate Clinic Invoice
        </h1>
        <p className="page-subtitle">Create a new billing record for a patient consultation or service.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

          {/* STEP 1: PATIENT */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">1</span>
              <h3 className="font-semibold text-slate-800">Patient Information</h3>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Search Patient <span className="text-red-500">*</span>
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
                  placeholder="Search patient by name or code..."
                  className="input pl-10"
                  required
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

              {isPatientDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {isLoadingPatients ? (
                    <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Searching...
                    </div>
                  ) : patientsData?.data?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">No patient found.</div>
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
          </div>

          {/* STEP 2: DOCTOR (OPTIONAL, PREFILLS FEE) */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">2</span>
              <h3 className="font-semibold text-slate-800">Consulting Doctor (Optional)</h3>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Select Consulting Doctor
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
                  placeholder="Search doctor to pull consulting fees..."
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

              {isDoctorDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {isLoadingDoctors ? (
                    <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Loading...
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">No doctors.</div>
                  ) : (
                    filteredDoctors.map((d: any) => (
                      <div
                        key={d.id}
                        onClick={() => handleDoctorSelect(d)}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold flex items-center justify-center shrink-0">
                            Dr
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-800 text-sm">Dr. {d.user.firstName} {d.user.lastName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg shrink-0">
                          {formatCurrency(d.consultationFee)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {isDoctorDropdownOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsDoctorDropdownOpen(false)} />
              )}
            </div>
          </div>

          {/* STEP 3: CHARGES */}
          <div className="card space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3 mb-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 font-bold text-sm flex items-center justify-center shrink-0 mr-2">3</span>
              <h3 className="font-semibold text-slate-800">Billing Charges</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Amount (INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={0}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Discount
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min={0}
                  max={amount}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tax (GST)
                </label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                  min={0}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Billing Notes / Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Regular health checkup consultation billing"
                className="input min-h-[100px] resize-y"
              />
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6 border border-slate-100 shadow-md space-y-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-cyan-600" />
              Invoice Summary
            </h3>

            <div className="space-y-4">
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
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No doctor selected</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cost Breakdown</span>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Amount</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Discount</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Tax (GST)</span>
                <span>+ {formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-800 text-base border-t border-slate-100 pt-2 mt-1">
                <span>Net Total</span>
                <span className="text-cyan-600">{formatCurrency(netTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={createInvoiceMutation.isPending || !selectedPatient}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-cyan-100 font-bold"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Receipt className="w-5 h-5" /> Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
