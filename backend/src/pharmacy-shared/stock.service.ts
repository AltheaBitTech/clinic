import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export function isBatchUsable(batch: { status: string; expiryDate: Date }) {
  return batch.status === 'ACTIVE' && batch.expiryDate.getTime() > Date.now();
}

interface StockMovementInput {
  pharmacyId: string;
  medicineId: string;
  batchId: string;
  quantity: number;
  type: StockMovementType;
  referenceType: string;
  referenceId: string;
  createdBy: string;
  reason?: string;
}

@Injectable()
export class StockService {
  /**
   * FEFO: picks the earliest-expiring usable batches for the requested quantity.
   * Throws if the medicine doesn't have enough usable stock across its batches.
   */
  async pickFefoBatches(
    tx: Tx,
    pharmacyId: string,
    medicineId: string,
    quantity: number,
  ): Promise<{ batchId: string; quantity: number }[]> {
    const batches = await tx.medicineBatch.findMany({
      where: {
        medicineId,
        medicine: { pharmacyId },
        status: 'ACTIVE',
        expiryDate: { gt: new Date() },
        quantity: { gt: 0 },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const picks: { batchId: string; quantity: number }[] = [];
    let remaining = quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      picks.push({ batchId: batch.id, quantity: take });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        'Insufficient usable stock for this medicine',
      );
    }
    return picks;
  }

  async deductStock(tx: Tx, input: StockMovementInput) {
    const batch = await tx.medicineBatch.findFirst({
      where: { id: input.batchId, medicine: { pharmacyId: input.pharmacyId } },
    });
    if (!batch) throw new BadRequestException('Batch not found');
    if (batch.medicineId !== input.medicineId) {
      throw new BadRequestException(
        'Batch does not belong to the specified medicine',
      );
    }
    if (!isBatchUsable(batch)) {
      throw new BadRequestException(
        'Batch is expired or blocked and cannot be used',
      );
    }

    // Atomic conditional decrement: the WHERE clause is enforced by the DB's
    // row lock during the UPDATE, so concurrent deductions can't both pass a
    // separate read-then-check and drive quantity negative.
    const result = await tx.medicineBatch.updateMany({
      where: { id: input.batchId, quantity: { gte: input.quantity } },
      data: { quantity: { decrement: input.quantity } },
    });
    if (result.count === 0) {
      throw new BadRequestException('Insufficient stock in batch');
    }

    await this.maybeNotifyLowStock(tx, input);

    return tx.stockMovement.create({
      data: {
        pharmacyId: input.pharmacyId,
        medicineId: input.medicineId,
        batchId: input.batchId,
        type: input.type,
        quantity: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        createdBy: input.createdBy,
        reason: input.reason,
      },
    });
  }

  /**
   * Fires an edge-triggered low-stock notification: only when this deduction
   * takes the medicine's usable quantity from above its reorderLevel to at/below
   * it, not on every subsequent sale while it's already low.
   */
  private async maybeNotifyLowStock(tx: Tx, input: StockMovementInput) {
    const [medicine, usable] = await Promise.all([
      tx.pharmacyMedicine.findUnique({
        where: { id: input.medicineId },
        select: { name: true, reorderLevel: true },
      }),
      tx.medicineBatch.aggregate({
        _sum: { quantity: true },
        where: {
          medicineId: input.medicineId,
          status: 'ACTIVE',
          expiryDate: { gt: new Date() },
        },
      }),
    ]);
    if (!medicine) return;

    const afterQty = usable._sum.quantity ?? 0;
    const beforeQty = afterQty + input.quantity;
    if (!(
      beforeQty > medicine.reorderLevel && afterQty <= medicine.reorderLevel
    )) {
      return;
    }

    const pharmacy = await tx.pharmacy.findUnique({
      where: { id: input.pharmacyId },
      select: { userId: true },
    });
    if (!pharmacy?.userId) return;

    await tx.notification.create({
      data: {
        userId: pharmacy.userId,
        title: `Low stock: ${medicine.name}`,
        body: `${medicine.name} has dropped to ${afterQty} unit${afterQty === 1 ? '' : 's'} (reorder level ${medicine.reorderLevel}).`,
        channel: 'PUSH',
        metadata: {
          type: 'LOW_STOCK',
          medicineId: input.medicineId,
          pharmacyId: input.pharmacyId,
        },
      },
    });
  }

  async addStock(tx: Tx, input: StockMovementInput) {
    const batch = await tx.medicineBatch.findFirst({
      where: { id: input.batchId, medicine: { pharmacyId: input.pharmacyId } },
    });
    if (!batch) throw new BadRequestException('Batch not found');
    if (batch.medicineId !== input.medicineId) {
      throw new BadRequestException(
        'Batch does not belong to the specified medicine',
      );
    }

    await tx.medicineBatch.update({
      where: { id: input.batchId },
      data: { quantity: { increment: input.quantity } },
    });

    return tx.stockMovement.create({
      data: {
        pharmacyId: input.pharmacyId,
        medicineId: input.medicineId,
        batchId: input.batchId,
        type: input.type,
        quantity: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        createdBy: input.createdBy,
        reason: input.reason,
      },
    });
  }
}
