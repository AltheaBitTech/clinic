import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ReportType } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(
    tenantId: string,
    uploadedBy: string,
    patientId: string,
    file: Express.Multer.File,
    body: any,
  ) {
    const fileUrl = `/uploads/reports/${file.filename}`;

    const report = await this.prisma.report.create({
      data: {
        tenantId,
        patientId,
        uploadedBy,
        type: body.type || 'OTHER',
        title: body.title || file.originalname,
        description: body.description,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        labName: body.labName,
        reportDate: body.reportDate ? new Date(body.reportDate) : new Date(),
      },
    });

    // Timeline event
    await this.prisma.patientTimeline.create({
      data: {
        patientId,
        eventType: 'REPORT_UPLOADED',
        title: `Report Uploaded: ${report.title}`,
        description: report.description || `${report.type} report`,
        metadata: { reportId: report.id, type: report.type },
      },
    });

    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      });
      if (patient) {
        await this.emailService.sendReportAvailable({
          recipientEmail: patient.user.email,
          patientName:
            `${patient.user.firstName} ${patient.user.lastName}`.trim(),
          reportTitle: report.title,
          reportType: report.type,
          reportId: report.id,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Report available email failed (reportId=${report.id}, error=${message})`,
      );
    }

    return report;
  }

  async findAll(
    tenantId: string,
    patientId?: string,
    type?: ReportType,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getPatientIdForUser(userId: string): Promise<string | null> {
    const patient = await this.prisma.patient.findFirst({
      where: { userId },
      select: { id: true },
    });
    return patient?.id ?? null;
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async delete(id: string) {
    const report = await this.findOne(id);
    // Delete file from disk
    const filePath = path.join(process.cwd(), report.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return this.prisma.report.delete({ where: { id } });
  }
}
