'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, patientsApi, doctorsApi } from '@/lib/api';
import {
  Receipt, Plus, Search, CheckCircle2, ChevronDown,
  Loader2, DollarSign, Calendar, Clock, Sparkles, FileText, User,
  Download, Mail, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials, formatDate, formatCurrency } from '@/lib/utils';

export default function BillingPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Form states for creating invoice
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  const [amount, setAmount] = useState(500);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(90); // 18% GST default for 500
  const [notes, setNotes] = useState('');

  // Queries
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, page],
    queryFn: () => billingApi.getInvoices({ status: statusFilter || undefined, page }).then((r) => r.data),
  });

  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientsApi.getAll({ search: patientSearch, limit: 10 }).then((r) => r.data),
  });

  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors-search', doctorSearch],
    queryFn: () => doctorsApi.getAll().then((r) => r.data),
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (payload: any) => billingApi.createInvoice(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice generated successfully!');
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create invoice';
      toast.error(msg);
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => billingApi.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to record payment';
      toast.error(msg);
    }
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (inv: any) => {
    try {
      setDownloadingId(inv.id);
      const res = await billingApi.downloadInvoicePdf(inv.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${inv.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEmailShare = (inv: any) => {
    toast('Emailing invoices will be available soon.', { icon: '📧' });
  };

  const handleWhatsappShare = (inv: any) => {
    toast('Sending invoices via WhatsApp will be available soon.', { icon: '💬' });
  };

  const closeModal = () => {
    setIsInvoiceModalOpen(false);
    setSelectedPatient(null);
    setPatientSearch('');
    setSelectedDoctor(null);
    setDoctorSearch('');
    setAmount(500);
    setDiscount(0);
    setTax(90);
    setNotes('');
  };

  // Pre-calculate tax (18%) when amount or discount changes
  const handleAmountChange = (val: number) => {
    setAmount(val);
    const net = val - discount;
    setTax(Math.round(net * 0.18 * 100) / 100);
  };

  const handleDiscountChange = (val: number) => {
    setDiscount(val);
    const net = amount - val;
    setTax(Math.round(net * 0.18 * 100) / 100);
  };

  // Pre-populate consultation fee when doctor is selected
  const handleDoctorSelect = (doc: any) => {
    setSelectedDoctor(doc);
    setDoctorSearch(`Dr. ${doc.user.firstName} ${doc.user.lastName}`);
    const fee = Number(doc.consultationFee || 500);
    setAmount(fee);
    const net = fee - discount;
    setTax(Math.round(net * 0.18 * 100) / 100);
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

  // Filtering doctors list
  const filteredDoctors = doctorsData?.data?.filter((doc: any) => {
    const fullName = `${doc.user.firstName} ${doc.user.lastName}`.toLowerCase();
    const query = doctorSearch.toLowerCase();
    return fullName.includes(query);
  }) || [];

  // Summary Metrics
  const totalRevenue = invoicesData?.totalRevenue || 0;
  const totalInvoices = invoicesData?.total || 0;
  const pendingCount = invoicesData?.data?.filter((inv: any) => inv.status === 'PENDING').length || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600 shrink-0" />
            Billing & Invoices
          </h1>
          <p className="page-subtitle">Track patient billing records, generate clinic invoices, and record payments.</p>
        </div>
        <button onClick={() => setIsInvoiceModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Revenue Collected</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalInvoices}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Invoices Issued</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Unpaid Bills Pending</p>
          </div>
        </div>
      </div>

      {/* Filters & Content Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-slate-800 text-sm">All Invoices</h3>
          
          <div className="relative w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input appearance-none pr-10 text-xs py-1.5"
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Fetching Invoices...
          </div>
        ) : invoicesData?.data?.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No invoices match your selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice No</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Date</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Charge</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoicesData.data.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {inv.patient.user.firstName} {inv.patient.user.lastName}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {inv.appointment?.doctor ? `Dr. ${inv.appointment.doctor.user.firstName} ${inv.appointment.doctor.user.lastName}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{formatDate(inv.createdAt)}</td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-800">{formatCurrency(inv.total)}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`badge ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {inv.status === 'PENDING' ? (
                          <button
                            onClick={() => markPaidMutation.mutate(inv.id)}
                            disabled={markPaidMutation.isPending}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-none rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Collected</span>
                        )}

                        <button
                          onClick={() => handleDownload(inv)}
                          disabled={downloadingId === inv.id}
                          title="Download invoice PDF"
                          className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border-none rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {downloadingId === inv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleEmailShare(inv)}
                          title="Send invoice via email"
                          className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border-none rounded-lg transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleWhatsappShare(inv)}
                          title="Send invoice via WhatsApp"
                          className="flex items-center justify-center w-7 h-7 text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border-none rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Generate Clinic Invoice
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Patient Search */}
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
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {isLoadingPatients ? (
                      <div className="p-3 text-center text-xs text-slate-400">Searching...</div>
                    ) : patientsData?.data?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No patient found.</div>
                    ) : (
                      patientsData?.data?.map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientSearch(`${p.user.firstName} ${p.user.lastName}`);
                            setIsPatientDropdownOpen(false);
                          }}
                          className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center"
                        >
                          <span>{p.user.firstName} {p.user.lastName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">{p.patientCode}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {isPatientDropdownOpen && (
                  <div className="fixed inset-0 z-0" onClick={() => setIsPatientDropdownOpen(false)} />
                )}
              </div>

              {/* Doctor Search (to prefill fee) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Consulting Doctor (Optional)
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
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-40 overflow-y-auto divide-y divide-slate-50">
                    {isLoadingDoctors ? (
                      <div className="p-3 text-center text-xs text-slate-400">Loading...</div>
                    ) : filteredDoctors.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No doctors.</div>
                    ) : (
                      filteredDoctors.map((d: any) => (
                        <div
                          key={d.id}
                          onClick={() => handleDoctorSelect(d)}
                          className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 flex justify-between items-center"
                        >
                          <span>Dr. {d.user.firstName} {d.user.lastName}</span>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.5 rounded">{formatCurrency(d.consultationFee)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {isDoctorDropdownOpen && (
                  <div className="fixed inset-0 z-0" onClick={() => setIsDoctorDropdownOpen(false)} />
                )}
              </div>

              {/* Consultation amount, discount, tax */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Amount (INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    min={0}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Discount
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => handleDiscountChange(Number(e.target.value))}
                    min={0}
                    max={amount}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tax (18% GST)
                  </label>
                  <input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    min={0}
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Total Payable Recap */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Total Invoice Cost</span>
                  <span className="text-xs text-slate-500">Amount - Discount + Tax</span>
                </div>
                <span className="text-xl font-black text-indigo-600">
                  {formatCurrency(Number(amount) - Number(discount) + Number(tax))}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Billing Notes / Remarks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Regular health checkup consultation billing"
                  className="input text-xs min-h-[60px]"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceMutation.isPending || !selectedPatient}
                  className="btn-primary"
                >
                  {createInvoiceMutation.isPending ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
