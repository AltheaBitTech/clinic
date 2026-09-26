import { NotFoundException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PharmacyPrescriptionsService } from '../pharmacy-prescriptions/pharmacy-prescriptions.service';

describe('PrescriptionsService.create — pharmacy routing', () => {
  const user = { id: 'user_doctor_1', role: 'DOCTOR', tenantId: 'tenant_1' };

  const dto = {
    patientId: 'patient_1',
    medicines: [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: null,
        reminderTimes: [],
      },
    ],
  } as any;

  const createdPrescription = {
    id: 'presc_1',
    doctorId: 'doctor_1',
    appointmentId: null,
    diagnosis: null,
    notes: null,
    medicines: dto.medicines,
    patient: {
      id: 'patient_1',
      user: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'patient@example.com',
        phone: null,
      },
    },
    doctor: {
      user: { firstName: 'Jane', lastName: 'Doe' },
      tenantId: 'tenant_1',
    },
  };

  let prisma: {
    doctor: { findUnique: jest.Mock; findFirst: jest.Mock };
    patient: { findFirst: jest.Mock };
    pharmacy: { findFirst: jest.Mock };
    prescription: { create: jest.Mock; update: jest.Mock };
    patientTimeline: { create: jest.Mock };
    medicineReminder: { createMany: jest.Mock };
    tenant: { findUnique: jest.Mock };
  };
  let pharmacyPrescriptionsService: {
    createFromHospitalPrescription: jest.Mock;
  };
  let service: PrescriptionsService;

  beforeEach(() => {
    prisma = {
      doctor: {
        findUnique: jest.fn().mockResolvedValue({ id: 'doctor_1' }),
        findFirst: jest.fn(),
      },
      patient: { findFirst: jest.fn().mockResolvedValue({ id: 'patient_1' }) },
      pharmacy: { findFirst: jest.fn() },
      prescription: {
        create: jest.fn().mockResolvedValue(createdPrescription),
        update: jest.fn().mockResolvedValue({}),
      },
      patientTimeline: { create: jest.fn().mockResolvedValue({}) },
      medicineReminder: { createMany: jest.fn().mockResolvedValue({}) },
      tenant: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    pharmacyPrescriptionsService = {
      createFromHospitalPrescription: jest.fn().mockResolvedValue({}),
    };
    service = new PrescriptionsService(
      prisma as unknown as PrismaService,
      {
        sendPrescriptionAvailable: jest.fn().mockResolvedValue(undefined),
      } as unknown as EmailService,
      pharmacyPrescriptionsService as unknown as PharmacyPrescriptionsService,
    );
  });

  it('A. creating without pharmacyId behaves as before and never routes to a pharmacy', async () => {
    await service.create(dto, user as any);

    expect(prisma.pharmacy.findFirst).not.toHaveBeenCalled();
    expect(prisma.prescription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pharmacyId: undefined }),
      }),
    );
    expect(
      pharmacyPrescriptionsService.createFromHospitalPrescription,
    ).not.toHaveBeenCalled();
  });

  it('B. creating with a valid same-tenant pharmacyId persists it and routes the prescription', async () => {
    prisma.pharmacy.findFirst.mockResolvedValue({ id: 'pharmacy_1' });

    await service.create({ ...dto, pharmacyId: 'pharmacy_1' }, user as any);

    expect(prisma.pharmacy.findFirst).toHaveBeenCalledWith({
      where: { id: 'pharmacy_1', tenantId: 'tenant_1', isActive: true },
      select: { id: true },
    });
    expect(prisma.prescription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pharmacyId: 'pharmacy_1' }),
      }),
    );
    expect(
      pharmacyPrescriptionsService.createFromHospitalPrescription,
    ).toHaveBeenCalledWith(
      'pharmacy_1',
      createdPrescription,
      createdPrescription.medicines,
      createdPrescription.patient,
    );
  });

  it('C. a pharmacyId from another tenant (or inactive) is rejected before creating anything', async () => {
    prisma.pharmacy.findFirst.mockResolvedValue(null);

    await expect(
      service.create({ ...dto, pharmacyId: 'foreign_pharmacy' }, user as any),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.prescription.create).not.toHaveBeenCalled();
  });

  it('D. a pharmacy-routing failure is swallowed and does not fail prescription creation', async () => {
    prisma.pharmacy.findFirst.mockResolvedValue({ id: 'pharmacy_1' });
    pharmacyPrescriptionsService.createFromHospitalPrescription.mockRejectedValue(
      new Error('boom'),
    );

    const result = await service.create(
      { ...dto, pharmacyId: 'pharmacy_1' },
      user as any,
    );

    expect(result.id).toBe('presc_1');
  });
});
