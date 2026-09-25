import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../pharmacy-shared/stock.service';
import { PharmacyAuditService } from '../pharmacy-shared/pharmacy-audit.service';
import { EmailService } from '../email/email.service';
import {
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  SendPurchaseOrderEmailDto,
} from './dto/purchase-order.dto';

const PURCHASE_ORDER_DETAIL_INCLUDE = {
  supplier: true,
  items: { include: { medicine: true } },
};

@Injectable()
export class PharmacyPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly auditService: PharmacyAuditService,
    private readonly emailService: EmailService,
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
      include: PURCHASE_ORDER_DETAIL_INCLUDE,
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

    const resolvedItems = dto.items.map((receiveItem) => {
      const item = order.items.find((i) => i.id === receiveItem.purchaseItemId);
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
      return { receiveItem, item };
    });

    const updated = await this.prisma.$transaction(
      async (tx) => {
        // Resolve (or create) the batch for each distinct medicine+batchNo
        // up front, in parallel, instead of one DB round trip per line item
        // in a sequential loop — on orders with many items that sequential
        // pattern was what blew past the transaction's timeout.
        const uniqueBatchTargets = new Map<
          string,
          (typeof resolvedItems)[number]['item']
        >();
        for (const { item } of resolvedItems) {
          const key = `${item.medicineId}::${item.batchNo}`;
          if (!uniqueBatchTargets.has(key)) uniqueBatchTargets.set(key, item);
        }

        const batchPairs = await Promise.all(
          Array.from(uniqueBatchTargets.entries()).map(async ([key, item]) => {
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
            return [key, batch] as const;
          }),
        );
        const batchByKey = new Map(batchPairs);

        await Promise.all(
          resolvedItems.map(({ receiveItem, item }) => {
            const batch = batchByKey.get(
              `${item.medicineId}::${item.batchNo}`,
            )!;
            return Promise.all([
              this.stockService.addStock(tx, {
                pharmacyId,
                medicineId: item.medicineId,
                batchId: batch.id,
                quantity: receiveItem.receivedQuantity,
                type: StockMovementType.PURCHASE,
                referenceType: 'PURCHASE_ORDER',
                referenceId: order.id,
                createdBy: userId,
              }),
              tx.purchaseItem.update({
                where: { id: item.id },
                data: {
                  receivedQuantity: {
                    increment: receiveItem.receivedQuantity,
                  },
                },
              }),
            ]);
          }),
        );

        const refreshedItems = await tx.purchaseItem.findMany({
          where: { purchaseOrderId: order.id },
        });
        const fullyReceived = refreshedItems.every(
          (i) => i.receivedQuantity >= i.quantity,
        );
        const partiallyReceived = refreshedItems.some(
          (i) => i.receivedQuantity > 0,
        );

        return tx.purchaseOrder.update({
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
      },
      // Safety net for large orders / slower DB conditions — Prisma's
      // default interactive-transaction timeout is 5s, which is easy to
      // exceed once a purchase order has more than a handful of line items.
      { timeout: 20000, maxWait: 10000 },
    );

    // Notification + audit log are side effects, not part of the atomic
    // stock/order write — run them after commit so they don't extend how
    // long the transaction (and its row locks) stay open.
    if (
      updated.status !== order.status &&
      (updated.status === PurchaseOrderStatus.RECEIVED ||
        updated.status === PurchaseOrderStatus.PARTIALLY_RECEIVED)
    ) {
      const pharmacy = await this.prisma.pharmacy.findUnique({
        where: { id: pharmacyId },
        select: { userId: true },
      });
      if (pharmacy?.userId) {
        const fully = updated.status === PurchaseOrderStatus.RECEIVED;
        await this.prisma.notification.create({
          data: {
            userId: pharmacy.userId,
            title: fully
              ? `Purchase order received: ${order.orderNo}`
              : `Purchase order partially received: ${order.orderNo}`,
            body: `Order ${order.orderNo} from ${updated.supplier.name} was ${fully ? 'fully' : 'partially'} received.`,
            channel: 'PUSH',
            metadata: {
              type: 'PURCHASE_ORDER_RECEIVED',
              purchaseOrderId: order.id,
            },
          },
        });
      }
    }

    await this.auditService.log(
      pharmacyId,
      userId,
      'PURCHASE_ORDER_RECEIVED',
      'PurchaseOrder',
      order.id,
      undefined,
      { items: dto.items },
    );

    return updated;
  }

  // ─── PDF / sharing ──────────────────────────────────────────────────────

  async getPdfFile(
    id: string,
    pharmacyId: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const order = await this.findOne(id, pharmacyId);
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    const buffer = await this.generatePdfBuffer(order, pharmacy);
    return { buffer, fileName: `${order.orderNo}.pdf` };
  }

  async getPublicPdfFile(
    id: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: PURCHASE_ORDER_DETAIL_INCLUDE,
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: order.pharmacyId },
    });
    const buffer = await this.generatePdfBuffer(order, pharmacy);
    return { buffer, fileName: `${order.orderNo}.pdf` };
  }

  async emailToSupplier(
    id: string,
    pharmacyId: string,
    dto: SendPurchaseOrderEmailDto,
  ): Promise<{ sent: true; recipientEmail: string }> {
    const order = await this.findOne(id, pharmacyId);
    const recipientEmail = dto.email || order.supplier.email;
    if (!recipientEmail) {
      throw new BadRequestException(
        'Supplier has no email on file — provide one to send to',
      );
    }

    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    const buffer = await this.generatePdfBuffer(order, pharmacy);

    await this.emailService.sendPurchaseOrderToSupplier({
      recipientEmail,
      supplierName: order.supplier.name,
      pharmacyName: pharmacy?.name || 'Pharmacy',
      orderNo: order.orderNo,
      total: Number(order.total),
      pdfBuffer: buffer,
    });

    return { sent: true, recipientEmail };
  }

  private generatePdfBuffer(order: any, pharmacy: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const marginX = 50;
      const contentWidth = doc.page.width - marginX * 2;
      const money = (v: number) =>
        `Rs. ${Number(v).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      const formatDate = (d: Date | string) =>
        new Date(d).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      const drawDivider = () => {
        doc.moveDown(0.4);
        doc
          .strokeColor('#ccc')
          .moveTo(marginX, doc.y)
          .lineTo(marginX + contentWidth, doc.y)
          .stroke();
        doc.strokeColor('black');
        doc.moveDown(0.5);
      };
      const sectionHeading = (title: string) => {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#0e7490')
          .text(title);
        doc.fillColor('black');
        doc.moveDown(0.3);
      };
      const labelValueRow = (label: string, value: string) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(label, marginX, doc.y, { continued: true });
        doc.font('Helvetica').text(` : ${value}`);
      };
      const summaryRow = (label: string, value: string, bold = false) => {
        const y = doc.y;
        doc
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(10)
          .text(label, marginX, y, { width: contentWidth - 120 });
        doc.text(value, marginX + contentWidth - 120, y, {
          width: 120,
          align: 'right',
        });
        doc.moveDown(0.4);
      };

      // ─── Header ───
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#0e7490')
        .text(pharmacy?.name || 'Pharmacy');
      doc.fillColor('black');
      const addressLine = [pharmacy?.address, pharmacy?.city, pharmacy?.state]
        .filter(Boolean)
        .join(', ');
      if (addressLine)
        doc.fontSize(9).font('Helvetica').fillColor('#666').text(addressLine);
      if (pharmacy?.phone)
        doc.fontSize(9).fillColor('#666').text(`Phone: ${pharmacy.phone}`);
      doc.fillColor('black');
      doc.moveDown(0.5);

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#0e7490')
        .text('PURCHASE ORDER', { align: 'right' });
      doc.fillColor('black');
      drawDivider();

      // ─── Order meta ───
      labelValueRow('Order No', order.orderNo);
      labelValueRow(
        'Order Date',
        order.orderDate ? formatDate(order.orderDate) : '—',
      );
      labelValueRow('Status', String(order.status).replace(/_/g, ' '));
      if (order.invoiceNo) labelValueRow('Invoice No', order.invoiceNo);
      if (order.invoiceDate)
        labelValueRow('Invoice Date', formatDate(order.invoiceDate));
      drawDivider();

      // ─── Supplier ───
      sectionHeading('Supplier');
      labelValueRow('Name', order.supplier.name);
      if (order.supplier.phone) labelValueRow('Phone', order.supplier.phone);
      if (order.supplier.email) labelValueRow('Email', order.supplier.email);
      if (order.supplier.gstin) labelValueRow('GSTIN', order.supplier.gstin);
      drawDivider();

      // ─── Items table ───
      sectionHeading('Items');
      const colWidths = [155, 80, 45, 65, 45, 105];
      const headers = ['Medicine', 'Batch', 'Qty', 'Rate', 'GST%', 'Amount'];
      const drawRow = (
        values: string[],
        opts: { bold?: boolean; color?: string } = {},
      ) => {
        if (doc.y > doc.page.height - 100) doc.addPage();
        const y = doc.y;
        let x = marginX;
        doc
          .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5)
          .fillColor(opts.color || 'black');
        values.forEach((v, i) => {
          doc.text(v, x, y, {
            width: colWidths[i],
            align: i >= 2 ? 'right' : 'left',
          });
          x += colWidths[i];
        });
        doc.fillColor('black');
        doc.y = y + 16;
      };

      drawRow(headers, { bold: true, color: '#666' });
      doc
        .strokeColor('#ccc')
        .moveTo(marginX, doc.y)
        .lineTo(marginX + contentWidth, doc.y)
        .stroke();
      doc.strokeColor('black');
      doc.moveDown(0.2);

      for (const item of order.items || []) {
        drawRow([
          item.medicine?.name || item.medicineId,
          item.batchNo,
          String(item.quantity),
          money(item.rate),
          item.gstPercent != null ? `${item.gstPercent}%` : '—',
          money(Number(item.rate) * item.quantity),
        ]);
      }
      doc.moveDown(0.5);
      drawDivider();

      // ─── Totals ───
      const gstInvoiceAmount =
        Number(order.subtotal) -
        Number(order.discount) -
        Number(order.cashDiscount ?? 0) +
        Number(order.tax);

      summaryRow('Item Total', money(order.subtotal));
      summaryRow('Less Prod Discount', `- ${money(order.discount)}`);
      summaryRow('Less Cash Discount', `- ${money(order.cashDiscount ?? 0)}`);
      summaryRow('GST + CESS', money(order.tax));
      summaryRow('GST Invoice Amount', money(gstInvoiceAmount), true);
      summaryRow('Less Cr. Note', `- ${money(order.creditNote ?? 0)}`);
      summaryRow('Add Dr. Note', `+ ${money(order.debitNote ?? 0)}`);
      summaryRow('Other +/-, R/o', money(order.otherAdjustment ?? 0));
      doc.moveDown(0.2);
      doc.fillColor('#0e7490');
      summaryRow('Net Payable', money(order.total), true);
      doc.fillColor('black');
      drawDivider();

      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('#555')
        .text('This is a computer-generated purchase order.', {
          align: 'right',
        });
      doc.fillColor('black');

      doc.end();
    });
  }
}
