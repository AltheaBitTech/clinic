import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  LabOrderItemStatus,
  LabOrderStatus,
  LabReportStatus,
  ReportType,
  ResultFlag,
  TimelineEventType,
} from '@prisma/client';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LabAuditService } from '../pathology-shared/lab-audit.service';
import { StorageService } from '../storage/storage.service';
import {
  AROGYIX_WORDMARK_PNG,
  registerPdfFonts,
} from '../common/utils/pdf-fonts';
import {
  AcknowledgeCriticalDto,
  AmendReportDto,
  EnterLabResultsDto,
  SendLabReportEmailDto,
} from './dto/lab-result.dto';

@Injectable()
export class PathologyResultsService {
  private readonly logger = new Logger(PathologyResultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: LabAuditService,
    private readonly storageService: StorageService,
  ) {}

  private async getOrderItemForLab(orderItemId: string, labId: string) {
    const item = await this.prisma.labOrderItem.findFirst({
      where: { id: orderItemId, order: { labId } },
      include: { order: true, test: { include: { parameters: true } } },
    });
    if (!item) throw new NotFoundException('Order item not found');
    return item;
  }

  /**
   * CRITICAL always wins when the numeric value falls outside the
   * parameter's critical range; otherwise falls back to the caller's
   * explicit flag (defaulting to NORMAL). Avoids hard-coding ranges —
   * everything is read off LabTestParameterDef, set per lab/test.
   */
  private computeFlag(
    rawValue: string,
    param: {
      criticalRangeLow?: unknown;
      criticalRangeHigh?: unknown;
      refRangeLow?: unknown;
      refRangeHigh?: unknown;
    } | null,
    explicitFlag?: ResultFlag,
  ): ResultFlag {
    const numeric = Number(rawValue);
    if (param && !Number.isNaN(numeric)) {
      const critLow =
        param.criticalRangeLow != null ? Number(param.criticalRangeLow) : null;
      const critHigh =
        param.criticalRangeHigh != null
          ? Number(param.criticalRangeHigh)
          : null;
      if (
        (critLow != null && numeric < critLow) ||
        (critHigh != null && numeric > critHigh)
      ) {
        return ResultFlag.CRITICAL;
      }
      if (!explicitFlag) {
        const low =
          param.refRangeLow != null ? Number(param.refRangeLow) : null;
        const high =
          param.refRangeHigh != null ? Number(param.refRangeHigh) : null;
        if (low != null && numeric < low) return ResultFlag.LOW;
        if (high != null && numeric > high) return ResultFlag.HIGH;
      }
    }
    return explicitFlag ?? ResultFlag.NORMAL;
  }

  async enterResults(
    orderItemId: string,
    labId: string,
    userId: string,
    dto: EnterLabResultsDto,
  ) {
    const item = await this.getOrderItemForLab(orderItemId, labId);
    const allowed: LabOrderStatus[] = [
      LabOrderStatus.ACCEPTED,
      LabOrderStatus.IN_PROGRESS,
    ];
    if (!allowed.includes(item.order.status)) {
      throw new BadRequestException(
        `Cannot enter results while the order is ${item.order.status}`,
      );
    }

    const paramsById = new Map(item.test.parameters.map((p) => [p.id, p]));

    await this.prisma.$transaction(async (tx) => {
      await tx.labResultValue.deleteMany({ where: { orderItemId } });
      await tx.labResultValue.createMany({
        data: dto.results.map((r) => {
          const param = r.parameterId ? paramsById.get(r.parameterId) : null;
          const flag = this.computeFlag(r.value, param ?? null, r.flag);
          return {
            orderItemId,
            parameterId: r.parameterId,
            parameterNameSnapshot: r.parameterNameSnapshot,
            resultType: r.resultType,
            value: r.value,
            unit: r.unit,
            refRangeText: r.refRangeText,
            flag,
            comment: r.comment,
            attachmentUrl: r.attachmentUrl,
            isCritical: flag === ResultFlag.CRITICAL,
            enteredByUserId: userId,
          };
        }),
      });
      await tx.labOrderItem.update({
        where: { id: orderItemId },
        data: { status: LabOrderItemStatus.COMPLETED },
      });

      const remaining = await tx.labOrderItem.count({
        where: {
          orderId: item.orderId,
          status: { not: LabOrderItemStatus.COMPLETED },
        },
      });
      if (remaining === 0) {
        await tx.labOrder.update({
          where: { id: item.orderId },
          data: {
            status: LabOrderStatus.RESULT_READY,
            resultReadyAt: new Date(),
          },
        });
      } else if (item.order.status === LabOrderStatus.ACCEPTED) {
        await tx.labOrder.update({
          where: { id: item.orderId },
          data: { status: LabOrderStatus.IN_PROGRESS },
        });
      }
    });

    await this.auditService.log(
      labId,
      userId,
      'ENTER_RESULTS',
      'LabOrderItem',
      orderItemId,
    );
    return this.prisma.labOrderItem.findUnique({
      where: { id: orderItemId },
      include: { resultValues: true },
    });
  }

