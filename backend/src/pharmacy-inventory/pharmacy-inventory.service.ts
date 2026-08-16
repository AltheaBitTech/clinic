import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import { StockService } from '../pharmacy-shared/stock.service';
import {
  CreateBatchDto,
  CreateStockAdjustmentDto,
} from './dto/stock-adjustment.dto';

@Injectable()
export class PharmacyInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly auditService: PharmacyAuditService,
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
        'A batch with this batch number already exists for this medicine — use Manual Stock Adjustment on it instead',
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
