/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const API_KEY = 're_test_secret_must_never_appear_in_logs';
  const FROM = 'Arogyix <noreply@example.com>';
  const scheduledAt = new Date('2026-09-01T10:30:00.000Z');

  let configValues: Record<string, string | undefined>;
  let send: jest.Mock;
  let createResendClient: jest.SpyInstance;
  let service: EmailService;
  let logSpy: jest.SpiedFunction<Logger['log']>;
  let warnSpy: jest.SpiedFunction<Logger['warn']>;
  let errorSpy: jest.SpiedFunction<Logger['error']>;

  beforeEach(() => {
    configValues = {
      RESEND_API_KEY: API_KEY,
      RESEND_FROM_EMAIL: FROM,
    };
    send = jest
      .fn()
      .mockResolvedValue({ data: { id: 'email_123' }, error: null });

    const config = {
      get: (key: string) => configValues[key],
    } as ConfigService;

    service = new EmailService(config);
    createResendClient = jest
      .spyOn(service, 'createResendClient')
      .mockReturnValue({
        emails: { send },
      } as never);

    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const allLogOutput = () =>
    [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
      .flat()
      .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
      .join('\n');

  describe('sendAppointmentConfirmation', () => {
    const baseParams = {
      recipientEmail: 'patient@example.com',
      patientName: 'Ada Lovelace',
      doctorName: 'Dr. Jane Doe',
      hospitalName: 'Arogyix Clinic',
      scheduledAt,
      appointmentId: 'appt_1',
    };

    it('includes patient, doctor, hospital, and date/time', async () => {
      await service.sendAppointmentConfirmation(baseParams);

      expect(send).toHaveBeenCalledTimes(1);
      const payload = send.mock.calls[0][0] as {
        subject: string;
        html: string;
        text: string;
      };
      expect(payload.subject).toBe('Appointment Confirmed');
      expect(payload.html).toContain('Ada Lovelace');
      expect(payload.html).toContain('Dr. Jane Doe');
      expect(payload.html).toContain('Arogyix Clinic');
      expect(payload.text).toContain('Ada Lovelace');
      expect(payload.text).toContain('Dr. Jane Doe');
      expect(payload.text).toContain('Arogyix Clinic');
      expect(payload.text).toMatch(/Date and time:/);
      expect(allLogOutput()).toContain('accepted by Resend');
      expect(allLogOutput()).not.toContain('delivered');
    });

    it('skips invalid/missing/OTP emails and missing config without throwing', async () => {
      await service.sendAppointmentConfirmation({
        ...baseParams,
        recipientEmail: '',
      });
      await service.sendAppointmentConfirmation({
        ...baseParams,
        recipientEmail: 'not-an-email',
      });
      await service.sendAppointmentConfirmation({
        ...baseParams,
        recipientEmail: '919999999999@otp.Arogyix.health',
      });
      configValues.RESEND_API_KEY = undefined;
      await service.sendAppointmentConfirmation(baseParams);
      configValues.RESEND_API_KEY = API_KEY;
      configValues.RESEND_FROM_EMAIL = '';
      await service.sendAppointmentConfirmation(baseParams);

      expect(send).not.toHaveBeenCalled();
      expect(createResendClient).not.toHaveBeenCalled();
    });

    it('Resend failure does not throw', async () => {
      send.mockRejectedValue(new Error('Resend unavailable'));
      await expect(
        service.sendAppointmentConfirmation(baseParams),
      ).resolves.toBeUndefined();
      expect(allLogOutput()).not.toContain(API_KEY);
    });
  });

  describe('sendRegistrationWelcome', () => {
    const cases: Array<{ role: string; phrase: string }> = [
      { role: 'PATIENT', phrase: 'patient account' },
      { role: 'DOCTOR', phrase: 'doctor account' },
      { role: 'RECEPTIONIST', phrase: 'receptionist account' },
      { role: 'HOSPITAL_ADMIN', phrase: 'hospital administrator account' },
      { role: 'PHARMACY', phrase: 'pharmacy account' },
    ];

    it.each(cases)(
      'sends role-specific wording for $role',
      async ({ role, phrase }) => {
        await service.sendRegistrationWelcome({
          recipientEmail: 'user@example.com',
          userName: 'Test User',
          role,
          hospitalName: 'Arogyix Clinic',
        });

        expect(send).toHaveBeenCalledTimes(1);
        const payload = send.mock.calls[0][0] as {
          subject: string;
          html: string;
          text: string;
        };
        expect(payload.subject).toBe('Welcome to Arogyix');
        expect(payload.html).toContain('Test User');
        expect(payload.html).toContain(phrase);
        expect(payload.html).toContain('Arogyix Clinic');
        expect(payload.text).toContain(
          `Welcome to Arogyix. Your ${phrase} has been successfully registered.`,
        );
      },
    );

    it('skips invalid email and missing config without throwing', async () => {
      await service.sendRegistrationWelcome({
        recipientEmail: 'bad',
        userName: 'X',
        role: 'PATIENT',
      });
      configValues.RESEND_API_KEY = undefined;
      await service.sendRegistrationWelcome({
        recipientEmail: 'user@example.com',
        userName: 'X',
        role: 'DOCTOR',
      });
      expect(send).not.toHaveBeenCalled();
    });

    it('Resend API failure does not throw', async () => {
      send.mockResolvedValue({
        data: null,
        error: { message: 'Invalid from', name: 'validation_error' },
      });
      await expect(
        service.sendRegistrationWelcome({
          recipientEmail: 'user@example.com',
          userName: 'X',
          role: 'PATIENT',
        }),
      ).resolves.toBeUndefined();
      expect(allLogOutput()).toContain('was not accepted by Resend');
      expect(allLogOutput()).not.toContain(API_KEY);
    });

    it('escapes HTML in names', async () => {
      await service.sendRegistrationWelcome({
        recipientEmail: 'user@example.com',
        userName: '<script>alert(1)</script>Ada',
        role: 'PATIENT',
        hospitalName: '<b>Clinic</b>',
      });
      const payload = send.mock.calls[0][0] as { html: string };
      expect(payload.html).not.toContain('<script>');
      expect(payload.html).not.toContain('<b>Clinic</b>');
      expect(payload.html).toContain('Ada');
    });
  });

  describe('sendEmailVerificationOtp', () => {
    const baseParams = {
      recipientEmail: 'newpatient@example.com',
      userName: 'New Patient',
      otp: '123456',
      expiresInMinutes: 10,
    };

    it('sends HTML and text with name, OTP, expiry, and Arogyix branding', async () => {
      await service.sendEmailVerificationOtp(baseParams);

      expect(send).toHaveBeenCalledTimes(1);
      const payload = send.mock.calls[0][0] as {
        subject: string;
        html: string;
        text: string;
      };
      expect(payload.subject).toContain('Arogyix');
      expect(payload.html).toContain('New Patient');
      expect(payload.html).toContain('123456');
      expect(payload.html).toContain('10 minutes');
      expect(payload.html).toContain('Arogyix');
      expect(payload.text).toContain('New Patient');
      expect(payload.text).toContain('123456');
      expect(payload.text).toContain('10 minutes');
      expect(payload.html).not.toContain('password');
      expect(payload.text).not.toMatch(/password|accessToken|refreshToken/i);
    });

    it('throws when Resend is not configured', async () => {
      configValues.RESEND_API_KEY = undefined;
      await expect(
        service.sendEmailVerificationOtp(baseParams),
      ).rejects.toThrow('Email delivery is not configured');
      expect(send).not.toHaveBeenCalled();
    });

    it('throws when Resend rejects the message', async () => {
      send.mockResolvedValue({
        data: null,
        error: { message: 'Invalid from', name: 'validation_error' },
      });
      await expect(
        service.sendEmailVerificationOtp(baseParams),
      ).rejects.toThrow('Email was not accepted for delivery');
    });

    it('throws when Resend request fails', async () => {
      send.mockRejectedValue(new Error('Resend unavailable'));
      await expect(
        service.sendEmailVerificationOtp(baseParams),
      ).rejects.toThrow('Resend unavailable');
    });
  });
});