  async notifyCritical(resultValueId: string, labId: string, userId: string) {
    const result = await this.prisma.labResultValue.findFirst({
      where: { id: resultValueId, orderItem: { order: { labId } } },
      include: { orderItem: { include: { order: true } } },
    });
    if (!result) throw new NotFoundException('Result value not found');
    if (!result.isCritical) {
      throw new BadRequestException('This result is not flagged critical');
    }
    const updated = await this.prisma.labResultValue.update({
      where: { id: resultValueId },
      data: {
        doctorNotified: true,
        notifiedAt: new Date(),
        notifiedByUserId: userId,
      },
    });
    await this.auditService.log(
      labId,
      userId,
      'NOTIFY_CRITICAL',
      'LabResultValue',
      resultValueId,
    );

    const order = result.orderItem.order;
    if (order.hospitalTenantId && order.orderedByUserId) {
      try {
        await this.notificationsService.create(
          order.orderedByUserId,
          'Critical lab result flagged',
          `A critical result (${result.parameterNameSnapshot}) was flagged for order ${order.orderNo}.`,
          'PUSH',
          undefined,
          { type: 'LAB_RESULT_CRITICAL', labOrderId: order.id, resultValueId },
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.error(
          `Critical result notification failed (orderId=${order.id}, error=${message})`,
        );
      }
    }

    return updated;
  }

  async acknowledgeCritical(
    resultValueId: string,
    labId: string,
    userId: string,
    dto: AcknowledgeCriticalDto,
  ) {
    const result = await this.prisma.labResultValue.findFirst({
      where: { id: resultValueId, orderItem: { order: { labId } } },
    });
    if (!result) throw new NotFoundException('Result value not found');
    if (!result.doctorNotified) {
      throw new BadRequestException(
        'The doctor must be notified before acknowledgement is recorded',
      );
    }
    const updated = await this.prisma.labResultValue.update({
      where: { id: resultValueId },
      data: {
        acknowledgedByUserId: userId,
        acknowledgedAt: new Date(),
        escalated: dto.escalated ?? result.escalated,
        comment: dto.notes
          ? [result.comment, dto.notes].filter(Boolean).join(' | ')
          : result.comment,
      },
    });
    await this.auditService.log(
      labId,
      userId,
      'ACKNOWLEDGE_CRITICAL',
      'LabResultValue',
      resultValueId,
    );
    return updated;
  }

  async submitForVerification(orderId: string, labId: string, userId: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, labId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== LabOrderStatus.RESULT_READY) {
      throw new BadRequestException(
        'Results must be entered for every test before submitting for verification',
      );
    }

    const now = new Date();
    const [, updatedOrder] = await this.prisma.$transaction([
      this.prisma.labReport.upsert({
        where: { orderId },
        create: {
          orderId,
          labId,
          patientId: order.patientId,
          submittedByUserId: userId,
          submittedAt: now,
          status: LabReportStatus.PENDING_VERIFICATION,
        },
        update: {
          submittedByUserId: userId,
          submittedAt: now,
          status: LabReportStatus.PENDING_VERIFICATION,
        },
      }),
      this.prisma.labOrder.update({
        where: { id: orderId },
        data: {
          status: LabOrderStatus.PENDING_VERIFICATION,
          submittedForVerificationAt: now,
          submittedByUserId: userId,
        },
        include: { report: true, patient: true },
      }),
    ]);

    await this.auditService.log(
      labId,
      userId,
      'SUBMIT_FOR_VERIFICATION',
      'LabOrder',
      orderId,
    );
    return updatedOrder;
  }

