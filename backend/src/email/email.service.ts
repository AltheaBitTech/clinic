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
}
