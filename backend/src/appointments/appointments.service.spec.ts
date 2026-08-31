/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentsService } from './appointments.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppointmentsService.create', () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const appointment = {
    id: 'appt_1',
    tenantId: 'tenant_1',
    patientId: 'patient_1',
    doctorId: 'doctor_1',
    patient: {
      userId: 'user_patient_1',
      user: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'patient@example.com',
        phone: null,
      },
    },
    doctor: {
      user: { firstName: 'Jane', lastName: 'Doe' },
    },
    tenant: { name: 'Arogyix Clinic' },
  };

  let prisma: {
    patient: { findUnique: jest.Mock };
    appointment: { create: jest.Mock };
    patientTimeline: { create: jest.Mock };
    notification: { create: jest.Mock };
  };
  let send: jest.Mock;
  let createResendClient: jest.SpyInstance;
  let configValues: Record<string, string | undefined>;
  let emailService: EmailService;
  let service: AppointmentsService;

  beforeEach(() => {
    prisma = {
      patient: { findUnique: jest.fn() },
      appointment: { create: jest.fn().mockResolvedValue(appointment) },
      patientTimeline: { create: jest.fn().mockResolvedValue({}) },
      notification: { create: jest.fn().mockResolvedValue({}) },
    };
    configValues = {
      RESEND_API_KEY: 're_test_secret_must_never_appear_in_logs',
      RESEND_FROM_EMAIL: 'Arogyix <noreply@example.com>',
    };
    send = jest
      .fn()
      .mockResolvedValue({ data: { id: 'email_123' }, error: null });
    emailService = new EmailService({
      get: (key: string) => configValues[key],
    } as ConfigService);
    createResendClient = jest
      .spyOn(emailService, 'createResendClient')
      .mockReturnValue({
        emails: { send },
      } as never);

    service = new AppointmentsService(
      prisma as unknown as PrismaService,
      emailService,
    );
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const dto = {
    patientId: 'patient_1',
    doctorId: 'doctor_1',
    scheduledAt: future,
  };

  const create = () =>
    service.create({ role: 'RECEPTIONIST', tenantId: 'tenant_1' }, dto);

  it('A. existing appointment creation still succeeds and omits tenant from response', async () => {
    const result = await create();

    expect(result.id).toBe('appt_1');
    expect(result).not.toHaveProperty('tenant');
    expect(prisma.appointment.create).toHaveBeenCalledTimes(1);
    expect(prisma.patientTimeline.create).toHaveBeenCalledTimes(1);
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it('B. confirmation email includes patient, doctor, hospital, date/time', async () => {
    await create();

    expect(send).toHaveBeenCalledTimes(1);
    const payload = send.mock.calls[0][0] as {
      html: string;
      text: string;
    };
    expect(payload.html).toContain('Ada Lovelace');
    expect(payload.html).toContain('Dr. Jane Doe');
    expect(payload.html).toContain('Arogyix Clinic');
    expect(payload.text).toMatch(/Date and time:/);
  });

  it('C. missing patient email → appointment succeeds and Resend is skipped', async () => {
    prisma.appointment.create.mockResolvedValue({
      ...appointment,
      patient: {
        ...appointment.patient,
        user: { ...appointment.patient.user, email: '' },
      },
    });

    const result = await create();

    expect(result.id).toBe('appt_1');
    expect(send).not.toHaveBeenCalled();
    expect(createResendClient).not.toHaveBeenCalled();
  });

  it('G. Resend API failure → appointment succeeds', async () => {
    send.mockRejectedValue(new Error('Resend 500'));

    const result = await create();

    expect(result.id).toBe('appt_1');
    expect(result).not.toHaveProperty('tenant');
  });

  it('H. existing appointment/database failure is not converted into success', async () => {
    const dbError = new Error('Unique constraint failed');
    prisma.appointment.create.mockRejectedValue(dbError);

    await expect(create()).rejects.toBe(dbError);
    expect(send).not.toHaveBeenCalled();
  });

  it('existing past-date validation still rejects before persist', async () => {
    await expect(
      service.create(
        { role: 'RECEPTIONIST', tenantId: 'tenant_1' },
        { ...dto, scheduledAt: new Date(Date.now() - 60_000).toISOString() },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('existing patient-profile lookup failure still rejects', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ role: 'PATIENT', id: 'user_missing' }, dto),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});