  async verify(orderId: string, labId: string, userId: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, labId },
      include: {
        items: { include: { resultValues: true, test: true } },
        patient: true,
        lab: true,
        report: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== LabOrderStatus.PENDING_VERIFICATION) {
      throw new BadRequestException(
        'Order must be submitted for verification first',
      );
    }

    const pdfUrl = await this.generateReportPdf(order);

    const [, updatedOrder] = await this.prisma.$transaction([
      this.prisma.labReport.upsert({
        where: { orderId },
        create: {
          orderId,
          labId,
          patientId: order.patientId,
          fileUrl: pdfUrl,
          fileName: path.basename(pdfUrl),
          generatedAt: new Date(),
          verifiedByUserId: userId,
          verifiedAt: new Date(),
          status: LabReportStatus.VERIFIED,
        },
        update: {
          fileUrl: pdfUrl,
          fileName: path.basename(pdfUrl),
          generatedAt: new Date(),
          verifiedByUserId: userId,
          verifiedAt: new Date(),
          status: LabReportStatus.VERIFIED,
        },
      }),
      this.prisma.labOrder.update({
        where: { id: orderId },
        data: {
          status: LabOrderStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedByUserId: userId,
        },
        include: { report: true, patient: true },
      }),
    ]);

    await this.auditService.log(labId, userId, 'VERIFY', 'LabOrder', orderId);
    return updatedOrder;
  }

  async deliver(orderId: string, labId: string, userId: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, labId },
      include: { report: true, patient: true, lab: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== LabOrderStatus.VERIFIED || !order.report) {
      throw new BadRequestException(
        'Order must be verified before the report can be delivered',
      );
    }

    const now = new Date();
    const [, updatedOrder] = await this.prisma.$transaction([
      this.prisma.labReport.update({
        where: { orderId },
        data: { status: LabReportStatus.DELIVERED, deliveredAt: now },
      }),
      this.prisma.labOrder.update({
        where: { id: orderId },
        data: {
          status: LabOrderStatus.REPORT_DELIVERED,
          reportDeliveredAt: now,
        },
        include: { report: true, patient: true },
      }),
    ]);

    if (order.hospitalTenantId && order.hospitalPatientId) {
      await this.deliverToHospitalPatient(order, updatedOrder.report!);
    } else {
      await this.deliverToLabPatient(order);
    }

    await this.auditService.log(labId, userId, 'DELIVER', 'LabOrder', orderId);
    return updatedOrder;
  }

  /**
   * Unlocks a finalized report for correction: Final Report → Amendment
   * Request → (re-entry + re-verify) → Corrected Report. Re-uses the
   * existing submit/verify path rather than versioning a new report row.
   */
  async amend(
    orderId: string,
    labId: string,
    userId: string,
    dto: AmendReportDto,
  ) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, labId },
      include: { report: true },
    });
    if (!order || !order.report) throw new NotFoundException('Order not found');
    const amendable: LabOrderStatus[] = [
      LabOrderStatus.VERIFIED,
      LabOrderStatus.REPORT_DELIVERED,
    ];
    if (!amendable.includes(order.status)) {
      throw new BadRequestException(
        'Only a verified or delivered report can be amended',
      );
    }

    const now = new Date();
    const [, updatedOrder] = await this.prisma.$transaction([
      this.prisma.labReport.update({
        where: { orderId },
        data: {
          status: LabReportStatus.AMENDED,
          isAmended: true,
          amendmentReason: dto.reason,
          amendedByUserId: userId,
          amendedAt: now,
        },
      }),
      this.prisma.labOrder.update({
        where: { id: orderId },
        data: { status: LabOrderStatus.RESULT_READY },
        include: { report: true, patient: true },
      }),
    ]);

    await this.auditService.log(
      labId,
      userId,
      'AMEND',
      'LabOrder',
      orderId,
      undefined,
      { reason: dto.reason },
    );
    return updatedOrder;
  }

  async emailReport(
    orderId: string,
    labId: string,
    userId: string,
    dto: SendLabReportEmailDto,
  ): Promise<{ sent: true; recipientEmail: string }> {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, labId },
      include: { report: true, patient: true, lab: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.report?.fileUrl) {
      throw new BadRequestException('Report has not been generated yet');
    }
    if (!dto.reportUrl.endsWith(order.report.fileUrl)) {
      throw new BadRequestException('Report link does not match this order');
    }

    const recipientEmail = dto.email || order.patient?.email;
    if (!recipientEmail) {
      throw new BadRequestException(
        'Patient has no email on file — provide one to send to',
      );
    }

    await this.emailService.sendLabReportLink({
      recipientEmail,
      patientName: order.patient?.name || 'Patient',
      orderNo: order.orderNo,
      reportUrl: dto.reportUrl,
      labName: order.lab.name,
    });

    await this.auditService.log(
      labId,
      userId,
      'EMAIL_REPORT',
      'LabOrder',
      orderId,
      undefined,
      { recipientEmail },
    );

    return { sent: true, recipientEmail };
  }

  private async deliverToHospitalPatient(
    order: any,
    report: { fileUrl: string | null; fileName: string | null },
  ) {
    const hospitalPatient = await this.prisma.patient.findUnique({
      where: { id: order.hospitalPatientId },
      include: { user: true },
    });
    if (!hospitalPatient) return;

    await this.prisma.patientTimeline.create({
      data: {
        patientId: hospitalPatient.id,
        eventType: TimelineEventType.LAB_REPORT_READY,
        title: `Lab report ready (${order.orderNo})`,
        description: order.lab.name,
        metadata: { labOrderId: order.id },
      },
    });

    if (report.fileUrl) {
      await this.prisma.report.create({
        data: {
          tenantId: order.hospitalTenantId,
          patientId: hospitalPatient.id,
          uploadedBy: hospitalPatient.userId,
          type: ReportType.LAB_REPORT,
          title: `Lab Report — ${order.orderNo}`,
          fileUrl: report.fileUrl,
          fileName: report.fileName || path.basename(report.fileUrl),
          labName: order.lab.name,
          reportDate: new Date(),
        },
      });
    }

    try {
      await this.notificationsService.create(
        hospitalPatient.userId,
        'Lab report ready',
        `Your lab report from ${order.lab.name} is now available.`,
        'PUSH',
      );
      if (order.orderedByUserId) {
        await this.notificationsService.create(
          order.orderedByUserId,
          'Lab report delivered',
          `The lab report for order ${order.orderNo} has been delivered.`,
          'PUSH',
          undefined,
          { type: 'LAB_REPORT_DELIVERED', labOrderId: order.id },
        );
      }
      await this.emailService.sendReportAvailable({
        recipientEmail: hospitalPatient.user.email,
        patientName:
          `${hospitalPatient.user.firstName} ${hospitalPatient.user.lastName}`.trim(),
        reportTitle: `Lab Report — ${order.orderNo}`,
        reportType: ReportType.LAB_REPORT,
        hospitalName: order.lab.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Lab report delivery notification failed (orderId=${order.id}, error=${message})`,
      );
    }
  }

  private async deliverToLabPatient(order: any) {
    if (!order.patient?.email) return;
    try {
      await this.emailService.sendReportAvailable({
        recipientEmail: order.patient.email,
        patientName: order.patient.name,
        reportTitle: `Lab Report — ${order.orderNo}`,
        reportType: ReportType.LAB_REPORT,
        hospitalName: order.lab.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Lab report delivery email failed (orderId=${order.id}, error=${message})`,
      );
    }
  }

  /**
   * Renders the report exactly as verify() would, but in memory and stamped
   * "PREVIEW" — lets the pathologist review (amended) results before sign-off.
   * Nothing is uploaded or persisted.
   */
  async previewReport(
    orderId: string,
    labId: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const order = await this.prisma.labOrder.findFirst({
      where: { id: orderId, labId },
      include: {
        items: { include: { resultValues: true, test: true } },
        patient: true,
        lab: true,
        report: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const previewable: LabOrderStatus[] = [
      LabOrderStatus.RESULT_READY,
      LabOrderStatus.PENDING_VERIFICATION,
    ];
    if (!previewable.includes(order.status)) {
      throw new BadRequestException(
        'A preview is only available while results await verification',
      );
    }

    const buffer = await this.buildReportPdf(order, { preview: true });
    return { buffer, fileName: `lab_report_${order.orderNo}_preview.pdf` };
  }

  private async generateReportPdf(order: any): Promise<string> {
    const fileName = `lab_report_${order.id}.pdf`;
    const pdfBuffer = await this.buildReportPdf(order);

    return this.storageService.uploadBuffer(
      `lab-reports/${order.labId}/${fileName}`,
      pdfBuffer,
      'application/pdf',
      { upsert: true },
    );
  }

  private buildReportPdf(
    order: any,
    options: { preview?: boolean } = {},
  ): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const lab = order.lab;
    const patient = order.patient;
    const amended = !!order.report?.isAmended;

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
    // [text colour, chip background] per result flag.
    const FLAG: Record<string, [string, string]> = {
      LOW: ['#1d4ed8', '#dbeafe'],
      HIGH: ['#c2410c', '#ffedd5'],
      ABNORMAL: ['#b45309', '#fef3c7'],
      CRITICAL: ['#b91c1c', '#fee2e2'],
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
    const cap = (s?: string | null) =>
      s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : '';
    const age = patient.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 3600 * 1000),
        )
      : null;
    const reportDate = order.verifiedAt || new Date();

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `Lab Report ${order.orderNo}`,
          Author: lab?.name || 'Arogyix',
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
      const FOOTER_TOP = PH - 40;
      const grad = (x: number, w: number, from = '#bbf7d0', to = '#ecfccb') =>
        doc
          .linearGradient(x, 0, x + w, 0)
          .stop(0, from)
          .stop(1, to);
      // Single-line text that truncates instead of wrapping.
      const line = (
        text: string,
        x: number,
        y: number,
        w: number,
        opts: any = {},
      ) =>
        doc.text(text, x, y, {
          width: w,
          height: doc._fontSize * 1.4,
          ellipsis: true,
          lineBreak: false,
          ...opts,
        });
      const drawFooter = () => {
        doc.rect(0, PH - 30, PW, 30).fill(grad(0, PW));
        doc.font('Body').fontSize(8).fillColor('#166534');
        line(
          `Powered by Arogyix   •   ${lab?.name || 'Lab'}   •   Order ${order.orderNo}`,
          0,
          PH - 19,
          PW,
          { align: 'center' },
        );
      };
      let y = 0;
      // Starts a new page when the next block would run into the footer.
      const ensureSpace = (h: number) => {
        if (y + h <= FOOTER_TOP - 10) return false;
        drawFooter();
        doc.addPage({ size: 'A4', margin: 0 });
        doc.rect(0, 0, PW, 8).fill(grad(0, PW, C.dark, C.accent));
        y = 30;
        return true;
      };

      // ─── Top accent strip + wordmark + title ───
      doc.rect(0, 0, PW, 8).fill(grad(0, PW, C.dark, C.accent));
      y = 28;
      doc.image(AROGYIX_WORDMARK_PNG, M, y, { height: 46 });
      doc.font('Bold').fontSize(24).fillColor(C.dark);
      line('LAB REPORT', M, y - 2, W, { align: 'right', characterSpacing: 2 });
      doc.font('Body').fontSize(10).fillColor(C.muted);
      line(
        `# ${order.orderNo}   •   Reported: ${fmtDate(reportDate)}`,
        M,
        y + 32,
        W,
        { align: 'right' },
      );

      // ─── Lab band ───
      y = 90;
      const bandH = 82;
      doc.roundedRect(M, y, W, bandH, 10).fill(grad(M, W));
      const logoBox = 58;
      const lx = M + 14;
      const ly = y + (bandH - logoBox) / 2;
      doc.roundedRect(lx, ly, logoBox, logoBox, 10).fill('#ffffff');
      const initials = (lab?.name || 'L')
        .split(/\s+/)
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase();
      doc.font('Bold').fontSize(20).fillColor(C.primary);
      line(initials, lx, ly + 17, logoBox, { align: 'center' });

      const pillW = 112;
      const tx = lx + logoBox + 14;
      const tw = M + W - pillW - 30 - tx;
      doc.font('Bold').fontSize(15).fillColor(C.dark);
      line(lab?.name || 'Pathology Lab', tx, y + 12, tw);
      doc.font('Body').fontSize(8.5).fillColor('#166534');
      let ty = y + 34;
      for (const t of [
        [lab?.address, lab?.city, lab?.state, lab?.pincode]
          .filter(Boolean)
          .join(', '),
        [lab?.phone && `Ph: ${lab.phone}`, lab?.email]
          .filter(Boolean)
          .join('   |   '),
        [
          lab?.licenseNumber && `Licence: ${lab.licenseNumber}`,
          lab?.accreditationNo && `Accreditation: ${lab.accreditationNo}`,
        ]
          .filter(Boolean)
          .join('   |   '),
      ].filter(Boolean)) {
        line(String(t), tx, ty, tw);
        ty += 12;
      }
      const [sFg, sLabel] = options.preview
        ? ['#b45309', 'PREVIEW']
        : amended
          ? ['#b91c1c', 'AMENDED']
          : ['#15803d', 'VERIFIED'];
      const px = M + W - pillW - 16;
      doc.font('Bold').fontSize(7.5).fillColor('#166534');
      line('REPORT STATUS', px, y + 20, pillW, {
        align: 'center',
        characterSpacing: 1,
      });
      doc.roundedRect(px, y + 34, pillW, 26, 13).fill('#ffffff');
      doc.font('Bold').fontSize(11).fillColor(sFg);
      line(sLabel, px, y + 40, pillW, { align: 'center' });
      y += bandH + 16;

      // ─── Preview notice ───
      if (options.preview) {
        doc.roundedRect(M, y, W, 28, 8).fill('#fffbeb');
        doc.rect(M, y, 4, 28).fill('#d97706');
        doc.font('Bold').fontSize(9).fillColor('#b45309');
        line(
          'PREVIEW - NOT VERIFIED. Not valid for clinical use.',
          M + 14,
          y + 9.5,
          W - 28,
        );
        y += 28 + 14;
      }

      // ─── Amendment notice ───
      if (amended) {
        doc.font('Body').fontSize(9);
        const reason = order.report.amendmentReason || '';
        const h =
          30 +
          (reason
            ? Math.min(doc.heightOfString(reason, { width: W - 28 }), 40)
            : 0);
        doc.roundedRect(M, y, W, h, 8).fill('#fef2f2');
        doc.rect(M, y, 4, h).fill('#dc2626');
        doc.font('Bold').fontSize(9).fillColor('#b91c1c');
        line(
          'AMENDED / CORRECTED REPORT - this replaces any earlier version',
          M + 14,
          y + 9,
          W - 28,
        );
        if (reason) {
          doc.font('Body').fontSize(9).fillColor(C.text);
          doc.text(`Reason: ${reason}`, M + 14, y + 24, {
            width: W - 28,
            height: 40,
            ellipsis: true,
          });
        }
        y += h + 14;
      }

      // ─── Info cards ───
      const gap = 12;
      const cardW = (W - gap * 2) / 3;
      const cards: [string, string, [string, any][]][] = [
        [
          'PATIENT',
          '#0d9488',
          [
            ['Name', patient.name],
            [
              'Age / Sex',
              [age !== null ? `${age} yrs` : '', cap(patient.gender)]
                .filter(Boolean)
                .join(' / '),
            ],
            ['Phone', patient.phone],
            ['Email', patient.email],
          ],
        ],
        [
          'SAMPLE',
          '#2563eb',
          [
            ['Sample ID', order.sampleId],
            ['Type', order.sampleType],
            ['Collected', fmtDate(order.sampleCollectedAt, true)],
            ['Received', fmtDate(order.receivedAtLabAt, true)],
            ['Collection', cap(order.collectionType)],
          ],
        ],
        [
          'REPORT',
          '#7c3aed',
          [
            ['Order No', order.orderNo],
            [
              'Referred by',
              order.referringDoctorName &&
                `Dr. ${order.referringDoctorName.replace(/^Dr\.?\s*/i, '')}`,
            ],
            ['Registered', fmtDate(order.createdAt, true)],
            [
              'Verified',
              options.preview
                ? 'Pending'
                : fmtDate(order.verifiedAt || new Date(), true),
            ],
          ],
        ],
      ];
      const rowsOf = (rows: [string, any][]) =>
        rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
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
          line(label, cx + 12, ry + 0.8, 52);
          doc.font('Bold').fontSize(8.5).fillColor(C.text);
          doc.text(String(value), cx + 62, ry, {
            width: valW,
            height: 26,
            ellipsis: true,
          });
          ry += rowHeights[i][r];
        });
      });
      y += cardH + 20;

      // ─── Results, one table per test ───
      const cols = [
        { label: 'PARAMETER', w: W - 95 - 70 - 150 - 75, align: 'left' },
        { label: 'RESULT', w: 95, align: 'left' },
        { label: 'UNIT', w: 70, align: 'left' },
        { label: 'REFERENCE RANGE', w: 150, align: 'left' },
        { label: 'FLAG', w: 75, align: 'center' },
      ];
      const colX = (i: number) =>
        M + cols.slice(0, i).reduce((s, c) => s + c.w, 0);
      const tableHeader = (testName: string) => {
        doc.font('Bold').fontSize(11).fillColor(C.dark);
        line(testName, M, y, W);
        y += 18;
        doc.roundedRect(M, y, W, 24, 6).fill(grad(M, W));
        doc.font('Bold').fontSize(8).fillColor(C.dark);
        cols.forEach((c, i) =>
          line(c.label, colX(i) + 8, y + 7.5, c.w - 16, {
            align: c.align,
            characterSpacing: 0.6,
          }),
        );
        y += 24;
      };

      for (const item of order.items) {
        ensureSpace(18 + 24 + 30);
        tableHeader(item.testNameSnapshot);
        item.resultValues.forEach((r: any, i: number) => {
          const flagged = r.flag && r.flag !== 'NORMAL';
          doc.font('Body').fontSize(8);
          const noteH = r.comment
            ? Math.min(
                doc.heightOfString(`Note: ${r.comment}`, {
                  width: cols[0].w - 16,
                }),
                30,
              ) + 2
            : 0;
          const rowH = Math.max(28, 20 + noteH);
          if (ensureSpace(rowH))
            tableHeader(`${item.testNameSnapshot} (contd.)`);
          doc.rect(M, y, W, rowH).fill(i % 2 ? '#ffffff' : C.soft);
          doc.font('Body').fontSize(9.5).fillColor(C.text);
          line(r.parameterNameSnapshot, colX(0) + 8, y + 8, cols[0].w - 16);
          if (r.comment) {
            doc.font('Italic').fontSize(8).fillColor(C.muted);
            doc.text(`Note: ${r.comment}`, colX(0) + 8, y + 21, {
              width: cols[0].w - 16,
              height: 30,
              ellipsis: true,
            });
          }
          const [fFg, fBg] = FLAG[r.flag] ?? [C.text, C.soft];
          doc
            .font(flagged ? 'Bold' : 'Body')
            .fontSize(9.5)
            .fillColor(flagged ? fFg : C.text);
          line(String(r.value ?? '-'), colX(1) + 8, y + 8, cols[1].w - 16);
          doc.font('Body').fontSize(9).fillColor(C.muted);
          line(r.unit || '-', colX(2) + 8, y + 8.5, cols[2].w - 16);
          line(r.refRangeText || '-', colX(3) + 8, y + 8.5, cols[3].w - 16);
          if (flagged) {
            const chipW = cols[4].w - 16;
            doc.roundedRect(colX(4) + 8, y + 6, chipW, 16, 8).fill(fBg);
            doc.font('Bold').fontSize(7.5).fillColor(fFg);
            line(r.flag, colX(4) + 8, y + 9.5, chipW, { align: 'center' });
          } else {
            doc.font('Body').fontSize(8.5).fillColor(C.primary);
            line('Normal', colX(4) + 8, y + 8.5, cols[4].w - 16, {
              align: 'center',
            });
          }
          y += rowH;
        });
        doc
          .moveTo(M, y)
          .lineTo(M + W, y)
          .lineWidth(1)
          .strokeColor(C.primary)
          .stroke();
        y += 18;
      }

      // ─── Sign-off ───
      ensureSpace(70);
      const sy = Math.max(y, FOOTER_TOP - 76);
      doc.font('Bold').fontSize(8.5).fillColor(C.muted);
      line('*** End of Report ***', M, sy - 4, W, { align: 'center' });
      doc.font('Italic').fontSize(8.5).fillColor(C.muted);
      doc.text(
        'Results relate only to the sample tested. Highlighted values are outside the reference range - please consult your doctor for interpretation.',
        M,
        sy + 18,
        { width: W - 220 },
      );
      const sigW = 180;
      const sx = M + W - sigW;
      doc
        .moveTo(sx, sy + 22)
        .lineTo(sx + sigW, sy + 22)
        .lineWidth(0.8)
        .strokeColor(C.muted)
        .stroke();
      doc.font('Bold').fontSize(10.5).fillColor(C.text);
      line('Verified by Pathologist', sx, sy + 27, sigW, { align: 'center' });
      doc.font('Body').fontSize(8).fillColor(C.muted);
      line(
        options.preview
          ? 'Pending verification - preview only'
          : `Electronically verified • ${fmtDate(order.verifiedAt || new Date(), true)}`,
        sx,
        sy + 43,
        sigW,
        { align: 'center' },
      );

      drawFooter();
      doc.end();
    });
  }
}
