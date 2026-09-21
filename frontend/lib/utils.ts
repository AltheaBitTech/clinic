import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone.trim());
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGstin(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

const LICENSE_NO_REGEX = /^[A-Za-z0-9/-]{4,30}$/;

export function isValidLicenseNo(licenseNo: string): boolean {
  return LICENSE_NO_REGEX.test(licenseNo.trim());
}

export const PERSON_NAME_REGEX = /^\p{L}+(?:[\s'-]\p{L}+)*$/u;
export const PERSON_NAME_ERROR =
  'must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes';

export function isValidPersonName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50 && PERSON_NAME_REGEX.test(trimmed);
}

/** Returns an error message for a required name field, or undefined if valid. */
export function getNameError(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (!isValidPersonName(trimmed)) return `${label} ${PERSON_NAME_ERROR}`;
  return undefined;
}

/** Strips numeric digits from free-text fields (e.g. reason/notes) so only text can be entered. */
export function stripDigits(value: string): string {
  return value.replace(/[0-9]/g, '');
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

/**
 * Appointments left SCHEDULED/CONFIRMED past their scheduled time were never
 * checked in or resolved by staff — nothing in the backend auto-transitions
 * them, so treat them as NO_SHOW for display purposes only.
 */
export function getEffectiveAppointmentStatus(status: string, scheduledAt: string | Date) {
  if ((status === 'SCHEDULED' || status === 'CONFIRMED') && new Date(scheduledAt).getTime() < Date.now()) {
    return 'NO_SHOW';
  }
  return status;
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    CONFIRMED: 'bg-cyan-100 text-cyan-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
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
