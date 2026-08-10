import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const INVOICE_INCLUDE = {
  patient: { include: { user: true } },
  appointment: { include: { doctor: { include: { user: true, department: true } } } },
  tenant: true,
};

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private generateInvoiceNo(): string {
    return `INV-${Date.now().toString().slice(-8)}`;
  }

  async createInvoice(tenantId: string, data: any) {
    const total = Number(data.amount) - Number(data.discount || 0) + Number(data.tax || 0);
    const invoice = await this.prisma.invoice.create({
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
      include: INVOICE_INCLUDE,
    });

    const pdfUrl = await this.generatePdf(invoice);
    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
      include: INVOICE_INCLUDE,
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
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        appointment: true,
        tenant: { select: { name: true, address: true, phone: true } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────

  async getInvoicePdfFile(id: string): Promise<{ filePath: string; fileName: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    let filePath = invoice.pdfUrl ? path.join(process.cwd(), invoice.pdfUrl.replace(/^\//, '')) : null;

    if (!filePath || !fs.existsSync(filePath)) {
      const pdfUrl = await this.generatePdf(invoice);
      await this.prisma.invoice.update({ where: { id }, data: { pdfUrl } });
      filePath = path.join(process.cwd(), pdfUrl.replace(/^\//, ''));
    }

    return { filePath, fileName: `${invoice.invoiceNo}.pdf` };
  }

  private async generatePdf(invoice: any): Promise<string> {
    const PDFDocument = require('pdfkit');
    const uploadDir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `invoice_${invoice.id}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const tenant = invoice.tenant;

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const marginX = 50;
      const contentWidth = doc.page.width - marginX * 2;
      const drawDivider = () => {
        doc.moveDown(0.4);
        doc.strokeColor('#ccc').moveTo(marginX, doc.y).lineTo(marginX + contentWidth, doc.y).stroke();
        doc.strokeColor('black');
        doc.moveDown(0.5);
      };
      const sectionHeading = (title: string) => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#15803d').text(title);
        doc.fillColor('black');
        doc.moveDown(0.3);
      };
      const labelValueRow = (label: string, value: string) => {
        doc.font('Helvetica-Bold').fontSize(10).text(label, marginX, doc.y, { continued: true });
        doc.font('Helvetica').text(` : ${value}`);
      };

      // ─── Header (Arogyix + clinic letterhead) ───
      const headerY = doc.y;
      const headerHeight = 85;
      const logoSize = 50;
      const logoY = headerY + (headerHeight - logoSize) / 2;

      doc.roundedRect(marginX, headerY, contentWidth, headerHeight, 4).strokeColor('#16a34a').stroke();
      doc.strokeColor('black');

      const arogyixLogoPath = path.join(process.cwd(), 'assets', 'arogyix-logo.png');
      if (fs.existsSync(arogyixLogoPath)) {
        doc.image(arogyixLogoPath, marginX + 15, logoY, { width: logoSize, height: logoSize });
      }

      const tenantLogoPath = this.resolveTenantLogoPath(tenant?.logoUrl);
      if (tenantLogoPath) {
        doc.image(tenantLogoPath, marginX + contentWidth - logoSize - 15, logoY, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
      }

      const titleX = marginX + 75;
      const titleWidth = contentWidth - 150;
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#15803d')
        .text('AROGYIX', titleX, headerY + 14, { width: titleWidth, align: 'center' });
      doc.fontSize(12).font('Helvetica-Bold').fillColor('black')
        .text(tenant?.name || 'Hospital', titleX, headerY + 40, { width: titleWidth, align: 'center' });
      const addressLine = [tenant?.address, tenant?.city, tenant?.state].filter(Boolean).join(', ');
      if (addressLine) {
        doc.fontSize(8).font('Helvetica').fillColor('#666')
          .text(addressLine, titleX, headerY + 58, { width: titleWidth, align: 'center' });
      }
      doc.fillColor('black');
      doc.y = headerY + headerHeight + 15;

      // ─── Invoice title ───
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#15803d').text('INVOICE', { align: 'right' });
      doc.fillColor('black');
      doc.moveDown(0.3);
      drawDivider();

      // ─── Invoice meta ───
      labelValueRow('Invoice No', invoice.invoiceNo);
      labelValueRow('Invoice Date', new Date(invoice.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }));
      labelValueRow('Status', invoice.status);
      if (invoice.paidAt) {
        labelValueRow('Paid On', new Date(invoice.paidAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        }));
      }
      drawDivider();

      // ─── Patient ───
      sectionHeading('Bill To');
      const patientName = `${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`;
      labelValueRow('Patient', patientName);
      if (invoice.patient.user.phone) labelValueRow('Phone', invoice.patient.user.phone);
      if (invoice.patient.user.email) labelValueRow('Email', invoice.patient.user.email);
      drawDivider();

      // ─── Doctor / consultation ───
      const doctor = invoice.appointment?.doctor;
      if (doctor) {
        sectionHeading('Consulting Doctor');
        labelValueRow('Doctor', `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`);
        if (doctor.department?.name) labelValueRow('Department', doctor.department.name);
        drawDivider();
      }

      // ─── Charges table ───
      sectionHeading('Charges');
      const rowX = marginX;
      const rowWidth = contentWidth;
      const drawChargeRow = (label: string, value: string, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
          .text(label, rowX, doc.y, { continued: true, width: rowWidth - 120 });
        doc.text(value, { align: 'right', width: 120 });
      };
      drawChargeRow('Consultation / Service Charge', formatMoney(invoice.amount));
      if (Number(invoice.discount) > 0) drawChargeRow('Discount', `- ${formatMoney(invoice.discount)}`);
      if (Number(invoice.tax) > 0) drawChargeRow('Tax (GST)', `+ ${formatMoney(invoice.tax)}`);
      doc.moveDown(0.3);
      doc.strokeColor('#ccc').moveTo(marginX, doc.y).lineTo(marginX + contentWidth, doc.y).stroke();
      doc.strokeColor('black');
      doc.moveDown(0.3);
      doc.fillColor('#15803d');
      drawChargeRow('Total Payable', formatMoney(invoice.total), true);
      doc.fillColor('black');
      drawDivider();

      // ─── Notes ───
      if (invoice.notes) {
        sectionHeading('Notes');
        doc.fontSize(10).font('Helvetica').text(invoice.notes);
        drawDivider();
      }

      // ─── Footer ───
      doc.moveDown(1.5);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555')
        .text('This is a computer-generated invoice.', { align: 'right' });
      doc.fillColor('black');
      drawDivider();

      doc.fontSize(8).fillColor('gray').text(
        `Generated by Arogyix — ${new Date().toISOString()}`,
        { align: 'center' },
      );

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return `/uploads/invoices/${fileName}`;
  }

  private resolveTenantLogoPath(logoUrl?: string | null): string | null {
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) return null;
    const ext = path.extname(logoUrl).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return null;
    const filePath = path.join(process.cwd(), logoUrl.replace(/^\//, ''));
    return fs.existsSync(filePath) ? filePath : null;
  }
}

function formatMoney(value: any): string {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
