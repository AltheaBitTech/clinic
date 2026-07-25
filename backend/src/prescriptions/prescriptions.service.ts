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
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
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
        metadata: { prescriptionId: prescription.id, medicines: prescription.medicines.length },
      },
    });

    // Create medicine reminders
    await this.createReminders(prescription);

    return { ...prescription, pdfUrl: pdfPath };
  }

  async findAll(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.doctorId) where.doctorId = filters.doctorId;

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          medicines: true,
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        medicines: true,
        patient: { include: { user: true } },
        doctor: { include: { user: true, department: true } },
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  // ─── PDF Generation ──────────────────────────────────────────────────────────

  private async generatePdf(prescription: any): Promise<string> {
    try {
      const PDFDocument = require('pdfkit');
      const uploadDir = path.join(process.cwd(), 'uploads', 'prescriptions');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const fileName = `prescription_${prescription.id}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text('Arogyix', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Medical Prescription', { align: 'center' });
        doc.moveDown();

        // Divider
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Doctor & Patient Info
        doc.fontSize(11).font('Helvetica-Bold').text('Doctor:');
        doc.font('Helvetica').text(
          `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
        );
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').text('Patient:');
        doc.font('Helvetica').text(
          `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`,
        );
        doc.moveDown(0.5);

        if (prescription.diagnosis) {
          doc.font('Helvetica-Bold').text('Diagnosis:');
          doc.font('Helvetica').text(prescription.diagnosis);
          doc.moveDown(0.5);
        }

        doc.font('Helvetica-Bold').text('Date:');
        doc.font('Helvetica').text(new Date().toLocaleDateString('en-IN'));
        doc.moveDown();

        // Medicines
        const oralMeds = prescription.medicines.filter((m: any) => m.type !== 'OINTMENT');
        const topicalMeds = prescription.medicines.filter((m: any) => m.type === 'OINTMENT');

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        if (oralMeds.length > 0) {
          doc.fontSize(13).font('Helvetica-Bold').text('Prescribed Medications', { underline: true });
          doc.moveDown(0.5);
          oralMeds.forEach((med: any, index: number) => {
            doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${med.name} — ${med.dosage}`);
            doc.fontSize(10).font('Helvetica').text(
              `   ${med.frequency} | ${med.duration} | ${med.timing.replace('_', ' ')}`,
            );
            if (med.instructions) {
              doc.text(`   Note: ${med.instructions}`);
            }
            doc.moveDown(0.5);
          });
          doc.moveDown(0.5);
        }

        if (topicalMeds.length > 0) {
          doc.fontSize(13).font('Helvetica-Bold').text('Prescribed Ointments & Topicals', { underline: true });
          doc.moveDown(0.5);
          topicalMeds.forEach((med: any, index: number) => {
            doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${med.name} — ${med.dosage}`);
            doc.fontSize(10).font('Helvetica').text(
              `   ${med.frequency} | ${med.duration} | ${med.timing.replace('_', ' ')}`,
            );
            if (med.instructions) {
              doc.text(`   Note: ${med.instructions}`);
            }
            doc.moveDown(0.5);
          });
          doc.moveDown(0.5);
        }

        // Notes
        if (prescription.notes) {
          doc.moveDown();
          doc.fontSize(11).font('Helvetica-Bold').text('Doctor Notes:');
          doc.font('Helvetica').text(prescription.notes);
        }

        // Footer
        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('gray').text(
          `Generated by Arogyix — ${new Date().toISOString()}`,
          { align: 'center' },
        );

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

  // ─── Create Medicine Reminders ────────────────────────────────────────────────

  private async createReminders(prescription: any) {
    const remindersData: any[] = [];

    for (const medicine of prescription.medicines) {
      const times = medicine.reminderTimes.length > 0
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
      'Morning': ['09:00'],
    };
    return map[frequency] || ['09:00'];
  }
}
