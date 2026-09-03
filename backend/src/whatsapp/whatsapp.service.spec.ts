import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WhatsappService', () => {
  let prisma: {
    user: { findUnique: jest.Mock; updateMany: jest.Mock };
    whatsappMessageLog: {
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let configValues: Record<string, string | undefined>;
  let fetchMock: jest.Mock;
  let service: WhatsappService;

  const basePayload = {
    recipientUserId: 'user_1',
    recipientPhone: '9876543210',
    patientName: 'Ada Lovelace',
    doctorName: 'Dr. Jane Doe',
    hospitalName: 'Arogyix Clinic',
    scheduledAt: new Date('2026-09-10T10:00:00Z'),
    appointmentId: 'appt_1',
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ whatsappOptIn: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      whatsappMessageLog: {
        create: jest.fn().mockResolvedValue({ id: 'log_1' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    configValues = {
      WHATSAPP_ACCESS_TOKEN: 'test_token',
      WHATSAPP_PHONE_NUMBER_ID: 'phone_number_id_123',
      WHATSAPP_API_VERSION: 'v21.0',
      WHATSAPP_DEFAULT_COUNTRY_CODE: '91',
    };
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.123' }] }),
    });
    (global as any).fetch = fetchMock;

    service = new WhatsappService(
      { get: (key: string) => configValues[key] } as ConfigService,
      prisma as unknown as PrismaService,
    );
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends an appointment confirmation template with normalized E.164 phone', async () => {
    await service.sendAppointmentConfirmationWhatsapp(basePayload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('phone_number_id_123/messages');
    const body = JSON.parse(options.body);
    expect(body.to).toBe('919876543210');
    expect(body.template.name).toBe('appointment_confirmed');
    expect(body.template.components[0].parameters[0].text).toBe('Ada Lovelace');

    expect(prisma.whatsappMessageLog.update).toHaveBeenCalledWith({
      where: { id: 'log_1' },
      data: { status: 'SENT', waMessageId: 'wamid.123' },
    });
  });

  it('skips sending when the user has not opted in', async () => {
    prisma.user.findUnique.mockResolvedValue({ whatsappOptIn: false });

    await service.sendAppointmentConfirmationWhatsapp(basePayload);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.whatsappMessageLog.create).not.toHaveBeenCalled();
  });

  it('skips sending when no phone number is on file', async () => {
    await service.sendAppointmentConfirmationWhatsapp({
      ...basePayload,
      recipientPhone: null,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('logs FAILED status without throwing when the Graph API errors', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid token' } }),
    });

    await expect(
      service.sendAppointmentConfirmationWhatsapp(basePayload),
    ).resolves.toBeUndefined();

    expect(prisma.whatsappMessageLog.update).toHaveBeenCalledWith({
      where: { id: 'log_1' },
      data: { status: 'FAILED', errorMessage: 'Invalid token' },
    });
  });

  it('logs FAILED status without throwing when access token/phone number id are missing', async () => {
    configValues.WHATSAPP_ACCESS_TOKEN = '';

    await service.sendAppointmentConfirmationWhatsapp(basePayload);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.whatsappMessageLog.update).toHaveBeenCalledWith({
      where: { id: 'log_1' },
      data: {
        status: 'FAILED',
        errorMessage: expect.stringContaining('not configured'),
      },
    });
  });

  describe('toE164', () => {
    it('prefixes a valid 10-digit number with the default country code', () => {
      expect(service.toE164('9876543210')).toBe('919876543210');
    });

    it('returns null for an invalid length', () => {
      expect(service.toE164('12345')).toBeNull();
    });
  });

  describe('verifyWebhookChallenge', () => {
    beforeEach(() => {
      configValues.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'verify_me';
    });

    it('returns the challenge when mode and token match', () => {
      expect(
        service.verifyWebhookChallenge('subscribe', 'verify_me', 'challenge123'),
      ).toBe('challenge123');
    });

    it('throws when the token does not match', () => {
      expect(() =>
        service.verifyWebhookChallenge('subscribe', 'wrong', 'challenge123'),
      ).toThrow();
    });
  });
});
