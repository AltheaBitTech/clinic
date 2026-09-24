import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  ReturnStatus,
  ReturnType,
  StockMovementType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../pharmacy-shared/stock.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import {
  CancelSaleDto,
  CreateCustomerReturnDto,
  CreateSaleDto,
  RecordSalePaymentDto,
} from './dto/sale.dto';

@Injectable()
export class PharmacySalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly auditService: PharmacyAuditService,
  ) {}

  async findAll(pharmacyId: string) {
    return this.prisma.sale.findMany({
      where: { pharmacyId },
      include: {
        items: { include: { medicine: true, batch: true } },
        payments: true,
        patient: true,
        returns: { include: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, pharmacyId },
      include: {
        items: { include: { medicine: true, batch: true } },
        payments: true,
        patient: true,
        returns: true,
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async create(pharmacyId: string, userId: string, dto: CreateSaleDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const saleCount = await tx.sale.count({ where: { pharmacyId } });
        const invoiceNo = `INV-${new Date().getFullYear()}-${String(saleCount + 1).padStart(5, '0')}`;

        const sale = await tx.sale.create({
          data: {
            pharmacyId,
            patientId: dto.patientId,
            invoiceNo,
            subtotal: 0,
            discount: dto.discount ?? 0,
            tax: 0,
            total: 0,
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        let subtotal = 0;
        let tax = 0;

        for (const line of dto.items) {
          const totalQty = line.quantity;
          const picks = line.batchId
            ? [{ batchId: line.batchId, quantity: totalQty }]
            : await this.stockService.pickFefoBatches(
                tx,
                pharmacyId,
                line.medicineId,
                totalQty,
              );

          const perUnitDiscount = (line.discount ?? 0) / totalQty;
          const perUnitTax = (line.tax ?? 0) / totalQty;

          for (const pick of picks) {
            const batch = await tx.medicineBatch.findFirst({
              where: {
                id: pick.batchId,
                medicineId: line.medicineId,
                medicine: { pharmacyId },
              },
            });
            if (!batch) {
              throw new BadRequestException(
                'Batch not found for this medicine',
              );
            }
            const unitPrice = line.unitPrice ?? Number(batch.salePrice);
            const portionDiscount = perUnitDiscount * pick.quantity;
            const portionTax = perUnitTax * pick.quantity;

            await tx.saleItem.create({
              data: {
                saleId: sale.id,
                medicineId: line.medicineId,
                batchId: pick.batchId,
                quantity: pick.quantity,
                unitPrice,
                discount: portionDiscount,
                tax: portionTax,
              },
            });

            await this.stockService.deductStock(tx, {
              pharmacyId,
              medicineId: line.medicineId,
              batchId: pick.batchId,
              quantity: pick.quantity,
              type: StockMovementType.SALE,
              referenceType: 'SALE',
              referenceId: sale.id,
              createdBy: userId,
            });

            subtotal += unitPrice * pick.quantity;
            tax += portionTax;
          }
        }

        const discount = dto.discount ?? 0;
        const total = subtotal - discount + tax;
        const paidAmount = dto.payments.reduce((sum, p) => sum + p.amount, 0);

        for (const payment of dto.payments) {
          await tx.payment.create({
            data: {
              saleId: sale.id,
              method: payment.method,
              amount: payment.amount,
              referenceNo: payment.referenceNo,
            },
          });
        }

        const updatedSale = await tx.sale.update({
          where: { id: sale.id },
          data: {
            subtotal,
            tax,
            total,
            paymentStatus:
              paidAmount >= total ? PaymentStatus.PAID : PaymentStatus.PENDING,
          },
          include: { items: true, payments: true, patient: true },
        });

        if (updatedSale.paymentStatus === PaymentStatus.PENDING) {
          const pharmacy = await tx.pharmacy.findUnique({
            where: { id: pharmacyId },
            select: { userId: true },
          });
          if (pharmacy?.userId) {
            const outstanding = total - paidAmount;
            await tx.notification.create({
              data: {
                userId: pharmacy.userId,
                title: `Payment pending: ${updatedSale.invoiceNo}`,
                body: `Invoice ${updatedSale.invoiceNo} has ₹${outstanding.toFixed(2)} outstanding.`,
                channel: 'PUSH',
                metadata: { type: 'SALE_PAYMENT_PENDING', saleId: sale.id },
              },
            });
          }
        }

        await this.auditService.log(
          pharmacyId,
          userId,
          'SALE_CREATED',
          'Sale',
          sale.id,
          undefined,
          { invoiceNo, total },
          tx,
        );

        return updatedSale;
      },
      // Cart checkout does several sequential round trips per line item
      // (batch lookup, stock deduction, sale item + stock movement inserts).
      // Against a remote DB the default 5s interactive-transaction timeout
      // can be exceeded for multi-item carts, which aborts the whole sale
      // with an opaque P2028 "Transaction already closed" error.
      { maxWait: 10000, timeout: 20000 },
    );
  }

  async createReturn(
    saleId: string,
    pharmacyId: string,
    userId: string,
    dto: CreateCustomerReturnDto,
  ) {
    const sale = await this.findOne(saleId, pharmacyId);

    const previousReturnItems = await this.prisma.returnItem.findMany({
      where: { return: { saleId: sale.id } },
    });

    const requestedByKey = new Map<string, number>();
    for (const item of dto.items) {
      const key = `${item.medicineId}:${item.batchId}`;
      requestedByKey.set(key, (requestedByKey.get(key) ?? 0) + item.quantity);
    }

    for (const [key, requestedQty] of requestedByKey) {
      const [medicineId, batchId] = key.split(':');
      const saleItem = sale.items.find(
        (si) => si.medicineId === medicineId && si.batchId === batchId,
      );
      if (!saleItem) {
        throw new BadRequestException(
          'Return item does not match any item on the original sale',
        );
      }
      const alreadyReturned = previousReturnItems
        .filter((ri) => ri.medicineId === medicineId && ri.batchId === batchId)
        .reduce((sum, ri) => sum + ri.quantity, 0);
      const remaining = saleItem.quantity - alreadyReturned;
      if (requestedQty > remaining) {
        throw new BadRequestException(
          `Cannot return ${requestedQty} units of this item — only ${remaining} of ${saleItem.quantity} sold units remain returnable`,
        );
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const total = dto.items.reduce((sum, i) => sum + i.amount, 0);

        const ret = await tx.return.create({
          data: {
            pharmacyId,
            saleId: sale.id,
            type: ReturnType.CUSTOMER,
            reason: dto.reason,
            status: ReturnStatus.COMPLETED,
            total,
            items: {
              create: dto.items.map((i) => ({
                medicineId: i.medicineId,
                batchId: i.batchId,
                quantity: i.quantity,
                amount: i.amount,
              })),
            },
          },
          include: { items: true },
        });

        for (const item of dto.items) {
          await this.stockService.addStock(tx, {
            pharmacyId,
            medicineId: item.medicineId,
            batchId: item.batchId,
            quantity: item.quantity,
            type: StockMovementType.RETURN_IN,
            referenceType: 'RETURN',
            referenceId: ret.id,
            createdBy: userId,
            reason: dto.reason,
          });
        }

        await tx.sale.update({
          where: { id: sale.id },
          data: { total: { decrement: total } },
        });

        await this.auditService.log(
          pharmacyId,
          userId,
          'SALE_RETURN_CREATED',
          'Return',
          ret.id,
          undefined,
          { saleId: sale.id, total },
          tx,
        );

        return ret;
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }

  async cancel(
    saleId: string,
    pharmacyId: string,
    userId: string,
    dto: CancelSaleDto,
  ) {
    const sale = await this.findOne(saleId, pharmacyId);

    if (sale.paymentStatus === PaymentStatus.CANCELLED) {
      throw new BadRequestException('This sale is already cancelled');
    }
    if (sale.returns.length > 0) {
      throw new BadRequestException(
        'Cannot cancel a sale that already has returns recorded against it',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        for (const item of sale.items) {
          await this.stockService.addStock(tx, {
            pharmacyId,
            medicineId: item.medicineId,
            batchId: item.batchId,
            quantity: item.quantity,
            type: StockMovementType.RETURN_IN,
            referenceType: 'SALE_CANCEL',
            referenceId: sale.id,
            createdBy: userId,
            reason: dto.reason,
          });
        }

        const cancelledSale = await tx.sale.update({
          where: { id: sale.id },
          data: { paymentStatus: PaymentStatus.CANCELLED },
          include: {
            items: { include: { medicine: true, batch: true } },
            payments: true,
            patient: true,
            returns: true,
          },
        });

        await this.auditService.log(
          pharmacyId,
          userId,
          'SALE_CANCELLED',
          'Sale',
          sale.id,
          { paymentStatus: sale.paymentStatus },
          { paymentStatus: PaymentStatus.CANCELLED, reason: dto.reason },
          tx,
        );

        return cancelledSale;
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }

  async pay(
    saleId: string,
    pharmacyId: string,
    userId: string,
    dto: RecordSalePaymentDto,
  ) {
    const sale = await this.findOne(saleId, pharmacyId);

    if (sale.paymentStatus === PaymentStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot record a payment against a cancelled sale',
      );
    }
    if (sale.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('This sale is already fully paid');
    }

    const paidSoFar = sale.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const outstanding = Number(sale.total) - paidSoFar;

    if (dto.amount > outstanding + 0.01) {
      throw new BadRequestException(
        `Payment amount cannot exceed the outstanding balance of ${outstanding.toFixed(2)}`,
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            method: dto.method,
            amount: dto.amount,
            referenceNo: dto.referenceNo,
          },
        });

        const newPaidTotal = paidSoFar + dto.amount;
        const updatedSale = await tx.sale.update({
          where: { id: sale.id },
          data: {
            paymentStatus:
              newPaidTotal >= Number(sale.total)
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING,
          },
          include: {
            items: { include: { medicine: true, batch: true } },
            payments: true,
            patient: true,
            returns: true,
          },
        });

        await this.auditService.log(
          pharmacyId,
          userId,
          'SALE_PAYMENT_RECORDED',
          'Sale',
          sale.id,
          { paymentStatus: sale.paymentStatus, outstanding },
          {
            paymentStatus: updatedSale.paymentStatus,
            amount: dto.amount,
            method: dto.method,
          },
          tx,
        );

        return updatedSale;
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }
}
