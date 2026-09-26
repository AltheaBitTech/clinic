import { BadRequestException } from '@nestjs/common';
import { PharmacyPrescriptionsService } from './pharmacy-prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../pharmacy-shared/stock.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PharmacyPrescriptionStatus } from '@prisma/client';

describe('PharmacyPrescriptionsService.createFromHospitalPrescription', () => {
  const hospitalPrescription = {
    id: 'presc_1',
    doctorId: 'doctor_1',
    appointmentId: null,
    diagnosis: 'Viral fever',
    notes: 'Rest and hydration',
  };
  const medicines = [
    {
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '5 days',
      instructions: null,
    },
  ];
  const hospitalPatient = {
    id: 'patient_1',
    user: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '9999999999',
      email: 'patient@example.com',
    },
  };

  let tx: {
    pharmacyPatient: { upsert: jest.Mock };
    pharmacyPrescription: { create: jest.Mock; update: jest.Mock };
    prescriptionItem: { update: jest.Mock };
  };
  let prisma: {
    $transaction: jest.Mock;
    pharmacy: { findUnique: jest.Mock };
  };
  let notificationsService: { create: jest.Mock };
  let service: PharmacyPrescriptionsService;

  beforeEach(() => {
    tx = {
      pharmacyPatient: {
        upsert: jest.fn().mockResolvedValue({ id: 'pharmacy_patient_1' }),
      },
      pharmacyPrescription: {
        create: jest.fn().mockResolvedValue({
          id: 'pharm_presc_1',
          patient: { name: 'Ada Lovelace' },
        }),
        update: jest.fn(),
      },
      prescriptionItem: { update: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      pharmacy: {
        findUnique: jest.fn().mockResolvedValue({ userId: 'pharmacy_user_1' }),
      },
    };
    notificationsService = { create: jest.fn().mockResolvedValue(undefined) };
    service = new PharmacyPrescriptionsService(
      prisma as unknown as PrismaService,
      {} as StockService,
      {} as PharmacyAuditService,
      notificationsService as unknown as NotificationsService,
    );
  });

  it('upserts the PharmacyPatient keyed by (pharmacyId, arogyixPatientId) so repeat routing is deduped', async () => {
    await service.createFromHospitalPrescription(
      'pharmacy_1',
      hospitalPrescription,
      medicines,
      hospitalPatient,
    );

    expect(tx.pharmacyPatient.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          pharmacyId_arogyixPatientId: {
            pharmacyId: 'pharmacy_1',
            arogyixPatientId: 'patient_1',
          },
        },
      }),
    );
  });

  it('creates the PharmacyPrescription with items mapped from the hospital medicines and a soft link back', async () => {
    await service.createFromHospitalPrescription(
      'pharmacy_1',
      hospitalPrescription,
      medicines,
      hospitalPatient,
    );

    expect(tx.pharmacyPrescription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pharmacyId: 'pharmacy_1',
          patientId: 'pharmacy_patient_1',
          arogyixPrescriptionId: 'presc_1',
          items: {
            create: [
              expect.objectContaining({
                medicineName: 'Paracetamol',
                dosage: '500mg',
                quantity: 1,
              }),
            ],
          },
        }),
      }),
    );
  });

  it('notifies the pharmacy user once routing completes', async () => {
    await service.createFromHospitalPrescription(
      'pharmacy_1',
      hospitalPrescription,
      medicines,
      hospitalPatient,
    );

    expect(notificationsService.create).toHaveBeenCalledWith(
      'pharmacy_user_1',
      expect.any(String),
      expect.stringContaining('Ada Lovelace'),
      'PUSH',
      undefined,
      expect.objectContaining({ type: 'PHARMACY_PRESCRIPTION_ROUTED' }),
    );
  });
});

describe('PharmacyPrescriptionsService.verify — item corrections', () => {
  let tx: {
    prescriptionItem: { update: jest.Mock };
    pharmacyPrescription: { update: jest.Mock };
  };
  let prisma: {
    $transaction: jest.Mock;
    pharmacyPrescription: { findFirst: jest.Mock };
  };
  let auditService: { log: jest.Mock };
  let service: PharmacyPrescriptionsService;

  const pendingPrescription = {
    id: 'pharm_presc_1',
    pharmacyId: 'pharmacy_1',
    status: PharmacyPrescriptionStatus.PENDING,
    items: [{ id: 'item_1' }],
  };

  beforeEach(() => {
    tx = {
      prescriptionItem: { update: jest.fn() },
      pharmacyPrescription: {
        update: jest.fn().mockResolvedValue({
          ...pendingPrescription,
          status: PharmacyPrescriptionStatus.VERIFIED,
        }),
      },
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      pharmacyPrescription: {
        findFirst: jest.fn().mockResolvedValue(pendingPrescription),
      },
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    service = new PharmacyPrescriptionsService(
      prisma as unknown as PrismaService,
      {} as StockService,
      auditService as unknown as PharmacyAuditService,
      {} as NotificationsService,
    );
  });

  it('applies medicineId/quantity corrections to matching items before verifying', async () => {
    await service.verify('pharm_presc_1', 'pharmacy_1', 'user_1', {
      items: [{ id: 'item_1', medicineId: 'catalog_med_1', quantity: 10 }],
    });

    expect(tx.prescriptionItem.update).toHaveBeenCalledWith({
      where: { id: 'item_1' },
      data: { medicineId: 'catalog_med_1', quantity: 10 },
    });
    expect(tx.pharmacyPrescription.update).toHaveBeenCalledWith({
      where: { id: 'pharm_presc_1' },
      data: { status: PharmacyPrescriptionStatus.VERIFIED },
    });
  });

  it('rejects a correction for an item that does not belong to this prescription', async () => {
    await expect(
      service.verify('pharm_presc_1', 'pharmacy_1', 'user_1', {
        items: [{ id: 'unknown_item', medicineId: 'catalog_med_1' }],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(tx.prescriptionItem.update).not.toHaveBeenCalled();
  });

  it('still verifies with no corrections when none are supplied', async () => {
    await service.verify('pharm_presc_1', 'pharmacy_1', 'user_1');

    expect(tx.prescriptionItem.update).not.toHaveBeenCalled();
    expect(tx.pharmacyPrescription.update).toHaveBeenCalled();
  });
});
