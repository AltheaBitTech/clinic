import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DispenseStatus,
  PharmacyPrescriptionStatus,
  StockMovementType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../pharmacy-shared/stock.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import {
  CreatePharmacyPrescriptionDto,
  DispensePrescriptionDto,
} from './dto/pharmacy-prescription.dto';

@Injectable()
export class PharmacyPrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly auditService: PharmacyAuditService,
  ) {}

  async create(pharmacyId: string, dto: CreatePharmacyPrescriptionDto) {
    return this.prisma.pharmacyPrescription.create({
      data: {
        pharmacyId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId,
        arogyixPrescriptionId: dto.arogyixPrescriptionId,
        diagnosis: dto.diagnosis,
        advice: dto.advice,
        items: { create: dto.items },
      },
      include: { items: true, patient: true },
    });
  }

  async findAll(pharmacyId: string, status?: PharmacyPrescriptionStatus) {
    return this.prisma.pharmacyPrescription.findMany({
      where: { pharmacyId, ...(status ? { status } : {}) },
      include: { patient: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const prescription = await this.prisma.pharmacyPrescription.findFirst({
      where: { id, pharmacyId },
      include: {
        patient: true,
        items: { include: { medicine: true } },
        dispenses: { include: { items: true } },
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  async verify(id: string, pharmacyId: string, userId: string) {
    const prescription = await this.findOne(id, pharmacyId);
    if (prescription.status !== PharmacyPrescriptionStatus.PENDING) {
      throw new BadRequestException(
        'Only pending prescriptions can be verified',
      );
    }
    const updated = await this.prisma.pharmacyPrescription.update({
      where: { id },
      data: { status: PharmacyPrescriptionStatus.VERIFIED },
    });
    await this.auditService.log(
      pharmacyId,
      userId,
      'PRESCRIPTION_VERIFIED',
      'PharmacyPrescription',
      id,
    );
    return updated;
  }

  async dispense(
    id: string,
    pharmacyId: string,
    userId: string,
    dto: DispensePrescriptionDto,
  ) {
    const prescription = await this.findOne(id, pharmacyId);
    if (
      prescription.status !== PharmacyPrescriptionStatus.VERIFIED &&
      prescription.status !== PharmacyPrescriptionStatus.PARTIALLY_DISPENSED
    ) {
      throw new BadRequestException(
        'Prescription must be verified before it can be dispensed',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const dispense = await tx.dispense.create({
        data: {
          prescriptionId: id,
          userId,
          status: DispenseStatus.PENDING,
        },
      });

      for (const line of dto.items) {
        const item = prescription.items.find(
          (i) => i.id === line.prescriptionItemId,
        );
        if (!item) {
          throw new BadRequestException(
            `Prescription item ${line.prescriptionItemId} not found`,
          );
        }
        if (!item.medicineId) {
          throw new BadRequestException(
            `Prescription item "${item.medicineName}" is not mapped to a catalog medicine yet`,
          );
        }

        const picks = line.batchId
          ? [{ batchId: line.batchId, quantity: line.quantity }]
          : await this.stockService.pickFefoBatches(
              tx,
              pharmacyId,
              item.medicineId,
              line.quantity,
            );

        for (const pick of picks) {
          await this.stockService.deductStock(tx, {
            pharmacyId,
            medicineId: item.medicineId,
            batchId: pick.batchId,
            quantity: pick.quantity,
            type: StockMovementType.DISPENSE,
            referenceType: 'DISPENSE',
            referenceId: dispense.id,
            createdBy: userId,
          });

          await tx.dispenseItem.create({
            data: {
              dispenseId: dispense.id,
              prescriptionItemId: item.id,
              batchId: pick.batchId,
              quantity: pick.quantity,
            },
          });
        }
      }

      await tx.dispense.update({
        where: { id: dispense.id },
        data: { status: DispenseStatus.COMPLETED, dispensedAt: new Date() },
      });

      const allDispenseItems = await tx.dispenseItem.findMany({
        where: {
          dispense: { prescriptionId: id, status: DispenseStatus.COMPLETED },
        },
      });
      const dispensedByItem = new Map<string, number>();
      for (const di of allDispenseItems) {
        dispensedByItem.set(
          di.prescriptionItemId,
          (dispensedByItem.get(di.prescriptionItemId) ?? 0) + di.quantity,
        );
      }
      const fullyDispensed = prescription.items.every(
        (i) => (dispensedByItem.get(i.id) ?? 0) >= i.quantity,
      );

      const updatedPrescription = await tx.pharmacyPrescription.update({
        where: { id },
        data: {
          status: fullyDispensed
            ? PharmacyPrescriptionStatus.DISPENSED
            : PharmacyPrescriptionStatus.PARTIALLY_DISPENSED,
        },
        include: { items: true, patient: true },
      });

      await this.auditService.log(
        pharmacyId,
        userId,
        'PRESCRIPTION_DISPENSED',
        'PharmacyPrescription',
        id,
        undefined,
        { dispenseId: dispense.id, items: dto.items },
        tx,
      );

      return updatedPrescription;
    });
  }
}
