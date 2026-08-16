import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../pharmacy-shared/stock.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import {
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
} from './dto/purchase-order.dto';

@Injectable()
export class PharmacyPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly auditService: PharmacyAuditService,
  ) {}

  async create(
    pharmacyId: string,
    userId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, pharmacyId },
    });
    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    const medicineIds = [...new Set(dto.items.map((i) => i.medicineId))];
    const medicines = await this.prisma.pharmacyMedicine.findMany({
      where: { id: { in: medicineIds }, pharmacyId },
    });
    if (medicines.length !== medicineIds.length) {
      throw new BadRequestException(
        'One or more medicines do not belong to this pharmacy',
      );
    }

    const lineTax = (i: CreatePurchaseOrderDto['items'][number]) =>
      i.gstPercent != null
        ? (i.rate * i.quantity * i.gstPercent) / 100
        : (i.tax ?? 0);

    const subtotal = dto.items.reduce((sum, i) => sum + i.rate * i.quantity, 0);
    const tax = dto.items.reduce((sum, i) => sum + lineTax(i), 0);
    const discount = dto.discount ?? 0;
    const cashDiscount = dto.cashDiscount ?? 0;
    const creditNote = dto.creditNote ?? 0;
    const debitNote = dto.debitNote ?? 0;
    const otherAdjustment = dto.otherAdjustment ?? 0;
    const total =
      subtotal -
      discount -
      cashDiscount +
      tax -
      creditNote +
      debitNote +
      otherAdjustment;

    const order = await this.prisma.purchaseOrder.create({
      data: {
        pharmacyId,
        supplierId: dto.supplierId,
        orderNo: dto.orderNo,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        invoiceNo: dto.invoiceNo,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        status: PurchaseOrderStatus.ORDERED,
        orderedAt: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        subtotal,
        discount,
        cashDiscount,
        tax,
        creditNote,
        debitNote,
        otherAdjustment,
        total,
        items: {
          create: dto.items.map((i) => ({
            medicineId: i.medicineId,
            batchNo: i.batchNo,
            expiryDate: new Date(i.expiryDate),
            quantity: i.quantity,
            freeQty: i.freeQty ?? 0,
            rate: i.rate,
            tax: lineTax(i),
            hsnCode: i.hsnCode,
            gstPercent: i.gstPercent,
            mrp: i.mrp,
            packSize: i.packSize,
            manufacturer: i.manufacturer,
          })),
        },
      },
      include: { items: true, supplier: true },
    });

    await this.auditService.log(
      pharmacyId,
      userId,
      'PURCHASE_ORDER_CREATED',
      'PurchaseOrder',
      order.id,
      undefined,
      { orderNo: order.orderNo, total: order.total },
    );

    return order;
  }

  async findAll(pharmacyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { pharmacyId },
      include: { supplier: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, pharmacyId },
      include: { supplier: true, items: { include: { medicine: true } } },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    return order;
  }

  async receive(
    id: string,
    pharmacyId: string,
    userId: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const order = await this.findOne(id, pharmacyId);
    if (order.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot receive a cancelled purchase order',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const receiveItem of dto.items) {
        const item = order.items.find(
          (i) => i.id === receiveItem.purchaseItemId,
        );
        if (!item) {
          throw new BadRequestException(
            `Purchase item ${receiveItem.purchaseItemId} not found on this order`,
          );
        }
        const remaining = item.quantity - item.receivedQuantity;
        if (receiveItem.receivedQuantity > remaining) {
          throw new BadRequestException(
            `Cannot receive more than the remaining ${remaining} units for item ${item.id}`,
          );
        }

        let batch = await tx.medicineBatch.findUnique({
          where: {
            medicineId_batchNo: {
              medicineId: item.medicineId,
              batchNo: item.batchNo,
            },
          },
        });

        if (!batch) {
          const medicine = await tx.pharmacyMedicine.findUniqueOrThrow({
            where: { id: item.medicineId },
          });
          batch = await tx.medicineBatch.create({
            data: {
              medicineId: item.medicineId,
              batchNo: item.batchNo,
              expiryDate: item.expiryDate,
              purchasePrice: item.rate,
              mrp: item.mrp ?? medicine.mrp,
              salePrice: medicine.salePrice,
              quantity: 0,
              supplierId: order.supplier.id,
            },
          });
        }

        await this.stockService.addStock(tx, {
          pharmacyId,
          medicineId: item.medicineId,
          batchId: batch.id,
          quantity: receiveItem.receivedQuantity,
          type: StockMovementType.PURCHASE,
          referenceType: 'PURCHASE_ORDER',
          referenceId: order.id,
          createdBy: userId,
        });

        await tx.purchaseItem.update({
          where: { id: item.id },
          data: {
            receivedQuantity: { increment: receiveItem.receivedQuantity },
          },
        });
      }

      const refreshedItems = await tx.purchaseItem.findMany({
        where: { purchaseOrderId: order.id },
      });
      const fullyReceived = refreshedItems.every(
        (i) => i.receivedQuantity >= i.quantity,
      );
      const partiallyReceived = refreshedItems.some(
        (i) => i.receivedQuantity > 0,
      );

      const updated = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: fullyReceived
            ? PurchaseOrderStatus.RECEIVED
            : partiallyReceived
              ? PurchaseOrderStatus.PARTIALLY_RECEIVED
              : order.status,
          receivedAt: fullyReceived ? new Date() : order.receivedAt,
        },
        include: { items: true, supplier: true },
      });

      await this.auditService.log(
        pharmacyId,
        userId,
        'PURCHASE_ORDER_RECEIVED',
        'PurchaseOrder',
        order.id,
        undefined,
        { items: dto.items },
        tx,
      );

      return updated;
    });
  }
}
