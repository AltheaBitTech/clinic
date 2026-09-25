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
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LabAuditService } from '../pathology-shared/lab-audit.service';
import { getUploadDir } from '../common/utils/upload.util';
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
      const critLow = param.criticalRangeLow != null ? Number(param.criticalRangeLow) : null;
      const critHigh = param.criticalRangeHigh != null ? Number(param.criticalRangeHigh) : null;
      if ((critLow != null && numeric < critLow) || (critHigh != null && numeric > critHigh)) {
        return ResultFlag.CRITICAL;
      }
      if (!explicitFlag) {
        const low = param.refRangeLow != null ? Number(param.refRangeLow) : null;
        const high = param.refRangeHigh != null ? Number(param.refRangeHigh) : null;
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
  async amend(orderId: string, labId: string, userId: string, dto: AmendReportDto) {
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

  private async generateReportPdf(order: any): Promise<string> {
    const PDFDocument = require('pdfkit');
    const uploadDir = getUploadDir('lab-reports');
    const fileName = `lab_report_${order.id}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(order.lab.name, { align: 'center' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(order.lab.address || '', { align: 'center' });
      doc.moveDown(1);
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Lab Report — ${order.orderNo}`);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Patient: ${order.patient.name}`);
      if (order.patient.gender) doc.text(`Gender: ${order.patient.gender}`);
      if (order.sampleId) doc.text(`Sample ID: ${order.sampleId}`);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`);
      if (order.report?.isAmended) {
        doc
          .fillColor('#b91c1c')
          .font('Helvetica-Bold')
          .text('AMENDED / CORRECTED REPORT');
        if (order.report.amendmentReason) {
          doc.font('Helvetica').text(`Reason: ${order.report.amendmentReason}`);
        }
        doc.fillColor('black');
      }
      doc.moveDown(1);

      for (const item of order.items) {
        doc.fontSize(11).font('Helvetica-Bold').text(item.testNameSnapshot);
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(
          'Parameter                Result          Unit        Reference Range',
        );
        doc.font('Helvetica');
        for (const r of item.resultValues) {
          doc.text(
            `${r.parameterNameSnapshot.padEnd(24)}  ${r.value.padEnd(14)}  ${(r.unit || '').padEnd(10)}  ${r.refRangeText || ''}${r.flag && r.flag !== 'NORMAL' ? `  [${r.flag}]` : ''}`,
          );
          if (r.comment) {
            doc.fontSize(8).fillColor('#555').text(`   Note: ${r.comment}`);
            doc.fontSize(9).fillColor('black');
          }
        }
        doc.moveDown(0.8);
      }

      doc.moveDown(1);
      doc
        .fontSize(8)
        .fillColor('#666')
        .text('Generated by Arogyix', { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return `/uploads/lab-reports/${fileName}`;
  }
}
