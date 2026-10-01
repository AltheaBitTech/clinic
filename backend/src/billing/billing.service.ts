import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ErrorAlertService } from '../monitoring/error-alert.service';
import { RazorpayService } from '../subscriptions/razorpay.service';
import { StorageService } from '../storage/storage.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  AROGYIX_WORDMARK_PNG,
  registerPdfFonts,
  loadTenantLogo,
} from '../common/utils/pdf-fonts';

const INVOICE_INCLUDE = {
  patient: { include: { user: true } },
  appointment: {
    include: { doctor: { include: { user: true, department: true } } },
  },
  doctor: { include: { user: true, department: true } },
  tenant: true,
};

// Billing only makes sense once a visit has actually happened (or is in
// progress) — an appointment that never occurred (NO_SHOW/CANCELLED) or
// hasn't started yet (SCHEDULED/CONFIRMED) shouldn't be billable.
const BILLABLE_APPOINTMENT_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

// Online invoice payments are switched off until each tenant has its own
// payout destination (e.g. a Razorpay Route linked account) — today every
// order would settle into the platform's Razorpay account, not the
// hospital's. Patients pay at the facility and staff record it via
// markAsPaid. SaaS subscription billing is unaffected.
const ONLINE_INVOICE_PAYMENTS_ENABLED = false;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private razorpay: RazorpayService,
    private storageService: StorageService,
    private errorAlerts: ErrorAlertService,
  ) {}

  private generateInvoiceNo(): string {
    return `INV-${Date.now().toString().slice(-8)}`;
  }

  async createInvoice(tenantId: string, data: any) {
    // Every invoice must be tied to the treating doctor: either derived from
    // the billed appointment, or supplied directly for a standalone invoice.
    // Never trust a client-supplied doctorId when an appointment is present —
    // the appointment's own doctor is the source of truth.
    let doctorId: string | null = null;

    if (data.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: data.appointmentId, tenantId },
      });
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }
      if (!BILLABLE_APPOINTMENT_STATUSES.includes(appointment.status)) {
        throw new BadRequestException(
          'A bill can only be generated once the patient is checked in or the appointment is completed',
        );
      }
      doctorId = appointment.doctorId;
    } else {
      if (!data.doctorId) {
        throw new BadRequestException(
          'A doctor must be selected to generate an invoice',
        );
      }
      const doctor = await this.prisma.doctor.findFirst({
        where: { id: data.doctorId, tenantId },
      });
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }
      doctorId = doctor.id;

      // A standalone invoice (e.g. an ECG or dressing) still needs a real
      // visit behind it: the patient must be checked in today or have a
      // completed visit at this hospital.
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      const eligibleVisit = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          patientId: data.patientId,
          OR: [
            { status: 'COMPLETED' },
            {
              status: 'IN_PROGRESS',
              OR: [
                { checkedInAt: { gte: startOfToday, lt: startOfTomorrow } },
                { scheduledAt: { gte: startOfToday, lt: startOfTomorrow } },
              ],
            },
          ],
        },
        select: { id: true },
      });
      if (!eligibleVisit) {
        throw new BadRequestException(
          'An invoice can only be created for a patient who is checked in today or has a completed visit',
        );
      }
    }

    const total =
      Number(data.amount) - Number(data.discount || 0) + Number(data.tax || 0);
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        doctorId,
        invoiceNo: this.generateInvoiceNo(),
        amount: data.amount,
        discount: data.discount,
        tax: data.tax,
        total,
        notes: data.notes,
      },
      include: INVOICE_INCLUDE,
    });

    // A PDF failure must not fail billing: the invoice row already exists and
    // the download endpoint regenerates the PDF on demand.
    let pdfUrl: string | null = null;
    try {
      pdfUrl = (await this.generatePdf(invoice)).url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Invoice PDF generation failed (invoiceId=${invoice.id}, error=${message})`,
      );
      await this.errorAlerts.report(error, {
        source: 'billing:invoice-pdf',
        tenantId: invoice.tenantId,
        extra: { invoiceId: invoice.id },
      });
    }
    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
      include: INVOICE_INCLUDE,
    });

    try {
      const patientUser = updated.patient.user;
      await this.emailService.sendInvoiceCreated({
        recipientEmail: patientUser.email,
        patientName: `${patientUser.firstName} ${patientUser.lastName}`.trim(),
        invoiceNo: updated.invoiceNo,
        amount: Number(updated.total),
        hospitalName: updated.tenant.name,
        invoiceId: updated.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Invoice created email failed (invoiceId=${updated.id}, error=${message})`,
      );
    }

    return updated;
  }

  private buildDateRangeWhere(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    const range: { gte?: Date; lte?: Date } = {};
    if (startDate) range.gte = new Date(startDate);
    if (endDate) range.lte = new Date(endDate);
    return range;
  }

  async findAll(
    tenantId: string,
    patientId?: string,
    status?: string,
    page = 1,
    limit = 20,
    startDate?: string,
    endDate?: string,
  ) {
    page = Number(page) || 1;
    limit = Number(limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    const createdAtRange = this.buildDateRangeWhere(startDate, endDate);
    if (createdAtRange) where.createdAt = createdAtRange;

    const revenueWhere: any = { tenantId, status: 'PAID' };
    const paidAtRange = this.buildDateRangeWhere(startDate, endDate);
    if (paidAtRange) revenueWhere.paidAt = paidAtRange;

    const [data, total, revenue] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          appointment: {
            select: {
              scheduledAt: true,
              doctor: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.aggregate({
        where: revenueWhere,
        _sum: { total: true },
      }),
    ]);

    return { data, total, page, limit, totalRevenue: revenue._sum.total || 0 };
  }

  async exportInvoices(
    tenantId: string,
    patientId?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    const createdAtRange = this.buildDateRangeWhere(startDate, endDate);
    if (createdAtRange) where.createdAt = createdAtRange;

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        appointment: {
          select: {
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = [
      'Invoice No',
      'Patient Name',
      'Doctor',
      'Issue Date',
      'Amount',
      'Discount',
      'Tax',
      'Total',
      'Status',
      'Paid At',
    ];
    const rows = invoices.map((inv) => {
      const patientName =
        `${inv.patient.user.firstName} ${inv.patient.user.lastName}`.trim();
      const invoiceDoctor = inv.doctor || inv.appointment?.doctor;
      const doctor = invoiceDoctor
        ? `Dr. ${invoiceDoctor.user.firstName} ${invoiceDoctor.user.lastName}`
        : 'N/A';
      return [
        inv.invoiceNo,
        patientName,
        doctor,
        inv.createdAt.toISOString(),
        Number(inv.amount).toFixed(2),
        Number(inv.discount || 0).toFixed(2),
        Number(inv.tax || 0).toFixed(2),
        Number(inv.total).toFixed(2),
        inv.status,
        inv.paidAt ? inv.paidAt.toISOString() : '',
      ]
        .map((field) => escapeCsv(String(field)))
        .join(',');
    });

    return [header.join(','), ...rows].join('\n');
  }

  // Staff manually recording an in-person cash/card payment. Online payments
  // from patients go through createPaymentOrder + verifyPayment instead, and
  // never call this directly.
  async markAsPaid(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { appointment: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') return this.findOne(id);

    if (
      invoice.appointment &&
      !BILLABLE_APPOINTMENT_STATUSES.includes(invoice.appointment.status)
    ) {
      throw new BadRequestException(
        'Invoice cannot be marked as paid before the patient is checked in or the appointment is completed',
      );
    }

    return this.finalizePayment(id);
  }

  // Step 1 of the online payment flow: open a Razorpay order for the
  // invoice's total so the checkout widget can present UPI/card/net
  // banking/wallet options. The invoice stays PENDING until verifyPayment
  // confirms a signed payment against this order.
  async createPaymentOrder(id: string) {
    if (!ONLINE_INVOICE_PAYMENTS_ENABLED) {
      throw new BadRequestException(
        'Online payment is not available — please pay at the reception',
      );
    }

    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'PENDING') {
      throw new BadRequestException('Invoice is not pending payment');
    }

    const order = await this.razorpay.client.orders.create({
      amount: Math.round(Number(invoice.total) * 100),
      currency: 'INR',
      receipt: invoice.invoiceNo,
      notes: { invoiceId: invoice.id },
    });

    await this.prisma.invoice.update({
      where: { id },
      data: { razorpayOrderId: order.id },
    });

    return {
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      invoiceNo: invoice.invoiceNo,
    };
  }

  // Step 2: verify the signature Razorpay's checkout widget handed back
  // before trusting that the payment actually happened. This is the only
  // thing standing between "the browser said it paid" and marking the
  // invoice PAID, so it must be done server-side against the key secret.
  async verifyPayment(
    id: string,
    data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      paymentMethod: PaymentMethod;
    },
  ) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') return this.findOne(id);
    if (
      !invoice.razorpayOrderId ||
      invoice.razorpayOrderId !== data.razorpayOrderId
    ) {
      throw new BadRequestException(
        'Payment order does not match this invoice — start the payment again',
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured (missing RAZORPAY_KEY_SECRET)',
      );
    }
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(data.razorpaySignature);
    const valid =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);
    if (!valid) {
      throw new UnauthorizedException('Payment verification failed');
    }

    return this.finalizePayment(id, {
      paymentMethod: data.paymentMethod,
      razorpayPaymentId: data.razorpayPaymentId,
    });
  }

  // Server-side backstop for the online payment flow: verifyPayment above
  // only fires if the browser is still around to run Razorpay's `handler`
  // callback, which UPI app-switches on mobile can interrupt (user pays in
  // their UPI app, the tab gets backgrounded/killed, and it never returns).
  // This webhook lets Razorpay tell us directly that the payment captured,
  // so the invoice still gets marked PAID even if the client never checks in.
  async handlePaymentWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
    parsedBody: any,
  ): Promise<{ received: true }> {
    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured (missing RAZORPAY_WEBHOOK_SECRET)',
      );
    }

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    const valid =
      signatureBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(signatureBuf, expectedBuf);
    if (!valid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const eventId: string =
      parsedBody?.id ??
      crypto.createHash('sha256').update(rawBody).digest('hex');

    try {
      await this.prisma.webhookEvent.create({
        data: {
          eventId,
          eventType: parsedBody?.event ?? 'unknown',
          payload: parsedBody,
        },
      });
    } catch {
      // Already processed (unique constraint on eventId) — ack without redoing work.
      return { received: true };
    }

    try {
      await this.handlePaymentEvent(parsedBody);
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { processedAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to process billing webhook ${eventId}: ${err?.message}`,
      );
      await this.errorAlerts.report(err, {
        source: 'outbound:razorpay-webhook',
        extra: { flow: 'invoice payment', eventId, event: parsedBody?.event },
      });
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { error: String(err?.message ?? err) },
      });
    }

    return { received: true };
  }

  private async handlePaymentEvent(body: any) {
    if (body?.event !== 'payment.captured') return;

    const payment = body?.payload?.payment?.entity;
    const orderId: string | undefined = payment?.order_id;
    if (!orderId) return;

    const invoice = await this.prisma.invoice.findFirst({
      where: { razorpayOrderId: orderId },
    });
    if (!invoice) {
      this.logger.warn(`Webhook payment.captured for unknown order ${orderId}`);
      return;
    }
    if (invoice.status === 'PAID') return;

    const methodMap: Record<string, PaymentMethod> = {
      upi: 'UPI',
      card: 'CARD',
      netbanking: 'NETBANKING',
      wallet: 'WALLET',
    };

    await this.finalizePayment(invoice.id, {
      paymentMethod: methodMap[payment?.method] ?? undefined,
      razorpayPaymentId: payment?.id,
    });
  }

  private async finalizePayment(
    id: string,
    payment?: { paymentMethod?: PaymentMethod; razorpayPaymentId?: string },
  ) {
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: payment?.paymentMethod,
        razorpayPaymentId: payment?.razorpayPaymentId,
      },
      include: INVOICE_INCLUDE,
    });

    try {
      const patientUser = updated.patient.user;
      await this.emailService.sendPaymentReceived({
        recipientEmail: patientUser.email,
        patientName: `${patientUser.firstName} ${patientUser.lastName}`.trim(),
        invoiceNo: updated.invoiceNo,
        amount: Number(updated.total),
        hospitalName: updated.tenant.name,
        invoiceId: updated.id,
        paidAt: updated.paidAt ?? undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Payment received email failed (invoiceId=${updated.id}, error=${message})`,
      );
    }

    return updated;
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

  async getInvoicePdfFile(
    id: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Always re-render: status / payment details change after creation, so a
    // cached PDF would show a stale "PENDING" invoice.
    const { url, buffer } = await this.generatePdf(invoice);
    if (url !== invoice.pdfUrl) {
      await this.prisma.invoice.update({
        where: { id },
        data: { pdfUrl: url },
      });
    }

    return { buffer, fileName: `${invoice.invoiceNo}.pdf` };
  }

  private async generatePdf(
    invoice: any,
  ): Promise<{ url: string; buffer: Buffer }> {
    const PDFDocument = require('pdfkit');
    const fileName = `invoice_${invoice.id}.pdf`;
    const tenant = invoice.tenant;
    const pUser = invoice.patient.user;
    const patient = invoice.patient;
    const appt = invoice.appointment;
    const doctor = invoice.doctor || appt?.doctor;

    const C = {
      dark: '#064e3b',
      primary: '#15803d',
      accent: '#84cc16',
      text: '#0f172a',
      muted: '#64748b',
      line: '#e2e8f0',
      soft: '#f0fdf4',
      card: '#f8fafc',
    };
    const STATUS: Record<string, [string, string]> = {
      PAID: ['#15803d', '#dcfce7'],
      PENDING: ['#b45309', '#fef3c7'],
      REFUNDED: ['#1d4ed8', '#dbeafe'],
      CANCELLED: ['#b91c1c', '#fee2e2'],
    };
    const fmtDate = (d?: Date | string | null, withTime = false) =>
      d
        ? new Date(d).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            ...(withTime
              ? { hour: '2-digit', minute: '2-digit', hour12: true }
              : {}),
            timeZone: 'Asia/Kolkata',
          })
        : '';
    const age = patient.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 3600 * 1000),
        )
      : null;
    const cap = (s?: string | null) =>
      s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : '';
    const doctorName = doctor
      ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`.trim()
      : '';

    const tenantLogo = await loadTenantLogo(
      this.storageService,
      tenant?.logoUrl,
    );
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `Invoice ${invoice.invoiceNo}`,
          Author: tenant?.name || 'Arogyix',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      registerPdfFonts(doc);

      const PW = doc.page.width;
      const PH = doc.page.height;
      const M = 40;
      const W = PW - M * 2;
      const grad = (x: number, w: number, from = '#bbf7d0', to = '#ecfccb') =>
        doc
          .linearGradient(x, 0, x + w, 0)
          .stop(0, from)
          .stop(1, to);
      // Single-line text that truncates instead of wrapping onto the next row.
      const line = (
        text: string,
        x: number,
        y: number,
        w: number,
        opts: any = {},
      ) =>
        doc.text(text, x, y, {
          width: w,
          height: doc._fontSize * 1.3,
          ellipsis: true,
          lineBreak: false,
          ...opts,
        });

      // ─── Top accent strip ───
      doc.rect(0, 0, PW, 8).fill(grad(0, PW, C.dark, C.accent));

      // ─── Arogyix wordmark + INVOICE title ───
      let y = 28;
      doc.image(AROGYIX_WORDMARK_PNG, M, y, { height: 46 });
      doc.font('Bold').fontSize(28).fillColor(C.dark);
      line('INVOICE', M, y, W, { align: 'right', characterSpacing: 3 });
      doc.font('Body').fontSize(10).fillColor(C.muted);
      line(`# ${invoice.invoiceNo}`, M, y + 38, W, { align: 'right' });

      // ─── Hospital band ───
      y = 90;
      const bandH = 82;
      doc.roundedRect(M, y, W, bandH, 10).fill(grad(M, W));
      const logoBox = 58;
      const lx = M + 14;
      const ly = y + (bandH - logoBox) / 2;
      doc.roundedRect(lx, ly, logoBox, logoBox, 10).fill('#ffffff');
      if (tenantLogo) {
        doc.image(tenantLogo, lx + 5, ly + 5, {
          fit: [logoBox - 10, logoBox - 10],
          align: 'center',
          valign: 'center',
        });
      } else {
        const initials = (tenant?.name || 'H')
          .split(/\s+/)
          .slice(0, 2)
          .map((w: string) => w[0])
          .join('')
          .toUpperCase();
        doc.font('Bold').fontSize(20).fillColor(C.primary);
        line(initials, lx, ly + 19, logoBox, { align: 'center' });
      }

      const pillW = 112;
      const tx = lx + logoBox + 14;
      const tw = M + W - pillW - 30 - tx;
      doc.font('Bold').fontSize(15).fillColor(C.dark);
      line(tenant?.name || 'Hospital', tx, y + 13, tw);
      doc.font('Body').fontSize(8.5).fillColor('#166534');
      const addr = [tenant?.address, tenant?.city, tenant?.state]
        .filter(Boolean)
        .join(', ');
      const contact = [
        tenant?.phone && `Ph: ${tenant.phone}`,
        tenant?.email,
        tenant?.website,
      ]
        .filter(Boolean)
        .join('   |   ');
      let ty = y + 33;
      for (const t of [
        addr,
        contact,
        tenant?.licenseNumber && `Reg. No: ${tenant.licenseNumber}`,
      ].filter(Boolean)) {
        line(t, tx, ty, tw);
        ty += 12;
      }

      const [sFg, sBg] = STATUS[invoice.status] ?? [C.muted, '#f1f5f9'];
      const px = M + W - pillW - 16;
      doc.font('Bold').fontSize(7.5).fillColor('#166534');
      line('PAYMENT STATUS', px, y + 20, pillW, {
        align: 'center',
        characterSpacing: 1,
      });
      doc.roundedRect(px, y + 34, pillW, 26, 13).fill('#ffffff');
      doc.font('Bold').fontSize(11).fillColor(sFg);
      line(invoice.status, px, y + 41.5, pillW, { align: 'center' });

      // ─── Info cards ───
      y = 190;
      const gap = 12;
      const cardW = (W - gap * 2) / 3;
      const cards: [string, string, [string, string][]][] = [
        [
          'BILLED TO',
          '#0d9488',
          [
            ['Name', `${pUser.firstName} ${pUser.lastName}`.trim()],
            ['Patient ID', patient.patientCode],
            [
              'Age / Sex',
              [age !== null ? `${age} yrs` : '', cap(patient.gender)]
                .filter(Boolean)
                .join(' / '),
            ],
            ['Blood Grp', patient.bloodGroup],
            ['Phone', pUser.phone],
            ['Email', pUser.email],
            [
              'Address',
              [patient.address, patient.city].filter(Boolean).join(', '),
            ],
          ],
        ],
        [
          'VISIT DETAILS',
          '#2563eb',
          doctor
            ? [
                ['Doctor', doctorName],
                ['Speciality', doctor.specialization],
                ['Department', doctor.department?.name],
                ['Reg. No', doctor.registrationNo],
                ['Visit On', fmtDate(appt.scheduledAt, true)],
                ['Visit Type', cap(appt.type)],
                ['Reason', appt.reason],
              ]
            : [['Visit', 'General billing']],
        ],
        [
          'INVOICE DETAILS',
          '#7c3aed',
          [
            ['Invoice No', invoice.invoiceNo],
            ['Issued On', fmtDate(invoice.createdAt, true)],
            ['Status', cap(invoice.status)],
            ['Paid On', fmtDate(invoice.paidAt, true)],
            ['Method', invoice.paymentMethod],
            ['Txn ID', invoice.razorpayPaymentId],
          ],
        ],
      ];
      const rowsOf = (rows: [string, any][]) =>
        rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
      // Values wrap to at most two lines; each card grows to the tallest one.
      const valW = cardW - 74;
      doc.font('Bold').fontSize(8.5);
      const rowHeights = cards.map(([, , rows]) =>
        rowsOf(rows).map(
          ([, v]) =>
            Math.min(doc.heightOfString(String(v), { width: valW }), 26) + 3,
        ),
      );
      const cardH =
        36 + Math.max(...rowHeights.map((h) => h.reduce((s, x) => s + x, 0)));
      cards.forEach(([title, color, rows], i) => {
        const cx = M + i * (cardW + gap);
        doc.roundedRect(cx, y, cardW, cardH, 8).fill(C.card);
        doc
          .roundedRect(cx, y, cardW, cardH, 8)
          .lineWidth(0.6)
          .strokeColor(C.line)
          .stroke();
        doc.rect(cx + 12, y, cardW - 24, 3).fill(color);
        doc.font('Bold').fontSize(8.5).fillColor(color);
        line(title, cx + 12, y + 12, cardW - 24, { characterSpacing: 1 });
        let ry = y + 30;
        rowsOf(rows).forEach(([label, value], r) => {
          doc.font('Body').fontSize(7.5).fillColor(C.muted);
          line(label, cx + 12, ry + 0.8, 50);
          doc.font('Bold').fontSize(8.5).fillColor(C.text);
          doc.text(String(value), cx + 62, ry, {
            width: valW,
            height: 26,
            ellipsis: true,
          });
          ry += rowHeights[i][r];
        });
      });

      // ─── Items table ───
      y += cardH + 22;
      const cols = [
        { label: '#', w: 30, align: 'center' },
        { label: 'DESCRIPTION', w: W - 30 - 45 - 95 - 105, align: 'left' },
        { label: 'QTY', w: 45, align: 'center' },
        { label: 'RATE', w: 95, align: 'right' },
        { label: 'AMOUNT', w: 105, align: 'right' },
      ];
      const colX = (i: number) =>
        M + cols.slice(0, i).reduce((s, c) => s + c.w, 0);
      doc.roundedRect(M, y, W, 26, 6).fill(grad(M, W));
      doc.font('Bold').fontSize(8.5).fillColor(C.dark);
      cols.forEach((c, i) =>
        line(c.label, colX(i) + 10, y + 9, c.w - 20, {
          align: c.align,
          characterSpacing: 0.8,
        }),
      );
      y += 26;
      const itemH = 44;
      doc.rect(M, y, W, itemH).fill(C.soft);
      const desc = doctor
        ? `${cap(appt.type) || 'Consultation'} with ${doctorName}`
        : 'Hospital Service Charge';
      const sub = [
        doctor?.department?.name || doctor?.specialization,
        appt && fmtDate(appt.scheduledAt),
      ]
        .filter(Boolean)
        .join('  •  ');
      const amount = formatMoney(invoice.amount);
      doc.font('Body').fontSize(9.5).fillColor(C.text);
      line('1', colX(0) + 10, y + 11, cols[0].w - 20, { align: 'center' });
      doc.font('Bold').fontSize(10);
      line(desc, colX(1) + 10, y + 10, cols[1].w - 20);
      if (sub) {
        doc.font('Body').fontSize(8).fillColor(C.muted);
        line(sub, colX(1) + 10, y + 25, cols[1].w - 20);
      }
      doc.font('Body').fontSize(9.5).fillColor(C.text);
      line('1', colX(2) + 10, y + 11, cols[2].w - 20, { align: 'center' });
      line(amount, colX(3) + 10, y + 11, cols[3].w - 20, { align: 'right' });
      doc.font('Bold');
      line(amount, colX(4) + 10, y + 11, cols[4].w - 20, { align: 'right' });
      y += itemH;
      doc
        .moveTo(M, y)
        .lineTo(M + W, y)
        .lineWidth(1)
        .strokeColor(C.primary)
        .stroke();

      // ─── Totals (right) ───
      y += 16;
      const totW = 230;
      const totX = M + W - totW;
      let ay = y;
      const totalRow = (label: string, value: string, color = C.text) => {
        doc.font('Body').fontSize(9.5).fillColor(C.muted);
        line(label, totX + 12, ay, 110);
        doc.font('Bold').fillColor(color);
        line(value, totX + 110, ay, totW - 122, { align: 'right' });
        ay += 20;
      };
      totalRow('Subtotal', amount);
      if (Number(invoice.discount) > 0)
        totalRow('Discount', `- ${formatMoney(invoice.discount)}`, '#dc2626');
      if (Number(invoice.tax) > 0)
        totalRow('Tax (GST)', `+ ${formatMoney(invoice.tax)}`, '#2563eb');
      ay += 2;
      doc.roundedRect(totX, ay, totW, 40, 8).fill(grad(totX, totW));
      doc.font('Bold').fontSize(10).fillColor('#166534');
      line(
        invoice.status === 'PAID' ? 'TOTAL PAID' : 'TOTAL PAYABLE',
        totX + 14,
        ay + 15,
        100,
        { characterSpacing: 0.8 },
      );
      doc.fontSize(16).fillColor(C.dark);
      line(formatMoney(invoice.total), totX + 100, ay + 12, totW - 114, {
        align: 'right',
      });
      ay += 40;

      // ─── Amount in words + payment info (left) ───
      const leftW = W - totW - 24;
      doc.font('Bold').fontSize(8).fillColor(C.muted);
      line('AMOUNT IN WORDS', M, y, leftW, { characterSpacing: 0.8 });
      doc.font('Italic').fontSize(9.5).fillColor(C.text);
      doc.text(amountInWords(invoice.total), M, y + 13, {
        width: leftW,
        height: 26,
        ellipsis: true,
      });
      const paid = invoice.status === 'PAID';
      const [pFg, pBg] = STATUS[invoice.status] ?? [C.muted, '#f1f5f9'];
      const infoY = y + 46;
      doc.roundedRect(M, infoY, leftW, 44, 8).fill(pBg);
      doc.rect(M, infoY, 4, 44).fill(pFg);
      doc.font('Bold').fontSize(9.5).fillColor(pFg);
      line(
        paid ? 'Payment received - thank you!' : 'Payment information',
        M + 14,
        infoY + 9,
        leftW - 24,
      );
      doc.font('Body').fontSize(8.5).fillColor(C.text);
      line(
        paid
          ? [
              invoice.paymentMethod && `Paid via ${invoice.paymentMethod}`,
              invoice.paidAt && `on ${fmtDate(invoice.paidAt, true)}`,
            ]
              .filter(Boolean)
              .join(' ') || 'Paid in full'
          : invoice.status === 'PENDING'
            ? ONLINE_INVOICE_PAYMENTS_ENABLED
              ? 'Pay online via the patient portal or at the reception.'
              : 'Please pay at the reception.'
            : `This invoice is ${cap(invoice.status).toLowerCase()}.`,
        M + 14,
        infoY + 25,
        leftW - 24,
      );

      // ─── Notes ───
      y = Math.max(ay, infoY + 44) + 20;
      if (invoice.notes) {
        doc.font('Body').fontSize(9);
        const notesH =
          Math.min(doc.heightOfString(invoice.notes, { width: W - 28 }), 80) +
          32;
        doc.roundedRect(M, y, W, notesH, 8).fill('#fffbeb');
        doc.rect(M, y, 4, notesH).fill('#f59e0b');
        doc.font('Bold').fontSize(8.5).fillColor('#b45309');
        line('NOTES', M + 14, y + 10, W - 28, { characterSpacing: 1 });
        doc.font('Body').fontSize(9).fillColor(C.text);
        doc.text(invoice.notes, M + 14, y + 24, {
          width: W - 28,
          height: 80,
          ellipsis: true,
        });
      }

      // ─── Footer ───
      const fy = PH - 92;
      doc
        .moveTo(M, fy)
        .lineTo(M + W, fy)
        .lineWidth(0.6)
        .strokeColor(C.line)
        .stroke();
      doc.font('Bold').fontSize(11).fillColor(C.primary);
      line(
        `Thank you for choosing ${tenant?.name || 'us'}. Wishing you good health!`,
        M,
        fy + 14,
        W,
        { align: 'center' },
      );
      doc.font('Body').fontSize(8).fillColor(C.muted);
      line(
        'This is a computer-generated invoice and does not require a signature.',
        M,
        fy + 32,
        W,
        { align: 'center' },
      );
      doc.rect(0, PH - 30, PW, 30).fill(grad(0, PW));
      doc.font('Body').fontSize(8).fillColor('#166534');
      line(
        `Powered by Arogyix   •   Generated on ${fmtDate(new Date(), true)}`,
        0,
        PH - 19,
        PW,
        { align: 'center' },
      );

      doc.end();
    });

    const url = await this.storageService.uploadBuffer(
      `invoices/${invoice.tenantId}/${fileName}`,
      pdfBuffer,
      'application/pdf',
      { upsert: true },
    );
    return { url, buffer: pdfBuffer };
  }
}

function formatMoney(value: any): string {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Indian numbering: 123456.5 -> "Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six and Fifty Paise Only"
export function amountInWords(value: any): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  const two = (n: number) =>
    n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
  const words = (n: number): string => {
    const parts: string[] = [];
    if (n >= 1e7) parts.push(`${words(Math.floor(n / 1e7))} Crore`);
    if ((n %= 1e7) >= 1e5) parts.push(`${two(Math.floor(n / 1e5))} Lakh`);
    if ((n %= 1e5) >= 1000) parts.push(`${two(Math.floor(n / 1000))} Thousand`);
    if ((n %= 1000) >= 100) parts.push(`${ones[Math.floor(n / 100)]} Hundred`);
    if (n % 100) parts.push(two(n % 100));
    return parts.join(' ');
  };
  const cents = Math.round(Number(value || 0) * 100);
  const rupees = Math.floor(cents / 100);
  const paise = cents % 100;
  return `Rupees ${words(rupees) || 'Zero'}${paise ? ` and ${two(paise)} Paise` : ''} Only`;
}
