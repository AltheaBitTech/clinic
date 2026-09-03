import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type AppointmentConfirmationWhatsapp = {
  recipientUserId: string;
  recipientPhone?: string | null;
  patientName: string;
  doctorName: string;
  hospitalName?: string;
  scheduledAt: Date;
  appointmentId?: string;
};

export type AppointmentCancellationWhatsapp = AppointmentConfirmationWhatsapp & {
  reason?: string;
};

export type AppointmentRescheduleWhatsapp = AppointmentConfirmationWhatsapp & {
  previousScheduledAt?: Date;
};

export type AppointmentReminderWhatsapp = AppointmentConfirmationWhatsapp;

export type MedicineReminderWhatsapp = {
  recipientUserId: string;
  recipientPhone?: string | null;
  patientName: string;
  medicineName: string;
  dosage?: string;
};

type TemplateComponent = Record<string, unknown>;

/**
 * Sends WhatsApp Business Platform (Meta Cloud API) messages from a single
 * platform-owned number shared across all tenants. Mirrors EmailService's
 * shape: typed payload-object methods, best-effort (never throws to callers).
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async sendAppointmentConfirmationWhatsapp(
    payload: AppointmentConfirmationWhatsapp,
  ) {
    await this.sendTemplate({
      recipientUserId: payload.recipientUserId,
      recipientPhone: payload.recipientPhone,
      templateName: 'appointment_confirmed',
      bodyParams: [
        payload.patientName,
        payload.doctorName,
        payload.hospitalName || 'the clinic',
        formatDateTime(payload.scheduledAt),
      ],
      metadata: { appointmentId: payload.appointmentId },
    });
  }

  async sendAppointmentCancellationWhatsapp(
    payload: AppointmentCancellationWhatsapp,
  ) {
    await this.sendTemplate({
      recipientUserId: payload.recipientUserId,
      recipientPhone: payload.recipientPhone,
      templateName: 'appointment_cancelled',
      bodyParams: [
        payload.patientName,
        payload.doctorName,
        payload.hospitalName || 'the clinic',
        formatDateTime(payload.scheduledAt),
      ],
      metadata: { appointmentId: payload.appointmentId, reason: payload.reason },
    });
  }

  async sendAppointmentRescheduleWhatsapp(
    payload: AppointmentRescheduleWhatsapp,
  ) {
    await this.sendTemplate({
      recipientUserId: payload.recipientUserId,
      recipientPhone: payload.recipientPhone,
      templateName: 'appointment_rescheduled',
      bodyParams: [
        payload.patientName,
        payload.doctorName,
        payload.hospitalName || 'the clinic',
        payload.previousScheduledAt
          ? formatDateTime(payload.previousScheduledAt)
          : '-',
        formatDateTime(payload.scheduledAt),
      ],
      metadata: { appointmentId: payload.appointmentId },
    });
  }

  async sendAppointmentReminderWhatsapp(payload: AppointmentReminderWhatsapp) {
    await this.sendTemplate({
      recipientUserId: payload.recipientUserId,
      recipientPhone: payload.recipientPhone,
      templateName: 'appointment_reminder_24h',
      bodyParams: [
        payload.patientName,
        payload.doctorName,
        payload.hospitalName || 'the clinic',
        formatDateTime(payload.scheduledAt),
      ],
      metadata: { appointmentId: payload.appointmentId },
    });
  }

  async sendMedicineReminderWhatsapp(payload: MedicineReminderWhatsapp) {
    await this.sendTemplate({
      recipientUserId: payload.recipientUserId,
      recipientPhone: payload.recipientPhone,
      templateName: 'medicine_reminder',
      bodyParams: [
        payload.patientName,
        payload.medicineName,
        payload.dosage || '',
      ],
      metadata: {},
    });
  }

  /** Handles Meta's GET verification handshake for the webhook subscription. */
  verifyWebhookChallenge(
    mode: string | undefined,
    token: string | undefined,
    challenge: string | undefined,
  ): string {
    const expectedToken = this.config
      .get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
      ?.trim();
    if (mode !== 'subscribe' || !token || !expectedToken || token !== expectedToken) {
      throw new UnauthorizedException('Invalid webhook verify token');
    }
    return challenge || '';
  }

  /** Verifies signature and processes a Meta webhook POST (status + inbound message updates). */
  async processWebhookEvent(
    rawBody: Buffer | undefined,
    signature: string | undefined,
    parsedBody: any,
  ): Promise<{ received: true }> {
    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET')?.trim();
    if (!appSecret) {
      throw new ServiceUnavailableException(
        'WhatsApp is not configured (missing WHATSAPP_APP_SECRET)',
      );
    }

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    const valid =
      signatureBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(signatureBuf, expectedBuf);
    if (!valid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const changes = parsedBody?.entry?.flatMap((e: any) => e?.changes ?? []) ?? [];
    for (const change of changes) {
      const value = change?.value ?? {};
      for (const status of value.statuses ?? []) {
        await this.applyStatusUpdate(status);
      }
      for (const message of value.messages ?? []) {
        await this.applyInboundMessage(message);
      }
    }

    return { received: true };
  }

  private async applyStatusUpdate(status: any) {
    const waMessageId = status?.id;
    const rawStatus = String(status?.status || '').toUpperCase();
    const mapped = ['SENT', 'DELIVERED', 'READ', 'FAILED'].includes(rawStatus)
      ? rawStatus
      : undefined;
    if (!waMessageId || !mapped) return;

    try {
      await this.prisma.whatsappMessageLog.update({
        where: { waMessageId },
        data: { status: mapped as any },
      });
    } catch {
      // No matching log row (e.g. message sent before this deploy) — ignore.
    }
  }

  private async applyInboundMessage(message: any) {
    const body = String(message?.text?.body || '').trim().toUpperCase();
    if (body !== 'STOP' && body !== 'UNSUBSCRIBE') return;

    const fromPhone: string | undefined = message?.from;
    if (!fromPhone) return;

    const localDigits = fromPhone.slice(-10);
    await this.prisma.user
      .updateMany({
        where: { phone: localDigits },
        data: { whatsappOptIn: false },
      })
      .catch(() => undefined);
  }

  /** Converts a stored 10-digit local phone number to E.164 for the Graph API. */
  toE164(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) return null;
    const countryCode =
      this.config.get<string>('WHATSAPP_DEFAULT_COUNTRY_CODE')?.trim() ||
      '91';
    return `${countryCode}${digits}`;
  }

  private async sendTemplate(params: {
    recipientUserId: string;
    recipientPhone?: string | null;
    templateName: string;
    bodyParams: string[];
    metadata: Record<string, unknown>;
  }) {
    const { recipientUserId, recipientPhone, templateName, bodyParams, metadata } =
      params;

    if (!recipientPhone) {
      this.logger.warn(
        `WhatsApp send skipped (template=${templateName}, userId=${recipientUserId}): no phone on file`,
      );
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { whatsappOptIn: true },
    });
    if (!user?.whatsappOptIn) {
      return;
    }

    const toPhone = this.toE164(recipientPhone);
    if (!toPhone) {
      this.logger.warn(
        `WhatsApp send skipped (template=${templateName}, userId=${recipientUserId}): invalid phone`,
      );
      return;
    }

    const logRow = await this.prisma.whatsappMessageLog.create({
      data: {
        userId: recipientUserId,
        toPhone,
        templateName,
        metadata: metadata as any,
      },
    });

    try {
      const waMessageId = await this.callGraphApi(
        toPhone,
        templateName,
        bodyParams,
      );
      await this.prisma.whatsappMessageLog.update({
        where: { id: logRow.id },
        data: { status: 'SENT', waMessageId },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `WhatsApp send failed (template=${templateName}, userId=${recipientUserId}, error=${message})`,
      );
      await this.prisma.whatsappMessageLog.update({
        where: { id: logRow.id },
        data: { status: 'FAILED', errorMessage: message },
      });
    }
  }

  private async callGraphApi(
    toPhone: string,
    templateName: string,
    bodyParams: string[],
  ): Promise<string> {
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN')?.trim();
    const phoneNumberId = this.config
      .get<string>('WHATSAPP_PHONE_NUMBER_ID')
      ?.trim();
    const apiVersion =
      this.config.get<string>('WHATSAPP_API_VERSION')?.trim() || 'v21.0';

    if (!accessToken || !phoneNumberId) {
      throw new Error(
        'WhatsApp is not configured (missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)',
      );
    }

    const components: TemplateComponent[] = bodyParams.length
      ? [
          {
            type: 'body',
            parameters: bodyParams.map((text) => ({ type: 'text', text })),
          },
        ]
      : [];

    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components,
          },
        }),
      },
    );

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data?.error?.message || `Graph API request failed (status ${res.status})`,
      );
    }
    return data?.messages?.[0]?.id;
  }
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
