'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmaciesApi } from '@/lib/api';
import {
  Store, Search, Plus, Phone, MapPin, Mail, Clock,
  Truck, AlertCircle, ChevronRight, Building2, User,
  FileText, CheckCircle2, XCircle, Link2, Copy, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function PharmaciesPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ['pharmacies', search],
    queryFn: () =>
      pharmaciesApi.getAll({ search: search || undefined }).then((r) => r.data),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => pharmaciesApi.remove(id),
    onSuccess: () => {
      toast.success('Pharmacy deactivated');
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
    },
    onError: () => toast.error('Failed to deactivate pharmacy'),
  });

  const inviteMutation = useMutation({
    mutationFn: () => pharmaciesApi.createInvite(),
    onSuccess: (res: any) => {
      const token = res.data.token;
      setInviteLink(`${window.location.origin}/register/pharmacy?token=${token}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate invite link');
    },
  });

  const openInviteModal = () => {
    setIsInviteModalOpen(true);
    setInviteLink('');
    inviteMutation.mutate();
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteLink('');
    inviteMutation.reset();
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Registration link copied!');
  };

  const isAdmin = user?.role === 'HOSPITAL_ADMIN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Pharmacies</h1>
          <p className="page-subtitle">
            Manage linked pharmacies for your clinic
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            id="invite-pharmacy-btn"
            onClick={openInviteModal}
            className="btn-secondary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <Link2 className="w-4 h-4" />
            Invite Pharmacy
          </button>
          <Link
            href="/dashboard/pharmacies/new"
            id="add-pharmacy-btn"
            className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Pharmacy
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="pharmacy-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, city, phone, or owner…"
          className="input pl-10"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : pharmacies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-cyan-300" />
          </div>
          <h3 className="text-slate-700 font-semibold text-lg mb-1">
            No pharmacies yet
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Add the pharmacies your clinic works with so doctors can quickly
            refer patients.
          </p>
          <Link
            href="/dashboard/pharmacies/new"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Pharmacy
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pharmacies.map((p: any) => (
            <PharmacyCard
              key={p.id}
              pharmacy={p}
              isAdmin={isAdmin}
              onViewDetail={() => setSelected(p)}
              onRemove={() => removeMutation.mutate(p.id)}
            />
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <PharmacyDetailDrawer
          pharmacy={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onRemove={() => removeMutation.mutate(selected.id)}
        />
      )}

      {/* Invite Pharmacy Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              Invite a Pharmacy
            </h3>

            {inviteMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Generating one-time link…</p>
              </div>
            ) : inviteLink ? (
              <div className="space-y-4">
                <div className="p-4 bg-cyan-50 border border-cyan-100 text-cyan-900 rounded-xl text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <Link2 className="w-4 h-4" /> Self-Registration Link Generated
                  </p>
                  <p className="text-cyan-700">
                    Share this link with the pharmacy. They can fill in their own details and
                    set a password to join your clinic&apos;s network. The link expires in 7
                    days or after first use.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="input text-xs bg-slate-50 cursor-default"
                  />
                  <button
                    onClick={copyInviteLink}
                    type="button"
                    className="btn-primary p-2.5 flex items-center justify-center bg-cyan-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={closeInviteModal}
                  className="btn-secondary w-full py-2.5 mt-2 justify-center font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Something went wrong generating the invite link.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={closeInviteModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={() => inviteMutation.mutate()} className="btn-primary">
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pharmacy Card ─────────────────────────────────────────────────────────── */

function PharmacyCard({
  pharmacy: p,
  isAdmin,
  onViewDetail,
  onRemove,
}: {
  pharmacy: any;
  isAdmin: boolean;
  onViewDetail: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      id={`pharmacy-card-${p.id}`}
      className="card group cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      onClick={onViewDetail}
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm leading-tight">
              {p.name}
            </h3>
            {p.ownerName && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <User className="w-3 h-3" />
                {p.ownerName}
              </p>
            )}
          </div>
        </div>
        {p.homeDeliveryAvailable && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
            <Truck className="w-3 h-3" />
            Delivery
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{p.phone}</span>
        </div>
        {p.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{p.email}</span>
          </div>
        )}
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {p.address}
            {p.city ? `, ${p.city}` : ''}
            {p.pincode ? ` - ${p.pincode}` : ''}
          </span>
        </div>
        {(p.openingHours || p.closingHours) && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {p.openingHours || '—'} – {p.closingHours || '—'}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Added {formatDate(p.createdAt)}
        </span>
        <span className="flex items-center gap-1 text-xs text-cyan-600 font-medium group-hover:underline">
          View details <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

/* ── Detail Drawer ─────────────────────────────────────────────────────────── */

function PharmacyDetailDrawer({
  pharmacy: p,
  isAdmin,
  onClose,
  onRemove,
}: {
  pharmacy: any;
  isAdmin: boolean;
  onClose: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">{p.name}</h2>
              {p.licenseNumber && (
                <p className="text-white/70 text-xs">
                  License: {p.licenseNumber}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                p.homeDeliveryAvailable
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              {p.homeDeliveryAvailable ? 'Home Delivery Available' : 'No Home Delivery'}
            </span>
          </div>

          {/* Info sections */}
          <Section title="Contact Information">
            <InfoRow icon={Phone} label="Phone" value={p.phone} />
            {p.email && <InfoRow icon={Mail} label="Email" value={p.email} />}
            {p.ownerName && (
              <InfoRow icon={User} label="Owner / Manager" value={p.ownerName} />
            )}
          </Section>

          <Section title="Location">
            <InfoRow icon={MapPin} label="Address" value={p.address} />
            {p.city && <InfoRow icon={Building2} label="City" value={p.city} />}
            {p.state && (
              <InfoRow icon={Building2} label="State" value={p.state} />
            )}
            {p.pincode && (
              <InfoRow icon={MapPin} label="Pincode" value={p.pincode} />
            )}
          </Section>

          {(p.openingHours || p.closingHours) && (
            <Section title="Operating Hours">
              {p.openingHours && (
                <InfoRow icon={Clock} label="Opens" value={p.openingHours} />
              )}
              {p.closingHours && (
                <InfoRow icon={Clock} label="Closes" value={p.closingHours} />
              )}
            </Section>
          )}

          {p.licenseNumber && (
            <Section title="Regulatory">
              <InfoRow
                icon={FileText}
                label="License No."
                value={p.licenseNumber}
              />
            </Section>
          )}

          {p.notes && (
            <Section title="Notes">
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                {p.notes}
              </p>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          <Link
            href={`/dashboard/pharmacies/${p.id}/edit`}
            className="btn-secondary flex-1 text-center text-sm"
          >
            Edit Details
          </Link>
          {isAdmin && (
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Deactivate
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
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
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
