'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, appointmentsApi, billingApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  Calendar, Users, Receipt, TrendingUp, Plus, Search,
  CheckCircle2, Clock, UserCheck, XCircle, CreditCard,
  UserPlus, DollarSign, Activity, ChevronRight, RefreshCw, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatCurrency, getStatusColor, getInitials } from '@/lib/utils';

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Query receptionist dashboard stats
  const { data: stats, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dashboard', 'receptionist'],
    queryFn: () => dashboardApi.getReceptionist().then((r) => r.data),
  });

  // Mutation to update appointment status (e.g. check-in or cancel)
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'receptionist'] });
      toast.success('Appointment status updated successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update appointment';
      toast.error(msg);
    },
  });

  // Mutation to record/collect payment
  const collectPaymentMutation = useMutation({
    mutationFn: (invoiceId: string) => billingApi.markPaid(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'receptionist'] });
      toast.success('Payment recorded successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to record payment';
      toast.error(msg);
    },
  });

  // Mutation to generate quick invoice
  const generateQuickInvoiceMutation = useMutation({
    mutationFn: (payload: { appointmentId: string; patientId: string; amount: number }) =>
      billingApi.createInvoice({
        appointmentId: payload.appointmentId,
        patientId: payload.patientId,
        amount: payload.amount,
        tax: Math.round(payload.amount * 0.18 * 100) / 100, // 18% tax
        discount: 0,
        notes: 'Consultation fee generated from Front Desk Dashboard',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'receptionist'] });
      toast.success('Invoice generated successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to generate invoice';
      toast.error(msg);
    },
  });

  const handleCheckIn = (appointmentId: string) => {
    updateAppointmentMutation.mutate({ id: appointmentId, status: 'IN_PROGRESS' });
  };

  const handleCancel = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      updateAppointmentMutation.mutate({ id: appointmentId, status: 'CANCELLED' });
    }
  };

  const handleMarkCompleted = (appointmentId: string) => {
    updateAppointmentMutation.mutate({ id: appointmentId, status: 'COMPLETED' });
  };

  const handleCollectPayment = (invoiceId: string) => {
    collectPaymentMutation.mutate(invoiceId);
  };

  const handleGenerateInvoice = (appointmentId: string, patientId: string) => {
    // Default consultation fee of 500 INR
    generateQuickInvoiceMutation.mutate({ appointmentId, patientId, amount: 500 });
  };

  const todaySchedule = stats?.todaySchedule || [];
  const filteredSchedule = todaySchedule.filter((appt: any) => {
    const patientName = `${appt.patient.user.firstName} ${appt.patient.user.lastName}`.toLowerCase();
    const doctorName = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) || doctorName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || appt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28" />
          ))}
        </div>
        <div className="card h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Front Desk Dashboard
          </h1>
          <p className="page-subtitle">
            Welcome, {user?.firstName || 'Receptionist'}! Manage patient reception, appointments, check-ins, and billing today.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary self-start md:self-auto flex items-center gap-2 text-sm"
        >
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Summary Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Appointments</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.todayAppointments || 0}</p>
            </div>
            <div className="p-2.5 bg-indigo-55 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Total bookings scheduled for today
          </div>
        </div>

        <div className="card border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Checked-In / Waiting</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.checkedInAppointments || 0}</p>
            </div>
            <div className="p-2.5 bg-yellow-55 rounded-xl">
              <UserCheck className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            {stats?.pendingAppointments || 0} scheduled patients remaining
          </div>
        </div>

        <div className="card border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Payments Pending</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.pendingPayments || 0}</p>
            </div>
            <div className="p-2.5 bg-emerald-55 rounded-xl">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 font-medium text-emerald-600">
            Awaiting billing resolution
          </div>
        </div>

        <div className="card border-l-4 border-purple-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(stats?.todayRevenue || 0)}</p>
            </div>
            <div className="p-2.5 bg-purple-55 rounded-xl">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Total invoice value paid today
          </div>
        </div>
      </div>

      {/* Quick Action Panel */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row gap-6 justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-indigo-950">Reception Quick Actions</h3>
          <p className="text-sm text-indigo-800/80">Register new patients, record details, book clinic visits, or configure billing invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link href="/dashboard/patients/new" className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all duration-155 hover:shadow-indigo-100 hover:scale-[1.01]">
            <UserPlus className="w-4 h-4" />
            Register Patient
          </Link>
          <Link href="/dashboard/appointments/new" className="btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all duration-155 hover:shadow-purple-100 hover:scale-[1.01]">
            <Plus className="w-4 h-4" />
            Book Appointment
          </Link>
          <Link href="/dashboard/billing" className="btn bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all">
            <CreditCard className="w-4 h-4" />
            Billing Center
          </Link>
        </div>
      </div>

      {/* Today's Schedule & Patient Queue */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Patient Queue & Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage daily queue check-ins and invoice payments for clinic doctors.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient/doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 text-xs py-1.5 w-full sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input appearance-none text-xs py-1.5 w-full sm:w-40"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">Checked-In / In-Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          {filteredSchedule.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-slate-700 font-semibold text-sm">No Appointments Found</h4>
              <p className="text-slate-400 text-xs mt-1">No appointments match the selected search or status criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Visit Status</th>
                  <th className="py-3 px-4">Invoice / Billing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredSchedule.map((appt: any) => {
                  const initial = getInitials(appt.patient.user.firstName, appt.patient.user.lastName || '');
                  const apptTime = new Date(appt.scheduledAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Scheduled Time */}
                      <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-indigo-600">
                          <Clock className="w-3.5 h-3.5" />
                          {apptTime}
                        </span>
                      </td>

                      {/* Patient Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <Link href={`/dashboard/patients`} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                              {appt.patient.user.firstName} {appt.patient.user.lastName}
                            </Link>
                            <p className="text-[10px] text-slate-400 mt-0.5">{appt.patient.patientCode}</p>
                          </div>
                        </div>
                      </td>

                      {/* Doctor Info */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">
                          Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-4 text-slate-600 max-w-[150px] truncate">
                        {appt.reason || 'General Consultation'}
                      </td>

                      {/* Visit Status Badge */}
                      <td className="py-4 px-4">
                        <span className={cn('badge', getStatusColor(appt.status))}>
                          {appt.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Invoice & Billing Details */}
                      <td className="py-4 px-4">
                        {appt.invoice ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={cn('badge text-[10px]', getStatusColor(appt.invoice.status))}>
                              {appt.invoice.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {formatCurrency(appt.invoice.total)}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateInvoice(appt.id, appt.patient.id)}
                            disabled={generateQuickInvoiceMutation.isPending}
                            className="text-indigo-600 font-semibold hover:underline text-[11px] flex items-center gap-1"
                          >
                            Generate Bill
                          </button>
                        )}
                      </td>

                      {/* Queue & Billing Control Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Checked In Action */}
                          {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') && (
                            <button
                              onClick={() => handleCheckIn(appt.id)}
                              disabled={updateAppointmentMutation.isPending}
                              className="btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1 px-2.5 font-bold rounded-lg text-[10px] transition-all"
                            >
                              Check In
                            </button>
                          )}

                          {/* Completed Action */}
                          {appt.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleMarkCompleted(appt.id)}
                              disabled={updateAppointmentMutation.isPending}
                              className="btn bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1 px-2.5 font-bold rounded-lg text-[10px] transition-all"
                            >
                              Check Out
                            </button>
                          )}

                          {/* Collect Invoice Payment */}
                          {appt.invoice && appt.invoice.status === 'PENDING' && (
                            <button
                              onClick={() => handleCollectPayment(appt.invoice.id)}
                              disabled={collectPaymentMutation.isPending}
                              className="btn bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-1 px-2.5 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all"
                            >
                              <DollarSign className="w-3 h-3" />
                              Collect
                            </button>
                          )}

                          {/* Cancel Action */}
                          {['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(appt.status) && (
                            <button
                              onClick={() => handleCancel(appt.id)}
                              disabled={updateAppointmentMutation.isPending}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Cancel Appointment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
