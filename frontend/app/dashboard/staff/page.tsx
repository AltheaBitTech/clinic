'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { 
  UserCheck, Plus, Search, ChevronDown, Loader2, Sparkles, 
  Mail, Link2, Copy, Check, Shield, Stethoscope, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';

export default function StaffPage() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitedLink, setInvitedLink] = useState('');

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('RECEPTIONIST');

  // Queries
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (payload: any) => tenantsApi.invite(currentUser?.tenantId || '', payload),
    onSuccess: (res: any) => {
      const token = res.data.inviteToken;
      const link = `${window.location.origin}/register?token=${token}`;
      setInvitedLink(link);
      toast.success('Invitation generated successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to send invitation';
      toast.error(msg);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('User status updated');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update user status';
      toast.error(msg);
    }
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitedLink);
    toast.success('Registration link copied!');
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    });
  };

  const closeModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteRole('RECEPTIONIST');
    setInvitedLink('');
    inviteMutation.reset();
  };

  // Filter staff: ignore role === 'PATIENT' since "Staff" means clinic employees
  const staffMembers = staffData?.filter((u: any) => u.role !== 'PATIENT' && u.id !== currentUser?.id) || [];

  const filteredStaff = staffMembers.filter((u: any) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const email = u.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'HOSPITAL_ADMIN': return Shield;
      case 'DOCTOR': return Stethoscope;
      default: return Briefcase;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'HOSPITAL_ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'DOCTOR': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'RECEPTIONIST': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            Staff & Access Control
          </h1>
          <p className="page-subtitle">Manage clinic user accounts, access roles, and invite new staff members.</p>
        </div>
        <button onClick={() => setIsInviteModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Invite Staff
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name or email..."
            className="input pl-10"
          />
        </div>

        <div className="relative w-full sm:w-48 shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input appearance-none pr-10"
          >
            <option value="">All Roles</option>
            <option value="HOSPITAL_ADMIN">Administrators</option>
            <option value="DOCTOR">Doctors</option>
            <option value="RECEPTIONIST">Receptionists</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Loading staff directory...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="card text-center py-16">
          <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400">No staff accounts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((u: any) => {
            const RoleIcon = getRoleIcon(u.role);
            return (
              <div key={u.id} className="card card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200">
                        {getInitials(u.firstName, u.lastName)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{u.firstName} {u.lastName}</h3>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <span className={`badge text-[9px] border px-2 py-0.5 flex items-center gap-1 font-bold uppercase ${getRoleBadgeColor(u.role)}`}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mb-4 pt-2">
                    <p><span className="text-slate-400">Phone:</span> {u.phone || 'Not specified'}</p>
                    <p><span className="text-slate-400">Verified:</span> {u.isVerified ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {/* Account Toggle switch */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-auto">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Access</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${u.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {u.isActive ? 'Active' : 'Blocked'}
                    </span>
                    <button
                      onClick={() => toggleActiveMutation.mutate(u.id)}
                      disabled={toggleActiveMutation.isPending}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        u.isActive ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          u.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* INVITE STAFF MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up relative">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Invite Clinic Staff
            </h3>

            {invitedLink ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Registration Link Generated</p>
                  <p className="text-indigo-700">Give this link to your new staff member to complete registration. They will inherit the correct permissions.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitedLink}
                    className="input text-xs bg-slate-50 cursor-default"
                  />
                  <button
                    onClick={copyToClipboard}
                    type="button"
                    className="btn-primary p-2.5 flex items-center justify-center bg-indigo-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={closeModal} className="btn-secondary w-full py-2.5 mt-2 justify-center font-bold">
                  Close Portal
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. staff@clinic.caresync.health"
                      className="input pl-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Staff Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="input appearance-none pr-10 text-sm"
                    >
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="DOCTOR">Consulting Doctor</option>
                      <option value="HOSPITAL_ADMIN">Administrator</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending || !inviteEmail}
                    className="btn-primary"
                  >
                    {inviteMutation.isPending ? 'Generating Link...' : 'Generate Invite Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
