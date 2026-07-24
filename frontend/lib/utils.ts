import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount));
}

export function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800',
    HOSPITAL_ADMIN: 'bg-blue-100 text-blue-800',
    DOCTOR: 'bg-green-100 text-green-800',
    RECEPTIONIST: 'bg-yellow-100 text-yellow-800',
    PATIENT: 'bg-gray-100 text-gray-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-indigo-100 text-indigo-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
