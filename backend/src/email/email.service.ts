import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type AppointmentConfirmationEmail = {
  recipientEmail: string;
  patientName: string;
  doctorName: string;
  hospitalName?: string;
  scheduledAt: Date;
  appointmentId?: string;
};

export type RegistrationWelcomeEmail = {
  recipientEmail: string;
  userName: string;
  role: string;
  hospitalName?: string;
};

export type EmailVerificationOtpEmail = {
  recipientEmail: string;
  userName?: string;
  otp: string;
  expiresInMinutes: number;
};

export type AppointmentPatientUpdateEmail = {
  recipientEmail: string;
  patientName: string;
  doctorName: string;
  hospitalName?: string;
  scheduledAt: Date;
  previousScheduledAt?: Date;
  appointmentId?: string;
  reason?: string;
};

export type AppointmentDoctorEmail = {
  recipientEmail: string;
  doctorName: string;
  patientName: string;
  hospitalName?: string;
  scheduledAt: Date;
  previousScheduledAt?: Date;
  appointmentId?: string;
  reason?: string;
};

export type PrescriptionAvailableEmail = {
  recipientEmail: string;
  patientName: string;
  doctorName: string;
  hospitalName?: string;
  diagnosis?: string;
  medicineCount: number;
  prescriptionId?: string;
};

export type ReportAvailableEmail = {
  recipientEmail: string;
  patientName: string;
  reportTitle: string;
  reportType?: string;
  hospitalName?: string;
  reportId?: string;
};

export type InvoiceCreatedEmail = {
  recipientEmail: string;
  patientName: string;
  invoiceNo: string;
  amount: number;
  hospitalName?: string;
  invoiceId?: string;
};

export type PaymentReceivedEmail = InvoiceCreatedEmail & { paidAt?: Date };

export type SubscriptionStatusEmail = {
  recipientEmail: string;
  adminName?: string;
  hospitalName: string;
  planName?: string;
  periodEnd?: Date;
};

export type TenantRequestSubmittedEmail = {
  recipientEmail: string;
  applicantName: string;
  hospitalName: string;
  type: string;
};

export type TenantRequestRejectedEmail = {
  recipientEmail: string;
  applicantName: string;
  hospitalName: string;
};

export type StaffInviteEmail = {
  recipientEmail: string;
  hospitalName: string;
  role: string;
  inviteUrl: string;
};

export type AccountStatusEmail = {
  recipientEmail: string;
  userName: string;
  isActive: boolean;
};

export type DoctorProfileCreatedEmail = {
  recipientEmail: string;
  doctorName: string;
  hospitalName?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EMAIL_SUFFIX = '@otp.arogyix.health';

const ROLE_LABELS: Record<string, string> = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  HOSPITAL_ADMIN: 'hospital administrator',
  PHARMACY: 'pharmacy',
  SUPER_ADMIN: 'platform administrator',
};

