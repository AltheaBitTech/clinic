import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePrescriptionDto) {
    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId,
        diagnosis: dto.diagnosis,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        medicines: {
          create: dto.medicines.map((m) => ({
            name: m.name,
            type: m.type || 'MEDICINE',
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            timing: m.timing || 'AFTER_FOOD',
            instructions: m.instructions,
            reminderTimes: m.reminderTimes || [],
          })),
        },
      },
      include: {
        medicines: true,
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: true,
          },
        },
      },
    });

    // Generate PDF (stub — logs path, actual PDF generation below)
    const pdfPath = await this.generatePdf(prescription);

    // Update PDF URL
    await this.prisma.prescription.update({
      where: { id: prescription.id },
      data: { pdfUrl: pdfPath },
    });

    // Add to patient timeline
    await this.prisma.patientTimeline.create({
      data: {
        patientId: dto.patientId,
        eventType: 'PRESCRIPTION',
        title: `Prescription by Dr. ${prescription.doctor.user.firstName}`,
        description: prescription.diagnosis || 'New prescription',
        metadata: {
          prescriptionId: prescription.id,
          medicines: prescription.medicines.length,
        },
      },
    });

    // Create medicine reminders
    await this.createReminders(prescription);

    return { ...prescription, pdfUrl: pdfPath };
  }

  async getPatientIdForUser(userId: string): Promise<string | null> {
    const patient = await this.prisma.patient.findFirst({
      where: { userId },
      select: { id: true },
    });
    return patient?.id ?? null;
  }

  async findAll(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.tenantId) where.patient = { tenantId: filters.tenantId };

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          medicines: true,
          patient: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          doctor: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId?: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        medicines: true,
        patient: { include: { user: true } },
        doctor: { include: { user: true, department: true } },
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    if (tenantId && prescription.patient.tenantId !== tenantId) {
      throw new NotFoundException('Prescription not found');
    }
    return prescription;
  }

  // ─── PDF Generation ──────────────────────────────────────────────────────────

  private async generatePdf(prescription: any): Promise<string> {
    try {
      const PDFDocument = require('pdfkit');
      const uploadDir = path.join(process.cwd(), 'uploads', 'prescriptions');
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });

      const fileName = `prescription_${prescription.id}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: prescription.doctor.tenantId },
      });

      await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const marginX = 50;
        const contentWidth = doc.page.width - marginX * 2;
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
            .fillColor('#15803d')
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

        // ─── Header ───
        const headerY = doc.y;
        const headerHeight = 85;
        const logoSize = 50;
        const logoY = headerY + (headerHeight - logoSize) / 2;

        doc
          .roundedRect(marginX, headerY, contentWidth, headerHeight, 4)
          .strokeColor('#16a34a')
          .stroke();
        doc.strokeColor('black');

        const arogyixLogoPath = path.join(
          process.cwd(),
          'assets',
          'arogyix-logo.png',
        );
        if (fs.existsSync(arogyixLogoPath)) {
          doc.image(arogyixLogoPath, marginX + 15, logoY, {
            width: logoSize,
            height: logoSize,
          });
        }

        const tenantLogoPath = this.resolveTenantLogoPath(tenant?.logoUrl);
        if (tenantLogoPath) {
          doc.image(
            tenantLogoPath,
            marginX + contentWidth - logoSize - 15,
            logoY,
            {
              width: logoSize,
              height: logoSize,
              fit: [logoSize, logoSize],
            },
          );
        }

        const titleX = marginX + 75;
        const titleWidth = contentWidth - 150;
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#15803d')
          .text('AROGYIX', titleX, headerY + 14, {
            width: titleWidth,
            align: 'center',
          });
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('black')
          .text(tenant?.name || 'Hospital', titleX, headerY + 40, {
            width: titleWidth,
            align: 'center',
          });
        const addressLine = [tenant?.address, tenant?.city, tenant?.state]
          .filter(Boolean)
          .join(', ');
        if (addressLine) {
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#666')
            .text(addressLine, titleX, headerY + 58, {
              width: titleWidth,
              align: 'center',
            });
        }
        doc.fillColor('black');
        doc.y = headerY + headerHeight + 15;

        // ─── Doctor ───
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(
            `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
          );
        const doctorSubLine = [
          prescription.doctor.qualification,
          prescription.doctor.specialization,
        ]
          .filter(Boolean)
          .join(' | ');
        if (doctorSubLine) {
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#555')
            .text(doctorSubLine);
        }
        if (prescription.doctor.registrationNo) {
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#555')
            .text(`Reg No: ${prescription.doctor.registrationNo}`);
        }
        doc.fillColor('black');
        drawDivider();

        // ─── Patient ───
        const patientName = `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`;
        const age = this.calculateAge(prescription.patient.dateOfBirth);
        labelValueRow('Patient', patientName);
        if (age !== null) labelValueRow('Age', `${age} Years`);
        if (prescription.patient.gender)
          labelValueRow(
            'Gender',
            this.toTitleCase(prescription.patient.gender),
          );
        labelValueRow(
          'Date',
          new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        );
        drawDivider();

        // ─── Diagnosis ───
        if (prescription.diagnosis) {
          sectionHeading('Diagnosis');
          prescription.diagnosis
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter(Boolean)
            .forEach((line: string) => {
              doc.fontSize(10).font('Helvetica').text(`•  ${line}`);
            });
          drawDivider();
        }

        // ─── Rx ───
        sectionHeading('Rx');
        prescription.medicines.forEach((med: any, index: number) => {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${med.name} ${med.dosage}`);
          doc.fontSize(9).font('Helvetica').fillColor('#333');
          doc.text(`   ${med.frequency}`);
          doc.text(`   ${this.toTitleCase(med.timing)}`);
          doc.text(`   ${med.duration}`);
          if (med.type === 'OINTMENT') doc.text('   Topical / Ointment');
          if (med.instructions) doc.text(`   Note: ${med.instructions}`);
          doc.fillColor('black');
          doc.moveDown(0.4);
        });
        drawDivider();

        // ─── Advice (from doctor notes) ───
        if (prescription.notes) {
          sectionHeading('Advice');
          prescription.notes
            .split(/\r?\n|;/)
            .map((line: string) => line.trim())
            .filter(Boolean)
            .forEach((line: string) => {
              doc.fontSize(10).font('Helvetica').text(`•  ${line}`);
            });
          drawDivider();
        }

        // ─── Signature ───
        doc.moveDown(1.5);
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(
            `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
            { align: 'right' },
          );
        doc
          .fontSize(9)
          .font('Helvetica-Oblique')
          .fillColor('#555')
          .text('Digital Signature', { align: 'right' });
        doc.fillColor('black');
        drawDivider();

        doc
          .fontSize(8)
          .fillColor('gray')
          .text(`Generated by Arogyix — ${new Date().toISOString()}`, {
            align: 'center',
          });

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      return `/uploads/prescriptions/${fileName}`;
    } catch (error) {
      console.error('PDF generation error:', error);
      return '';
    }
  }

  private calculateAge(dateOfBirth?: Date | string | null): number | null {
    if (!dateOfBirth) return null;
    const diffMs = Date.now() - new Date(dateOfBirth).getTime();
    return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  }

  private toTitleCase(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private resolveTenantLogoPath(logoUrl?: string | null): string | null {
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) return null;
    const ext = path.extname(logoUrl).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return null;
    const filePath = path.join(process.cwd(), logoUrl.replace(/^\//, ''));
    return fs.existsSync(filePath) ? filePath : null;
  }

  // ─── Create Medicine Reminders ────────────────────────────────────────────────

  private async createReminders(prescription: any) {
    const remindersData: any[] = [];

    for (const medicine of prescription.medicines) {
      const times =
        medicine.reminderTimes.length > 0
          ? medicine.reminderTimes
          : this.getDefaultTimes(medicine.frequency);

      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledAt = new Date();
        scheduledAt.setHours(hours, minutes, 0, 0);
        if (scheduledAt < new Date()) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }

        remindersData.push({
          patientId: prescription.patientId,
          prescriptionId: prescription.id,
          medicineId: medicine.id,
          scheduledAt,
          channel: 'PUSH',
        });
      }
    }

    if (remindersData.length > 0) {
      await this.prisma.medicineReminder.createMany({ data: remindersData });
    }

    // Timeline event for medicine started
    await this.prisma.patientTimeline.create({
      data: {
        patientId: prescription.patientId,
        eventType: 'MEDICINE_STARTED',
        title: `${prescription.medicines.length} Medicine(s) Scheduled`,
        description: prescription.medicines.map((m: any) => m.name).join(', '),
        metadata: { prescriptionId: prescription.id },
      },
    });
  }

  private getDefaultTimes(frequency: string): string[] {
    const map: Record<string, string[]> = {
      'Once daily': ['09:00'],
      'Twice daily': ['09:00', '21:00'],
      'Thrice daily': ['08:00', '14:00', '20:00'],
      'Four times daily': ['08:00', '12:00', '16:00', '20:00'],
      'Before bed': ['21:00'],
      Morning: ['09:00'],
    };
    return map[frequency] || ['09:00'];
  }
}
