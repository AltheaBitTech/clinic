'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { pathologyLabsApi, pathologyDashboardApi } from '@/lib/api';
import {
  FlaskConical, Phone, Mail, MapPin, Clock, Truck, FileText,
  User, Check, AlertCircle, Building2, Loader2, Pencil, X,
  Microscope, ClipboardList, Share2, BarChart3, IndianRupee,
  CalendarClock, ShieldCheck, PackageCheck, AlertTriangle, XCircle,
  RotateCcw, TimerReset, Beaker,
} from 'lucide-react';
import { formatDate, isValidPhone } from '@/lib/utils';
import toast from 'react-hot-toast';

type FormData = {
  name: string;
  ownerName: string;
  licenseNumber: string;
  accreditationNo: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  openingHours: string;
  closingHours: string;
  homeCollectionAvailable: boolean;
  homeCollectionFee: string;
  notes: string;
};

const toForm = (p: any): FormData => ({
  name: p?.name || '',
  ownerName: p?.ownerName || '',
  licenseNumber: p?.licenseNumber || '',
  accreditationNo: p?.accreditationNo || '',
  phone: p?.phone || '',
  email: p?.email || '',
  address: p?.address || '',
  city: p?.city || '',
  state: p?.state || '',
  pincode: p?.pincode || '',
  openingHours: p?.openingHours || '',
  closingHours: p?.closingHours || '',
  homeCollectionAvailable: !!p?.homeCollectionAvailable,
  homeCollectionFee: p?.homeCollectionFee != null ? String(p.homeCollectionFee) : '',
  notes: p?.notes || '',
});

