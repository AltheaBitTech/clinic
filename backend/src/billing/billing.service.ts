import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private generateInvoiceNo(): string {
    return `INV-${Date.now().toString().slice(-8)}`;
  }

  async createInvoice(tenantId: string, data: any) {
    const total = Number(data.amount) - Number(data.discount || 0) + Number(data.tax || 0);
    return this.prisma.invoice.create({
      data: {
        tenantId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        invoiceNo: this.generateInvoiceNo(),
        amount: data.amount,
        discount: data.discount,
        tax: data.tax,
        total,
        notes: data.notes,
      },
    });
  }

  async findAll(tenantId: string, patientId?: string, status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [data, total, revenue] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          appointment: { select: { scheduledAt: true, doctor: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        },
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.aggregate({ where: { tenantId, status: 'PAID' }, _sum: { total: true } }),
    ]);

    return { data, total, page, limit, totalRevenue: revenue._sum.total || 0 };
  }

  async markAsPaid(id: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async findOne(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        appointment: true,
        tenant: { select: { name: true, address: true, phone: true } },
      },
    });
  }
}