const ROLE_NEXT_STEPS: Record<string, string> = {
  PATIENT:
    'You can sign in to view appointments, prescriptions, and your care timeline.',
  DOCTOR:
    'You can sign in to your account. Your hospital administrator may still need to complete your doctor profile before patients can book you.',
  RECEPTIONIST:
    'You can sign in to manage appointments and front-desk operations.',
  HOSPITAL_ADMIN:
    'You can sign in to configure your hospital, departments, and staff invites.',
  PHARMACY: 'You can sign in to manage your pharmacy listing and operations.',
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendAppointmentConfirmation(
    params: AppointmentConfirmationEmail,
  ): Promise<void> {
    const appointmentId = params.appointmentId ?? 'unknown';
    const patientName = this.toSafePlainText(params.patientName) || 'Patient';
    const doctorName = this.toSafePlainText(params.doctorName) || 'your doctor';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const when = this.formatScheduledAt(params.scheduledAt);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Appointment Confirmed',
      context: `appointment confirmation (appointmentId=${appointmentId})`,
      html: `<p>Hello ${this.escapeHtml(patientName)},</p>
<p>Your appointment at <strong>${this.escapeHtml(hospitalName)}</strong> has been confirmed.</p>
<ul>
  <li><strong>Doctor:</strong> ${this.escapeHtml(doctorName)}</li>
  <li><strong>Clinic:</strong> ${this.escapeHtml(hospitalName)}</li>
  <li><strong>Date and time:</strong> ${this.escapeHtml(when)}</li>
</ul>
<p>If you need to make a change, please contact the clinic.</p>`,
      text: `Hello ${patientName},

Your appointment at ${hospitalName} has been confirmed.

Doctor: ${doctorName}
Clinic: ${hospitalName}
Date and time: ${when}

If you need to make a change, please contact the clinic.`,
    });
  }

  async sendRegistrationWelcome(
    params: RegistrationWelcomeEmail,
  ): Promise<void> {
    const userName = this.toSafePlainText(params.userName) || 'there';
    const roleKey = String(params.role || '').toUpperCase();
    const roleLabel = ROLE_LABELS[roleKey] || 'user';
    const hospitalName = this.toSafePlainText(params.hospitalName);
    const nextStep = ROLE_NEXT_STEPS[roleKey];

    const successLine = `Welcome to Arogyix. Your ${roleLabel} account has been successfully registered.`;
    const hospitalLine = hospitalName
      ? `Hospital / clinic: ${hospitalName}`
      : null;

    const htmlParts = [
      `<p>Hello ${this.escapeHtml(userName)},</p>`,
      `<p>${this.escapeHtml(successLine)}</p>`,
    ];
    if (hospitalLine) {
      htmlParts.push(`<p>${this.escapeHtml(hospitalLine)}</p>`);
    }
    if (nextStep) {
      htmlParts.push(`<p>${this.escapeHtml(nextStep)}</p>`);
    }
    htmlParts.push(`<p>— The Arogyix Team</p>`);

    const textParts = [
      `Hello ${userName},`,
      '',
      successLine,
      hospitalLine,
      nextStep,
      '',
      '— The Arogyix Team',
    ].filter((line): line is string => line != null);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Welcome to Arogyix',
      context: `registration welcome (role=${roleKey || 'unknown'})`,
      html: htmlParts.join('\n'),
      text: textParts.join('\n'),
    });
  }

  async sendEmailVerificationOtp(
    params: EmailVerificationOtpEmail,
  ): Promise<void> {
    const userName = this.toSafePlainText(params.userName) || 'there';
    const otp = String(params.otp || '').trim();
    const expiresInMinutes = params.expiresInMinutes;

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Your Arogyix email verification code',
      context: 'registration email verification OTP',
      throwOnFailure: true,
      html: `<p>Hello ${this.escapeHtml(userName)},</p>
<p>Use this code to verify your email for your Arogyix account:</p>
<p style="font-size:24px;letter-spacing:4px;font-weight:bold">${this.escapeHtml(otp)}</p>
<p>This code expires in ${this.escapeHtml(String(expiresInMinutes))} minutes. Enter it on the registration page to continue.</p>
<p>If you did not request this code, you can ignore this email.</p>
<p>— The Arogyix Team</p>`,
      text: `Hello ${userName},

Use this code to verify your email for your Arogyix account:

${otp}

This code expires in ${expiresInMinutes} minutes. Enter it on the registration page to continue.

If you did not request this code, you can ignore this email.

— The Arogyix Team`,
    });
  }

  async sendAppointmentCancellation(
    params: AppointmentPatientUpdateEmail,
  ): Promise<void> {
    const appointmentId = params.appointmentId ?? 'unknown';
    const patientName = this.toSafePlainText(params.patientName) || 'Patient';
    const doctorName = this.toSafePlainText(params.doctorName) || 'your doctor';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const when = this.formatScheduledAt(params.scheduledAt);
    const reason = this.toSafePlainText(params.reason);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Appointment Cancelled',
      context: `appointment cancellation (appointmentId=${appointmentId})`,
      html: `<p>Hello ${this.escapeHtml(patientName)},</p>
<p>Your appointment with <strong>${this.escapeHtml(doctorName)}</strong> at <strong>${this.escapeHtml(hospitalName)}</strong> scheduled for ${this.escapeHtml(when)} has been cancelled.</p>
${reason ? `<p><strong>Reason:</strong> ${this.escapeHtml(reason)}</p>` : ''}
<p>Please contact the clinic if you'd like to book a new appointment.</p>`,
      text: `Hello ${patientName},

Your appointment with ${doctorName} at ${hospitalName} scheduled for ${when} has been cancelled.
${reason ? `\nReason: ${reason}\n` : ''}
Please contact the clinic if you'd like to book a new appointment.`,
    });
  }

  async sendAppointmentReschedule(
    params: AppointmentPatientUpdateEmail,
  ): Promise<void> {
    const appointmentId = params.appointmentId ?? 'unknown';
    const patientName = this.toSafePlainText(params.patientName) || 'Patient';
    const doctorName = this.toSafePlainText(params.doctorName) || 'your doctor';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const when = this.formatScheduledAt(params.scheduledAt);
    const previousWhen = params.previousScheduledAt
      ? this.formatScheduledAt(params.previousScheduledAt)
      : null;

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Appointment Rescheduled',
      context: `appointment reschedule (appointmentId=${appointmentId})`,
      html: `<p>Hello ${this.escapeHtml(patientName)},</p>
<p>Your appointment with <strong>${this.escapeHtml(doctorName)}</strong> at <strong>${this.escapeHtml(hospitalName)}</strong> has been rescheduled.</p>
<ul>
  ${previousWhen ? `<li><strong>Previous time:</strong> ${this.escapeHtml(previousWhen)}</li>` : ''}
  <li><strong>New time:</strong> ${this.escapeHtml(when)}</li>
</ul>
<p>If this doesn't work for you, please contact the clinic.</p>`,
      text: `Hello ${patientName},

Your appointment with ${doctorName} at ${hospitalName} has been rescheduled.
${previousWhen ? `Previous time: ${previousWhen}\n` : ''}New time: ${when}

If this doesn't work for you, please contact the clinic.`,
    });
  }

  async sendDoctorAppointmentBooked(
    params: AppointmentDoctorEmail,
  ): Promise<void> {
    const appointmentId = params.appointmentId ?? 'unknown';
    const doctorName = this.toSafePlainText(params.doctorName) || 'Doctor';
    const patientName = this.toSafePlainText(params.patientName) || 'a patient';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const when = this.formatScheduledAt(params.scheduledAt);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'New Appointment Booked',
      context: `doctor appointment booked (appointmentId=${appointmentId})`,
      html: `<p>Hello ${this.escapeHtml(doctorName)},</p>
<p>A new appointment has been booked with you at <strong>${this.escapeHtml(hospitalName)}</strong>.</p>
<ul>
  <li><strong>Patient:</strong> ${this.escapeHtml(patientName)}</li>
  <li><strong>Date and time:</strong> ${this.escapeHtml(when)}</li>
</ul>`,
      text: `Hello ${doctorName},

A new appointment has been booked with you at ${hospitalName}.

Patient: ${patientName}
Date and time: ${when}`,
    });
  }

  async sendDoctorAppointmentCancelled(
    params: AppointmentDoctorEmail,
  ): Promise<void> {
    const appointmentId = params.appointmentId ?? 'unknown';
    const doctorName = this.toSafePlainText(params.doctorName) || 'Doctor';
    const patientName = this.toSafePlainText(params.patientName) || 'a patient';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const when = this.formatScheduledAt(params.scheduledAt);
    const reason = this.toSafePlainText(params.reason);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Appointment Cancelled',
      context: `doctor appointment cancelled (appointmentId=${appointmentId})`,
      html: `<p>Hello ${this.escapeHtml(doctorName)},</p>
<p>Your appointment with <strong>${this.escapeHtml(patientName)}</strong> at <strong>${this.escapeHtml(hospitalName)}</strong> scheduled for ${this.escapeHtml(when)} has been cancelled.</p>
${reason ? `<p><strong>Reason:</strong> ${this.escapeHtml(reason)}</p>` : ''}`,
      text: `Hello ${doctorName},

Your appointment with ${patientName} at ${hospitalName} scheduled for ${when} has been cancelled.
${reason ? `\nReason: ${reason}` : ''}`,
    });
  }

  async sendDoctorAppointmentRescheduled(
    params: AppointmentDoctorEmail,
  ): Promise<void> {
    const appointmentId = params.appointmentId ?? 'unknown';
    const doctorName = this.toSafePlainText(params.doctorName) || 'Doctor';
    const patientName = this.toSafePlainText(params.patientName) || 'a patient';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const when = this.formatScheduledAt(params.scheduledAt);
    const previousWhen = params.previousScheduledAt
      ? this.formatScheduledAt(params.previousScheduledAt)
      : null;

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Appointment Rescheduled',
      context: `doctor appointment rescheduled (appointmentId=${appointmentId})`,
      html: `<p>Hello ${this.escapeHtml(doctorName)},</p>
<p>Your appointment with <strong>${this.escapeHtml(patientName)}</strong> at <strong>${this.escapeHtml(hospitalName)}</strong> has been rescheduled.</p>
<ul>
  ${previousWhen ? `<li><strong>Previous time:</strong> ${this.escapeHtml(previousWhen)}</li>` : ''}
  <li><strong>New time:</strong> ${this.escapeHtml(when)}</li>
</ul>`,
      text: `Hello ${doctorName},

Your appointment with ${patientName} at ${hospitalName} has been rescheduled.
${previousWhen ? `Previous time: ${previousWhen}\n` : ''}New time: ${when}`,
    });
  }

  async sendPrescriptionAvailable(
    params: PrescriptionAvailableEmail,
  ): Promise<void> {
    const prescriptionId = params.prescriptionId ?? 'unknown';
    const patientName = this.toSafePlainText(params.patientName) || 'Patient';
    const doctorName = this.toSafePlainText(params.doctorName) || 'your doctor';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const diagnosis = this.toSafePlainText(params.diagnosis);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Your Prescription is Ready',
      context: `prescription available (prescriptionId=${prescriptionId})`,
      html: `<p>Hello ${this.escapeHtml(patientName)},</p>
<p><strong>${this.escapeHtml(doctorName)}</strong> at <strong>${this.escapeHtml(hospitalName)}</strong> has issued you a new prescription.</p>
<ul>
  ${diagnosis ? `<li><strong>Diagnosis:</strong> ${this.escapeHtml(diagnosis)}</li>` : ''}
  <li><strong>Medicines prescribed:</strong> ${params.medicineCount}</li>
</ul>
<p>Sign in to your Arogyix account to view and download the full prescription.</p>`,
      text: `Hello ${patientName},

${doctorName} at ${hospitalName} has issued you a new prescription.
${diagnosis ? `\nDiagnosis: ${diagnosis}` : ''}
Medicines prescribed: ${params.medicineCount}

Sign in to your Arogyix account to view and download the full prescription.`,
    });
  }

  async sendReportAvailable(params: ReportAvailableEmail): Promise<void> {
    const reportId = params.reportId ?? 'unknown';
    const patientName = this.toSafePlainText(params.patientName) || 'Patient';
    const reportTitle = this.toSafePlainText(params.reportTitle) || 'Report';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const reportType = this.toSafePlainText(params.reportType);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'New Report Available',
      context: `report available (reportId=${reportId})`,
      html: `<p>Hello ${this.escapeHtml(patientName)},</p>
<p>A new report is available for you from <strong>${this.escapeHtml(hospitalName)}</strong>.</p>
<ul>
  <li><strong>Report:</strong> ${this.escapeHtml(reportTitle)}</li>
  ${reportType ? `<li><strong>Type:</strong> ${this.escapeHtml(reportType)}</li>` : ''}
</ul>
<p>Sign in to your Arogyix account to view it.</p>`,
      text: `Hello ${patientName},

A new report is available for you from ${hospitalName}.

Report: ${reportTitle}
${reportType ? `Type: ${reportType}\n` : ''}
Sign in to your Arogyix account to view it.`,
    });
  }

  async sendInvoiceCreated(params: InvoiceCreatedEmail): Promise<void> {
    const invoiceId = params.invoiceId ?? 'unknown';
    const patientName = this.toSafePlainText(params.patientName) || 'Patient';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const amount = this.formatMoney(params.amount);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: `New Invoice ${params.invoiceNo}`,
      context: `invoice created (invoiceId=${invoiceId})`,
      html: `<p>Hello ${this.escapeHtml(patientName)},</p>
<p>A new invoice has been generated at <strong>${this.escapeHtml(hospitalName)}</strong>.</p>
<ul>
  <li><strong>Invoice No:</strong> ${this.escapeHtml(params.invoiceNo)}</li>
  <li><strong>Amount due:</strong> ${this.escapeHtml(amount)}</li>
</ul>`,
      text: `Hello ${patientName},

A new invoice has been generated at ${hospitalName}.

Invoice No: ${params.invoiceNo}
Amount due: ${amount}`,
    });
  }

  async sendPaymentReceived(params: PaymentReceivedEmail): Promise<void> {
    const invoiceId = params.invoiceId ?? 'unknown';
    const patientName = this.toSafePlainText(params.patientName) || 'Patient';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';
    const amount = this.formatMoney(params.amount);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Payment Received',
      context: `payment received (invoiceId=${invoiceId})`,
      html: `<p>Hello ${this.escapeHtml(patientName)},</p>
<p>We've received your payment at <strong>${this.escapeHtml(hospitalName)}</strong>. Thank you!</p>
<ul>
  <li><strong>Invoice No:</strong> ${this.escapeHtml(params.invoiceNo)}</li>
  <li><strong>Amount paid:</strong> ${this.escapeHtml(amount)}</li>
</ul>`,
      text: `Hello ${patientName},

We've received your payment at ${hospitalName}. Thank you!

Invoice No: ${params.invoiceNo}
Amount paid: ${amount}`,
    });
  }

  async sendSubscriptionActivated(
    params: SubscriptionStatusEmail,
  ): Promise<void> {
    const adminName = this.toSafePlainText(params.adminName) || 'there';
    const hospitalName = this.toSafePlainText(params.hospitalName);
    const planName = this.toSafePlainText(params.planName);
    const periodEnd = params.periodEnd
      ? this.formatScheduledAt(params.periodEnd)
      : null;

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Subscription Activated',
      context: `subscription activated (hospital=${hospitalName})`,
      html: `<p>Hello ${this.escapeHtml(adminName)},</p>
<p>Your Arogyix subscription for <strong>${this.escapeHtml(hospitalName)}</strong> is now active.</p>
<ul>
  ${planName ? `<li><strong>Plan:</strong> ${this.escapeHtml(planName)}</li>` : ''}
  ${periodEnd ? `<li><strong>Renews on:</strong> ${this.escapeHtml(periodEnd)}</li>` : ''}
</ul>`,
      text: `Hello ${adminName},

Your Arogyix subscription for ${hospitalName} is now active.
${planName ? `\nPlan: ${planName}` : ''}
${periodEnd ? `Renews on: ${periodEnd}` : ''}`,
    });
  }

  async sendSubscriptionPaymentFailed(
    params: SubscriptionStatusEmail,
  ): Promise<void> {
    const adminName = this.toSafePlainText(params.adminName) || 'there';
    const hospitalName = this.toSafePlainText(params.hospitalName);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Action Required: Subscription Payment Failed',
      context: `subscription payment failed (hospital=${hospitalName})`,
      html: `<p>Hello ${this.escapeHtml(adminName)},</p>
<p>We were unable to process the payment for your Arogyix subscription for <strong>${this.escapeHtml(hospitalName)}</strong>. Your service may be interrupted if this isn't resolved.</p>
<p>Please update your payment method or retry the payment as soon as possible to avoid any disruption.</p>`,
      text: `Hello ${adminName},

We were unable to process the payment for your Arogyix subscription for ${hospitalName}. Your service may be interrupted if this isn't resolved.

Please update your payment method or retry the payment as soon as possible to avoid any disruption.`,
    });
  }

  async sendSubscriptionCancelled(
    params: SubscriptionStatusEmail,
  ): Promise<void> {
    const adminName = this.toSafePlainText(params.adminName) || 'there';
    const hospitalName = this.toSafePlainText(params.hospitalName);
    const periodEnd = params.periodEnd
      ? this.formatScheduledAt(params.periodEnd)
      : null;

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Subscription Cancelled',
      context: `subscription cancelled (hospital=${hospitalName})`,
      html: `<p>Hello ${this.escapeHtml(adminName)},</p>
<p>Your Arogyix subscription for <strong>${this.escapeHtml(hospitalName)}</strong> has been cancelled.</p>
${periodEnd ? `<p>You'll continue to have access until <strong>${this.escapeHtml(periodEnd)}</strong>.</p>` : ''}`,
      text: `Hello ${adminName},

Your Arogyix subscription for ${hospitalName} has been cancelled.
${periodEnd ? `\nYou'll continue to have access until ${periodEnd}.` : ''}`,
    });
  }

  async sendTenantRequestSubmitted(
    params: TenantRequestSubmittedEmail,
  ): Promise<void> {
    const applicantName = this.toSafePlainText(params.applicantName);
    const hospitalName = this.toSafePlainText(params.hospitalName);
    const type = this.toSafePlainText(params.type) || 'HOSPITAL';

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'New Tenant Registration Request',
      context: `tenant request submitted (hospital=${hospitalName})`,
      html: `<p>Hello,</p>
<p>A new ${this.escapeHtml(type.toLowerCase())} registration request has been submitted and is awaiting review.</p>
<ul>
  <li><strong>Name:</strong> ${this.escapeHtml(hospitalName)}</li>
  <li><strong>Applicant:</strong> ${this.escapeHtml(applicantName)}</li>
</ul>
<p>Sign in to the super admin dashboard to approve or reject it.</p>`,
      text: `Hello,

A new ${type.toLowerCase()} registration request has been submitted and is awaiting review.

Name: ${hospitalName}
Applicant: ${applicantName}

Sign in to the super admin dashboard to approve or reject it.`,
    });
  }

  async sendTenantRequestRejected(
    params: TenantRequestRejectedEmail,
  ): Promise<void> {
    const applicantName = this.toSafePlainText(params.applicantName) || 'there';
    const hospitalName = this.toSafePlainText(params.hospitalName);

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Your Arogyix Registration Request',
      context: `tenant request rejected (hospital=${hospitalName})`,
      html: `<p>Hello ${this.escapeHtml(applicantName)},</p>
<p>Thank you for your interest in Arogyix. After review, we're unable to approve the registration request for <strong>${this.escapeHtml(hospitalName)}</strong> at this time.</p>
<p>If you have questions, please reply to this email or contact our support team.</p>`,
      text: `Hello ${applicantName},

Thank you for your interest in Arogyix. After review, we're unable to approve the registration request for ${hospitalName} at this time.

If you have questions, please reply to this email or contact our support team.`,
    });
  }

  async sendStaffInvite(params: StaffInviteEmail): Promise<void> {
    const hospitalName = this.toSafePlainText(params.hospitalName);
    const roleKey = String(params.role || '').toUpperCase();
    const roleLabel = ROLE_LABELS[roleKey] || 'staff member';

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: `You're invited to join ${hospitalName} on Arogyix`,
      context: `staff invite (hospital=${hospitalName}, role=${roleKey || 'unknown'})`,
      html: `<p>Hello,</p>
<p>You've been invited to join <strong>${this.escapeHtml(hospitalName)}</strong> on Arogyix as a ${this.escapeHtml(roleLabel)}.</p>
<p><a href="${this.escapeHtml(params.inviteUrl)}">Click here to accept the invite</a> and set up your account. This link expires in 7 days.</p>
<p>If you weren't expecting this invite, you can ignore this email.</p>`,
      text: `Hello,

You've been invited to join ${hospitalName} on Arogyix as a ${roleLabel}.

Accept your invite: ${params.inviteUrl}

This link expires in 7 days. If you weren't expecting this invite, you can ignore this email.`,
    });
  }

  async sendAccountStatusChanged(params: AccountStatusEmail): Promise<void> {
    const userName = this.toSafePlainText(params.userName) || 'there';
    const statusLine = params.isActive
      ? 'Your Arogyix account has been reactivated. You can sign in again.'
      : 'Your Arogyix account has been deactivated. Contact your hospital administrator if you believe this is a mistake.';

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: params.isActive ? 'Account Reactivated' : 'Account Deactivated',
      context: `account status changed (isActive=${params.isActive})`,
      html: `<p>Hello ${this.escapeHtml(userName)},</p>
<p>${this.escapeHtml(statusLine)}</p>`,
      text: `Hello ${userName},

${statusLine}`,
    });
  }

  async sendDoctorProfileCreated(
    params: DoctorProfileCreatedEmail,
  ): Promise<void> {
    const doctorName = this.toSafePlainText(params.doctorName) || 'there';
    const hospitalName =
      this.toSafePlainText(params.hospitalName) || 'your clinic';

    await this.dispatch({
      recipientEmail: params.recipientEmail,
      subject: 'Your Doctor Profile is Ready',
      context: `doctor profile created (hospital=${hospitalName})`,
      html: `<p>Hello Dr. ${this.escapeHtml(doctorName)},</p>
<p>Your doctor profile at <strong>${this.escapeHtml(hospitalName)}</strong> has been set up. Patients can now book appointments with you on Arogyix.</p>
<p>Sign in to your account to review and complete your profile details and availability.</p>`,
      text: `Hello Dr. ${doctorName},

Your doctor profile at ${hospitalName} has been set up. Patients can now book appointments with you on Arogyix.

Sign in to your account to review and complete your profile details and availability.`,
    });
  }

  createResendClient(apiKey: string): Resend {
    return new Resend(apiKey);
  }

  private async dispatch(params: {
    recipientEmail: string;
    subject: string;
    html: string;
    text: string;
    context: string;
    throwOnFailure?: boolean;
  }): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('RESEND_FROM_EMAIL')?.trim();

    if (!apiKey || !from) {
      this.logger.warn(`Skipping ${params.context}: Resend is not configured`);
      if (params.throwOnFailure) {
        throw new Error('Email delivery is not configured');
      }
      return;
    }

    const recipientEmail = params.recipientEmail?.trim() ?? '';
    if (!this.isDeliverableEmail(recipientEmail)) {
      this.logger.warn(
        `Skipping ${params.context}: missing or undeliverable recipient (recipient=${this.maskEmail(recipientEmail)})`,
      );
      if (params.throwOnFailure) {
        throw new Error('Recipient email is not deliverable');
      }
      return;
    }

    const payload = {
      from,
      to: [recipientEmail],
      subject: params.subject,
      html: params.html,
      text: params.text,
    };

    const resend = this.createResendClient(apiKey);

    try {
      const result = await resend.emails.send(payload);

      if (result.error) {
        this.logger.error(
          `${params.context} was not accepted by Resend (recipient=${this.maskEmail(recipientEmail)}, error=${result.error.message})`,
        );
        if (params.throwOnFailure) {
          throw new Error('Email was not accepted for delivery');
        }
        return;
      }

      this.logger.log(
        `${params.context} accepted by Resend (recipient=${this.maskEmail(recipientEmail)}, id=${result.data?.id ?? 'n/a'})`,
      );
    } catch (error) {
      if (params.throwOnFailure) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `${params.context} failed (recipient=${this.maskEmail(recipientEmail)}, error=${message})`,
      );
    }
  }

  private isDeliverableEmail(email: string): boolean {
    if (!email) return false;
    if (!EMAIL_PATTERN.test(email)) return false;
    if (email.toLowerCase().endsWith(OTP_EMAIL_SUFFIX)) return false;
    return true;
  }

  private maskEmail(email: string): string {
    if (!email) return '(empty)';
    const at = email.indexOf('@');
    if (at <= 0) return '***';
    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    const visible = local.slice(0, 1);
    return `${visible}***@${domain}`;
  }

  private toSafePlainText(value: string | undefined): string {
    if (!value) return '';
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatScheduledAt(scheduledAt: Date): string {
    const date =
      scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) return 'the scheduled time';
    return date.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  private formatMoney(value: number): string {
    return `Rs. ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
