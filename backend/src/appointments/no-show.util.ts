// An appointment is a no-show once it's explicitly marked NO_SHOW, or once
// its scheduled time has passed without the patient being checked in.
// Mirrors getEffectiveAppointmentStatus() in frontend/lib/utils.ts — keep
// the two in sync.
export function isNoShowAppointment(appointment: {
  status: string;
  scheduledAt: Date;
}): boolean {
  if (appointment.status === 'NO_SHOW') return true;
  return (
    (appointment.status === 'SCHEDULED' ||
      appointment.status === 'CONFIRMED') &&
    appointment.scheduledAt.getTime() < Date.now()
  );
}

export const NO_SHOW_LOCKED_MESSAGE =
  'This appointment is a no-show and can no longer be changed. Please book a new appointment.';
