'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, tenantRequestsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Building2, Users, Calendar, Check, X,
  Clock, Copy, ExternalLink, MapPin, Mail, Phone,
  User, ShieldAlert, CheckCircle2, UserCheck, Search, Loader2
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

function StatCard({
  label, value, icon: Icon, color, subtext
}: { label: string; value: string | number; icon: React.ElementType; color: string; subtext?: string }) {
  return (
    <div className="card hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    message: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    adminEmail: string;
    temporaryPassword?: string;
  } | null;
}

function CredentialsModal({ isOpen, onClose, credentials }: CredentialsModalProps) {
  if (!isOpen || !credentials) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden transform transition-all">
        <div className="p-6 border-b border-slate-50 bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hospital Approved!</h3>
              <p className="text-xs text-indigo-700 font-medium">Tenant & Admin Account Created</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hospital Name</label>
            <div className="text-sm font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg">
              {credentials.tenantName}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Admin Login Email</label>
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="text-sm text-slate-700 font-medium truncate">{credentials.adminEmail}</span>
              <button 
                onClick={() => handleCopy(credentials.adminEmail, 'Email')}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Temporary Password</label>
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-indigo-100 bg-indigo-50/20">
              <span className="text-sm font-mono text-indigo-700 font-semibold">{credentials.temporaryPassword || 'Welcome@Arogyix2026'}</span>
              <button 
                onClick={() => handleCopy(credentials.temporaryPassword || 'Welcome@Arogyix2026', 'Password')}
                className="p-1 hover:bg-indigo-100 rounded text-indigo-600 hover:text-indigo-800 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Please copy these details now. For security reasons, the temporary password will not be shown again.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Credentials modal state
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [newlyCreatedCredentials, setNewlyCreatedCredentials] = useState<any | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard', 'super-admin'],
    queryFn: () => dashboardApi.getSuperAdmin().then((r) => r.data),
  });

  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['tenant-requests'],
    queryFn: () => tenantRequestsApi.getAll().then((r) => r.data),
  });

  // Actions
  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const response = await tenantRequestsApi.approve(id);
      setNewlyCreatedCredentials(response.data);
      setCredentialsModalOpen(true);
      toast.success('Registration request approved!');
      refetchRequests();
      refetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this registration request?')) return;
    
    setActionLoadingId(id);
    try {
      await tenantRequestsApi.reject(id);
      toast.success('Registration request rejected');
      refetchRequests();
      refetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = (requests || []).filter((r: any) => r.status === activeTab);

  if (statsLoading || requestsLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-11 h-11 bg-slate-200 rounded-xl mb-4" />
              <div className="h-8 bg-slate-200 rounded mb-2 w-24" />
              <div className="h-4 bg-slate-100 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="card h-96 animate-pulse bg-white rounded-2xl" />
      </div>
    );
  }

  const pendingCount = (requests || []).filter((r: any) => r.status === 'PENDING').length;

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Super Admin Portal</h1>
          <p className="page-subtitle">Welcome back, {user?.firstName}. Manage Arogyix hospital nodes & approvals.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Hospitals" value={stats?.totalTenants || 0} icon={Building2} color="bg-indigo-500" />
        <StatCard label="Platform Users" value={stats?.totalUsers || 0} icon={Users} color="bg-emerald-500" />
        <StatCard label="Total Patients" value={stats?.totalPatients || 0} icon={UserCheck} color="bg-purple-500" />
        <StatCard label="Total Appointments" value={stats?.totalAppointments || 0} icon={Calendar} color="bg-amber-500" />
      </div>

      {/* Main Request Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Hospital Registration Requests</h3>
            <p className="text-xs text-slate-400">Review incoming tenant requests from the platform landing page.</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                activeTab === 'PENDING'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Pending
              {pendingCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'APPROVED'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveTab('REJECTED')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'REJECTED'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Hospital / Clinic</th>
                <th>Admin details</th>
                <th>Location</th>
                <th>Submitted On</th>
                <th>Status</th>
                {activeTab === 'PENDING' && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req: any) => (
                <tr key={req.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0 border border-slate-200/50">
                        <Building2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{req.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {req.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.firstName} {req.lastName}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.email}</span>
                      </div>
                      {req.phone && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="leading-tight">{req.address || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{req.city ? `${req.city}, ${req.state || ''}` : ''}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      'badge font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5',
                      req.status === 'PENDING' && 'bg-amber-50 text-amber-700 border border-amber-200/50',
                      req.status === 'APPROVED' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
                      req.status === 'REJECTED' && 'bg-red-50 text-red-700 border border-red-200/50'
                    )}>
                      {req.status}
                    </span>
                  </td>
                  {activeTab === 'PENDING' && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoadingId !== null}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Reject Request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoadingId !== null}
                          className="btn-primary py-1.5 px-2.5 flex items-center gap-1 text-xs"
                          title="Approve Hospital Node"
                        >
                          {actionLoadingId === req.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>Approve</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'PENDING' ? 6 : 5} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium">No {activeTab.toLowerCase()} requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credentials display modal */}
      <CredentialsModal
        isOpen={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        credentials={newlyCreatedCredentials}
      />
    </div>
  );
}
