import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import { StockService } from '../pharmacy-shared/stock.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateBatchDto,
  CreateStockAdjustmentDto,
  UpdateBatchDto,
} from './dto/stock-adjustment.dto';

@Injectable()
export class PharmacyInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly auditService: PharmacyAuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private withExpiryInfo<T extends { expiryDate: Date }>(batch: T) {
    const now = Date.now();
    const daysToExpiry = Math.ceil(
      (batch.expiryDate.getTime() - now) / (1000 * 60 * 60 * 24),
    );
    return { ...batch, isExpired: daysToExpiry < 0, daysToExpiry };
  }

  async listBatches(pharmacyId: string) {
    const batches = await this.prisma.medicineBatch.findMany({
      where: { medicine: { pharmacyId } },
      include: { medicine: true, supplier: true },
      orderBy: { expiryDate: 'asc' },
    });
    return batches.map((b) => this.withExpiryInfo(b));
  }

  async listExpiry(pharmacyId: string, withinDays?: number) {
    const batches = await this.listBatches(pharmacyId);
    if (withinDays === undefined) {
      return batches.filter((b) => b.isExpired || b.daysToExpiry <= 30);
    }
    return batches.filter((b) => b.daysToExpiry <= withinDays);
  }

  async listLowStock(pharmacyId: string) {
    const medicines = await this.prisma.pharmacyMedicine.findMany({
      where: { pharmacyId, isActive: true },
      include: {
        batches: {
          where: { status: 'ACTIVE', expiryDate: { gt: new Date() } },
        },
      },
    });
    return medicines
      .map((m) => {
        const totalQuantity = m.batches.reduce((sum, b) => sum + b.quantity, 0);
        return { ...m, totalQuantity };
      })
      .filter((m) => m.totalQuantity <= m.reorderLevel);
  }

  /**
   * Scheduled daily scan (see reminders/cron) — a batch sitting untouched in
   * inventory never triggers a stock-change event, so expiry needs a
   * periodic sweep rather than the real-time check used for low stock.
   * Notifies once per batch entering the expiring/expired window (dedup by
   * checking for a prior EXPIRY_ALERT notification with the same batchId).
   */
  async runExpiryAlertScan() {
    const pharmacies = await this.prisma.pharmacy.findMany({
      where: { userId: { not: null } },
      select: { id: true, userId: true },
    });

    let notified = 0;
    for (const pharmacy of pharmacies) {
      if (!pharmacy.userId) continue;
      const expiring = await this.listExpiry(pharmacy.id);

      for (const batch of expiring) {
        const alreadyNotified = await this.prisma.notification.findFirst({
          where: {
            userId: pharmacy.userId,
            AND: [
              { metadata: { path: ['type'], equals: 'EXPIRY_ALERT' } },
              { metadata: { path: ['batchId'], equals: batch.id } },
            ],
          },
        });
        if (alreadyNotified) continue;

        const title = batch.isExpired
          ? `Expired: ${batch.medicine.name} (batch ${batch.batchNo})`
          : `Expiring soon: ${batch.medicine.name} (batch ${batch.batchNo})`;
        const body = batch.isExpired
          ? `Batch ${batch.batchNo} of ${batch.medicine.name} has expired.`
          : `Batch ${batch.batchNo} of ${batch.medicine.name} expires in ${batch.daysToExpiry} day${batch.daysToExpiry === 1 ? '' : 's'}.`;

        await this.notificationsService.create(
          pharmacy.userId,
          title,
          body,
          'PUSH',
          undefined,
          {
            type: 'EXPIRY_ALERT',
            batchId: batch.id,
            medicineId: batch.medicineId,
          },
        );
        notified++;
      }
    }

    return { notified };
  }

  async listMovements(
    pharmacyId: string,
    medicineId?: string,
    batchId?: string,
  ) {
    return this.prisma.stockMovement.findMany({
      where: {
        pharmacyId,
        ...(medicineId ? { medicineId } : {}),
        ...(batchId ? { batchId } : {}),
      },
      include: { medicine: true, batch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdjustment(
    pharmacyId: string,
    userId: string,
    dto: CreateStockAdjustmentDto,
  ) {
    const batch = await this.prisma.medicineBatch.findFirst({
      where: { id: dto.batchId, medicine: { pharmacyId } },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    return this.prisma.$transaction(async (tx) => {
      const movement =
        dto.quantityChange > 0
          ? await this.stockService.addStock(tx, {
              pharmacyId,
              medicineId: batch.medicineId,
              batchId: batch.id,
              quantity: dto.quantityChange,
              type: StockMovementType.ADJUSTMENT_IN,
              referenceType: 'ADJUSTMENT',
              referenceId: batch.id,
              createdBy: userId,
              reason: dto.reason,
            })
          : await this.deductForAdjustment(tx, pharmacyId, userId, batch, dto);

      await this.auditService.log(
        pharmacyId,
        userId,
        'STOCK_ADJUSTMENT',
        'MedicineBatch',
        batch.id,
        { quantity: batch.quantity },
        { quantityChange: dto.quantityChange, reason: dto.reason },
        tx,
      );

      return movement;
    });
  }

  async createBatch(pharmacyId: string, userId: string, dto: CreateBatchDto) {
    const medicine = await this.prisma.pharmacyMedicine.findFirst({
      where: { id: dto.medicineId, pharmacyId },
    });
    if (!medicine) throw new NotFoundException('Medicine not found');

    const existing = await this.prisma.medicineBatch.findUnique({
      where: {
        medicineId_batchNo: {
          medicineId: dto.medicineId,
          batchNo: dto.batchNo,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Batch ${dto.batchNo} already exists for this medicine. Please select "Adjust Existing Batch".`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.medicineBatch.create({
        data: {
          medicineId: dto.medicineId,
          batchNo: dto.batchNo,
          mfgDate: dto.mfgDate ? new Date(dto.mfgDate) : undefined,
          expiryDate: new Date(dto.expiryDate),
          purchasePrice: dto.purchasePrice,
          mrp: dto.mrp,
          salePrice: dto.salePrice,
          quantity: 0,
          supplierId: dto.supplierId,
        },
      });

      const movement = await this.stockService.addStock(tx, {
        pharmacyId,
        medicineId: dto.medicineId,
        batchId: batch.id,
        quantity: dto.quantity,
        type: StockMovementType.ADJUSTMENT_IN,
        referenceType: 'NEW_BATCH',
        referenceId: batch.id,
        createdBy: userId,
        reason: dto.reason,
      });

      await this.auditService.log(
        pharmacyId,
        userId,
        'STOCK_ADJUSTMENT',
        'MedicineBatch',
        batch.id,
        null,
        { batchNo: dto.batchNo, quantity: dto.quantity, reason: dto.reason },
        tx,
      );

      return movement;
    });
  }

  async updateBatch(
    pharmacyId: string,
    userId: string,
    batchId: string,
    dto: UpdateBatchDto,
  ) {
    const batch = await this.prisma.medicineBatch.findFirst({
      where: { id: batchId, medicine: { pharmacyId } },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    if (dto.batchNo && dto.batchNo !== batch.batchNo) {
      const existing = await this.prisma.medicineBatch.findUnique({
        where: {
          medicineId_batchNo: {
            medicineId: batch.medicineId,
            batchNo: dto.batchNo,
          },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Batch ${dto.batchNo} already exists for this medicine.`,
        );
      }
    }

    const updated = await this.prisma.medicineBatch.update({
      where: { id: batchId },
      data: {
        ...(dto.batchNo !== undefined ? { batchNo: dto.batchNo } : {}),
        ...(dto.mfgDate !== undefined
          ? { mfgDate: new Date(dto.mfgDate) }
          : {}),
        ...(dto.expiryDate !== undefined
          ? { expiryDate: new Date(dto.expiryDate) }
          : {}),
        ...(dto.purchasePrice !== undefined
          ? { purchasePrice: dto.purchasePrice }
          : {}),
        ...(dto.mrp !== undefined ? { mrp: dto.mrp } : {}),
        ...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
        ...(dto.supplierId !== undefined ? { supplierId: dto.supplierId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: { medicine: true, supplier: true },
    });

    await this.auditService.log(
      pharmacyId,
      userId,
      'BATCH_UPDATE',
      'MedicineBatch',
      batch.id,
      batch,
      dto,
    );

    return this.withExpiryInfo(updated);
  }

  private async deductForAdjustment(
    tx: any,
    pharmacyId: string,
    userId: string,
    batch: { id: string; medicineId: string; quantity: number },
    dto: CreateStockAdjustmentDto,
  ) {
    const decrementBy = Math.abs(dto.quantityChange);
    if (batch.quantity < decrementBy) {
      throw new BadRequestException(
        'Adjustment would result in negative stock',
      );
    }
    await tx.medicineBatch.update({
      where: { id: batch.id },
      data: { quantity: { decrement: decrementBy } },
    });
    return tx.stockMovement.create({
      data: {
        pharmacyId,
        medicineId: batch.medicineId,
        batchId: batch.id,
        type: StockMovementType.ADJUSTMENT_OUT,
        quantity: decrementBy,
        referenceType: 'ADJUSTMENT',
        referenceId: batch.id,
        createdBy: userId,
        reason: dto.reason,
      },
    });
  }
}