export default function PathologyPortalPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: lab, isLoading } = useQuery({
    queryKey: ['pathology-lab-mine'],
    queryFn: () => pathologyLabsApi.getMine().then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['pathology-dashboard-summary'],
    queryFn: () => pathologyDashboardApi.getSummary().then((r) => r.data),
  });

  useEffect(() => {
    if (lab) setForm(toForm(lab));
  }, [lab]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      pathologyLabsApi.updateMine({
        ...data,
        homeCollectionFee: data.homeCollectionFee ? Number(data.homeCollectionFee) : undefined,
      }),
    onSuccess: () => {
      toast.success('Lab details updated');
      queryClient.invalidateQueries({ queryKey: ['pathology-lab-mine'] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update details');
    },
  });

  const set = (field: keyof FormData, value: any) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    if (!form) return false;
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Lab name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!isValidPhone(form.phone)) errs.phone = 'Enter a valid 10-digit phone number';
    if (!form.address.trim()) errs.address = 'Address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;
    updateMutation.mutate(form);
  };

  const cancelEdit = () => {
    if (lab) setForm(toForm(lab));
    setErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!lab || !form) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200 shrink-0">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">{lab.name}</h1>
            <p className="page-subtitle">Manage your pathology lab&apos;s listing details</p>
          </div>
        </div>
        {!isEditing && (
          <button
            id="edit-lab-profile-btn"
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit Details
          </button>
        )}
      </div>

      {!isEditing && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            <SummaryCard icon={ClipboardList} label="Today's Orders" value={summary?.todaysOrdersCount ?? '—'} color="cyan" />
            <SummaryCard icon={Truck} label="Samples Pending Collection" value={summary?.samplesPendingCollection ?? '—'} color="amber" />
            <SummaryCard icon={Beaker} label="Samples Received" value={summary?.samplesReceived ?? '—'} color="cyan" />
            <SummaryCard icon={FlaskConical} label="Processing" value={summary?.processing ?? '—'} color="amber" />
            <SummaryCard icon={ClipboardList} label="Results Pending" value={summary?.pendingResults ?? '—'} color="amber" />
            <SummaryCard icon={ShieldCheck} label="Pending Verification" value={summary?.pendingVerification ?? '—'} color="red" />
            <SummaryCard icon={Check} label="Reports Finalized Today" value={summary?.reportsFinalizedToday ?? '—'} color="emerald" />
            <SummaryCard icon={PackageCheck} label="Delivered Today" value={summary?.reportsDeliveredToday ?? '—'} color="emerald" />
            <SummaryCard icon={AlertTriangle} label="Critical (Unacknowledged)" value={summary?.criticalUnacknowledged ?? '—'} color="red" />
            <SummaryCard icon={XCircle} label="Rejected Samples" value={summary?.rejectedSamples ?? '—'} color="red" />
            <SummaryCard icon={RotateCcw} label="Recollection Requested" value={summary?.recollectionRequested ?? '—'} color="amber" />
            <SummaryCard
              icon={TimerReset}
              label="Avg. Turnaround (TAT)"
              value={summary?.averageTurnaroundHours != null ? `${summary.averageTurnaroundHours}h` : '—'}
              color="cyan"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <SummaryCard
              icon={IndianRupee}
              label="Today's Revenue"
              value={summary ? `₹${Number(summary.todaysRevenue).toFixed(0)}` : '—'}
              color="emerald"
            />
            <SummaryCard icon={Share2} label="Active Hospital Links" value={summary?.activeHospitalLinks ?? '—'} color="cyan" />
          </div>

          {summary?.pendingWork?.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pending Work</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample ID</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test</th>
                      <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.pendingWork.map((w: any) => (
                      <tr key={w.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3 text-xs font-medium text-slate-700">
                          <Link href={`/dashboard/pathology-portal/orders/${w.id}`} className="hover:text-cyan-600">
                            {w.sampleId || w.orderNo}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-xs text-slate-600">{w.patientName || '—'}</td>
                        <td className="py-2 px-3 text-xs text-slate-600">{w.testNames || '—'}</td>
                        <td className="py-2 px-3 text-xs">
                          <span className="badge text-[10px] font-bold bg-slate-100 text-slate-600">{w.status.replace(/_/g, ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <QuickLink href="/dashboard/pathology-portal/tests" icon={Microscope} label="Test Catalog" />
            <QuickLink href="/dashboard/pathology-portal/orders" icon={ClipboardList} label="Orders" />
            <QuickLink href="/dashboard/pathology-portal/links" icon={Share2} label="Hospital Links" />
            <QuickLink href="/dashboard/pathology-portal/collectors" icon={Truck} label="Collectors" />
            <QuickLink href="/dashboard/pathology-portal/reports" icon={BarChart3} label="Lab Reports" />
          </div>
        </>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto" id="edit-lab-profile-form">
          <FormSection icon={FlaskConical} title="Basic Information" description="Core details about the lab">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="edit-lab-name" label="Lab Name" required error={errors.name}>
                <input
                  id="edit-lab-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={`input ${errors.name ? 'border-red-300' : ''}`}
                />
              </FormField>
              <FormField id="edit-owner-name" label="Owner / Manager Name">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-owner-name"
                    value={form.ownerName}
                    onChange={(e) => set('ownerName', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="edit-license-number" label="License / Registration Number">
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-license-number"
                    value={form.licenseNumber}
                    onChange={(e) => set('licenseNumber', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
              <FormField id="edit-accreditation-no" label="Accreditation No. (NABL etc.)">
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-accreditation-no"
                    value={form.accreditationNo}
                    onChange={(e) => set('accreditationNo', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={Phone} title="Contact Details" description="How hospitals and patients can reach you">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="edit-lab-phone" label="Phone Number" required error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-lab-phone"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    className={`input pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                  />
                </div>
              </FormField>
              <FormField id="edit-lab-email" label="Email Address">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-lab-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={MapPin} title="Address & Location" description="Physical location of the lab">
            <FormField id="edit-lab-address" label="Street Address" required error={errors.address}>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="edit-lab-address"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  className={`input pl-10 ${errors.address ? 'border-red-300' : ''}`}
                />
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField id="edit-lab-city" label="City">
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-lab-city"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
              <FormField id="edit-lab-state" label="State">
                <input
                  id="edit-lab-state"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  className="input"
                />
              </FormField>
              <FormField id="edit-lab-pincode" label="Pincode">
                <input
                  id="edit-lab-pincode"
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value)}
                  className="input"
                  maxLength={6}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={Clock} title="Hours & Services" description="Operating hours and home collection">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="edit-opening-hours" label="Opening Time">
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-opening-hours"
                    type="time"
                    value={form.openingHours}
                    onChange={(e) => set('openingHours', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
              <FormField id="edit-closing-hours" label="Closing Time">
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-closing-hours"
                    type="time"
                    value={form.closingHours}
                    onChange={(e) => set('closingHours', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            </div>
            <div
              id="edit-home-collection-toggle"
              onClick={() => set('homeCollectionAvailable', !form.homeCollectionAvailable)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                form.homeCollectionAvailable
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  form.homeCollectionAvailable ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <Truck className={`w-5 h-5 ${form.homeCollectionAvailable ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">Home Sample Collection Available</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable if your collectors visit patients&apos; homes for sample collection
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  form.homeCollectionAvailable ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                }`}
              >
                {form.homeCollectionAvailable && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            {form.homeCollectionAvailable && (
              <FormField id="edit-home-collection-fee" label="Home Collection Fee (₹)">
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="edit-home-collection-fee"
                    type="number"
                    step="0.01"
                    value={form.homeCollectionFee}
                    onChange={(e) => set('homeCollectionFee', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </FormField>
            )}
          </FormSection>

          <FormSection icon={FileText} title="Additional Notes" description="Anything else hospitals should know">
            <textarea
              id="edit-lab-notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </FormSection>

          <div className="flex items-center gap-3 pt-2">
            <button
              id="save-lab-profile-btn"
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center gap-2 px-6 disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <button type="button" onClick={cancelEdit} className="btn-secondary flex items-center gap-2 text-sm px-6">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {lab.homeCollectionAvailable && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
              <Truck className="w-3.5 h-3.5" />
              Home Collection Available
              {lab.homeCollectionFee != null && ` · ₹${Number(lab.homeCollectionFee).toFixed(0)}`}
            </span>
          )}

          <Section title="Contact Information">
            <InfoRow icon={Phone} label="Phone" value={lab.phone} />
            {lab.email && <InfoRow icon={Mail} label="Email" value={lab.email} />}
            {lab.ownerName && (
              <InfoRow icon={User} label="Owner / Manager" value={lab.ownerName} />
            )}
          </Section>

          <Section title="Location">
            <InfoRow icon={MapPin} label="Address" value={lab.address} />
            {lab.city && <InfoRow icon={Building2} label="City" value={lab.city} />}
            {lab.state && <InfoRow icon={Building2} label="State" value={lab.state} />}
            {lab.pincode && <InfoRow icon={MapPin} label="Pincode" value={lab.pincode} />}
          </Section>

          {(lab.openingHours || lab.closingHours) && (
            <Section title="Operating Hours">
              {lab.openingHours && (
                <InfoRow icon={Clock} label="Opens" value={lab.openingHours} />
              )}
              {lab.closingHours && (
                <InfoRow icon={Clock} label="Closes" value={lab.closingHours} />
              )}
            </Section>
          )}

          {(lab.licenseNumber || lab.accreditationNo) && (
            <Section title="Regulatory">
              {lab.licenseNumber && <InfoRow icon={FileText} label="License No." value={lab.licenseNumber} />}
              {lab.accreditationNo && <InfoRow icon={ShieldCheck} label="Accreditation No." value={lab.accreditationNo} />}
            </Section>
          )}

          {lab.notes && (
            <Section title="Notes">
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{lab.notes}</p>
            </Section>
          )}

          {lab.createdAt && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              Listed since {formatDate(lab.createdAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'amber' | 'red' | 'cyan' | 'emerald';
}) {
  const colorStyles: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorStyles[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-3 hover:border-cyan-200 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-cyan-600" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
    </Link>
  );
}

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
