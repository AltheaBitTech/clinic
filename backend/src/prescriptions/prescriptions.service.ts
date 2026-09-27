import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PharmacyPrescriptionsService } from '../pharmacy-prescriptions/pharmacy-prescriptions.service';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import { UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getUploadDir } from '../common/utils/upload.util';
import {
  AROGYIX_WORDMARK_PNG,
  registerPdfFonts,
} from '../common/utils/pdf-fonts';

interface RequestUser {
  id: string;
  role: UserRole;
  tenantId: string;
}

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private pharmacyPrescriptionsService: PharmacyPrescriptionsService,
  ) {}

  async create(dto: CreatePrescriptionDto, user: RequestUser) {
    let doctorId = dto.doctorId;

    if (user.role === UserRole.DOCTOR) {
      // Doctors always prescribe as themselves — resolve their Doctor
      // record from the JWT user, ignoring any doctorId sent by the client.
      const own = await this.prisma.doctor.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!own) {
        throw new BadRequestException(
          'Your doctor profile has not been configured yet. Ask your hospital admin to set it up before writing prescriptions.',
        );
      }
      doctorId = own.id;
    } else {
      if (!doctorId) {
        throw new BadRequestException('doctorId is required');
      }
      const doctor = await this.prisma.doctor.findFirst({
        where: { id: doctorId, tenantId: user.tenantId },
        select: { id: true },
      });
      if (!doctor) {
        throw new NotFoundException('Doctor not found in this hospital');
      }
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found in this hospital');
    }

    if (dto.pharmacyId) {
      const pharmacy = await this.prisma.pharmacy.findFirst({
        where: { id: dto.pharmacyId, tenantId: user.tenantId, isActive: true },
        select: { id: true },
      });
      if (!pharmacy) {
        throw new NotFoundException('Pharmacy not found in this hospital');
      }
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        appointmentId: dto.appointmentId,
        pharmacyId: dto.pharmacyId,
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
            timing:
              m.timing || (m.type === 'OINTMENT' ? 'AFTER_BATH' : 'AFTER_FOOD'),
            instructions: m.instructions,
            reminderTimes: m.reminderTimes || [],
          })),
        },
      },
      include: {
        medicines: true,
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
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

    if (dto.pharmacyId) {
      try {
        await this.pharmacyPrescriptionsService.createFromHospitalPrescription(
          dto.pharmacyId,
          prescription,
          prescription.medicines,
          prescription.patient,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.error(
          `Pharmacy routing failed (prescriptionId=${prescription.id}, pharmacyId=${dto.pharmacyId}, error=${message})`,
        );
      }
    }

    try {
      const patientUser = prescription.patient.user;
      await this.emailService.sendPrescriptionAvailable({
        recipientEmail: patientUser.email,
        patientName: `${patientUser.firstName} ${patientUser.lastName}`.trim(),
        doctorName:
          `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`.trim(),
        diagnosis: prescription.diagnosis ?? undefined,
        medicineCount: prescription.medicines.length,
        prescriptionId: prescription.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Prescription available email failed (prescriptionId=${prescription.id}, error=${message})`,
      );
    }

    return { ...prescription, pdfUrl: pdfPath };
  }

  async getPharmacyStatus(prescriptionId: string, pharmacyId: string | null) {
    if (!pharmacyId) return null;

    const [pharmacy, pharmacyPrescription] = await Promise.all([
      this.prisma.pharmacy.findUnique({
        where: { id: pharmacyId },
        select: { name: true },
      }),
      this.prisma.pharmacyPrescription.findUnique({
        where: { arogyixPrescriptionId: prescriptionId },
        select: { status: true },
      }),
    ]);

    return {
      pharmacyName: pharmacy?.name ?? null,
      status: pharmacyPrescription?.status ?? null,
    };
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
          pharmacy: { select: { name: true } },
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

  // Rebuilt on every download: the DB is shared but PDFs live on per-instance
  // /tmp (Vercel) or ephemeral disk, so a stored file is usually missing.
  async getPdfFile(
    prescription: any,
  ): Promise<{ filePath: string; fileName: string }> {
    const pdfUrl = await this.generatePdf(prescription);
    if (!pdfUrl) {
      throw new NotFoundException('Could not generate prescription PDF');
    }
    return {
      filePath: path.join(getUploadDir('prescriptions'), path.basename(pdfUrl)),
      fileName: `prescription_${prescription.id}.pdf`,
    };
  }

  private async generatePdf(prescription: any): Promise<string> {
    try {
      const PDFDocument = require('pdfkit');
      const uploadDir = getUploadDir('prescriptions');

      const fileName = `prescription_${prescription.id}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: prescription.doctor.tenantId },
      });

      const doctor = prescription.doctor;
      const patient = prescription.patient;
      const doctorName =
        `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`.trim();

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
      const fmtDate = (d?: Date | string | null) =>
        d
          ? new Date(d).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'Asia/Kolkata',
            })
          : '';
      const bullets = (text?: string | null, split = /\r?\n/) =>
        (text || '')
          .split(split)
          .map((l) => l.trim())
          .filter(Boolean);

      await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
          info: {
            Title: `Prescription - ${patient.user.firstName} ${patient.user.lastName}`,
            Author: doctorName,
          },
        });
        const stream = fs.createWriteStream(filePath);
        stream.on('finish', resolve);
        stream.on('error', reject);
        doc.pipe(stream);
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
            `Powered by Arogyix   •   Prescription dated ${fmtDate(prescription.createdAt)}`,
            0,
            PH - 19,
            PW,
            { align: 'center' },
          );
        };
        // Starts a new page when the next block would run into the footer.
        let y = 0;
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
        line('PRESCRIPTION', M, y - 2, W, {
          align: 'right',
          characterSpacing: 2,
        });
        doc.font('Body').fontSize(10).fillColor(C.muted);
        line(
          [
            `Date: ${fmtDate(prescription.createdAt)}`,
            prescription.validUntil &&
              `Valid till: ${fmtDate(prescription.validUntil)}`,
          ]
            .filter(Boolean)
            .join('   •   '),
          M,
          y + 32,
          W,
          {
            align: 'right',
          },
        );

        // ─── Hospital band ───
        y = 90;
        const bandH = 82;
        doc.roundedRect(M, y, W, bandH, 10).fill(grad(M, W));
        const logoBox = 58;
        const lx = M + 14;
        const ly = y + (bandH - logoBox) / 2;
        doc.roundedRect(lx, ly, logoBox, logoBox, 10).fill('#ffffff');
        const tenantLogo = this.resolveTenantLogoPath(tenant?.logoUrl);
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
          line(initials, lx, ly + 17, logoBox, { align: 'center' });
        }
        const rxW = 70;
        const tx = lx + logoBox + 14;
        const tw = M + W - rxW - 30 - tx;
        doc.font('Bold').fontSize(15).fillColor(C.dark);
        line(tenant?.name || 'Hospital', tx, y + 12, tw);
        doc.font('Body').fontSize(8.5).fillColor('#166534');
        let ty = y + 34;
        for (const t of [
          [tenant?.address, tenant?.city, tenant?.state]
            .filter(Boolean)
            .join(', '),
          [
            tenant?.phone && `Ph: ${tenant.phone}`,
            tenant?.email,
            tenant?.website,
          ]
            .filter(Boolean)
            .join('   |   '),
          tenant?.licenseNumber && `Reg. No: ${tenant.licenseNumber}`,
        ].filter(Boolean)) {
          line(String(t), tx, ty, tw);
          ty += 12;
        }
        // Big "Rx" badge on the right of the band.
        const rx = M + W - rxW - 16;
        doc.circle(rx + rxW / 2, y + bandH / 2, 28).fill('#ffffff');
        doc.font('Bold').fontSize(24).fillColor(C.primary);
        line('Rx', rx, y + bandH / 2 - 17, rxW, { align: 'center' });

        // ─── Doctor + patient cards ───
        y = 190;
        const gap = 12;
        const cardW = (W - gap) / 2;
        const age = this.calculateAge(patient.dateOfBirth);
        const allergies: string[] = patient.allergies ?? [];
        const cards: [string, string, [string, any, string?][]][] = [
          [
            'CONSULTING DOCTOR',
            '#2563eb',
            [
              ['Name', doctorName],
              ['Qualification', doctor.qualification],
              ['Speciality', doctor.specialization],
              ['Department', doctor.department?.name],
              ['Reg. No', doctor.registrationNo],
            ],
          ],
          [
            'PATIENT',
            '#0d9488',
            [
              ['Name', `${patient.user.firstName} ${patient.user.lastName}`],
              ['Patient ID', patient.patientCode],
              [
                'Age / Sex',
                [
                  age !== null ? `${age} yrs` : '',
                  patient.gender ? this.toTitleCase(patient.gender) : '',
                ]
                  .filter(Boolean)
                  .join(' / '),
              ],
              ['Blood Grp', patient.bloodGroup],
              ['Phone', patient.user.phone],
              ['Allergies', allergies.join(', '), '#dc2626'],
            ],
          ],
        ];
        const rowsOf = (rows: [string, any, string?][]) =>
          rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
        const valW = cardW - 104;
        doc.font('Bold').fontSize(9);
        const rowHeights = cards.map(([, , rows]) =>
          rowsOf(rows).map(
            ([, v]) =>
              Math.min(doc.heightOfString(String(v), { width: valW }), 26) + 4,
          ),
        );
        const cardH =
          38 + Math.max(...rowHeights.map((h) => h.reduce((s, x) => s + x, 0)));
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
          let ry = y + 31;
          rowsOf(rows).forEach(([label, value, valueColor], r) => {
            doc.font('Body').fontSize(8).fillColor(C.muted);
            line(label, cx + 12, ry + 0.5, 78);
            doc
              .font('Bold')
              .fontSize(9)
              .fillColor(valueColor || C.text);
            doc.text(String(value), cx + 92, ry, {
              width: valW,
              height: 26,
              ellipsis: true,
            });
            ry += rowHeights[i][r];
          });
        });
        y += cardH + 16;

        // ─── Tinted section box with a coloured left bar and bullet lines ───
        const noteBox = (
          title: string,
          items: string[],
          fg: string,
          bg: string,
        ) => {
          if (!items.length) return;
          doc.font('Body').fontSize(9.5);
          const bodyH = items.reduce(
            (s, t) => s + doc.heightOfString(`•  ${t}`, { width: W - 28 }) + 2,
            0,
          );
          const h = bodyH + 34;
          ensureSpace(h);
          doc.roundedRect(M, y, W, h, 8).fill(bg);
          doc.rect(M, y, 4, h).fill(fg);
          doc.font('Bold').fontSize(8.5).fillColor(fg);
          line(title, M + 14, y + 10, W - 28, { characterSpacing: 1 });
          doc.font('Body').fontSize(9.5).fillColor(C.text);
          let by = y + 26;
          for (const t of items) {
            doc.text(`•  ${t}`, M + 14, by, { width: W - 28 });
            by = doc.y + 2;
          }
          y += h + 14;
        };
        noteBox(
          'DIAGNOSIS',
          bullets(prescription.diagnosis),
          '#7c3aed',
          '#f5f3ff',
        );

        // ─── Medicines table ───
        const cols = [
          { label: '#', w: 28, align: 'center' },
          { label: 'MEDICINE', w: W - 28 - 70 - 105 - 90 - 70, align: 'left' },
          { label: 'DOSAGE', w: 70, align: 'left' },
          { label: 'FREQUENCY', w: 105, align: 'left' },
          { label: 'WHEN', w: 90, align: 'left' },
          { label: 'DURATION', w: 70, align: 'left' },
        ];
        const colX = (i: number) =>
          M + cols.slice(0, i).reduce((s, c) => s + c.w, 0);
        const tableHeader = () => {
          doc.roundedRect(M, y, W, 26, 6).fill(grad(M, W));
          doc.font('Bold').fontSize(8).fillColor(C.dark);
          cols.forEach((c, i) =>
            line(c.label, colX(i) + 8, y + 8.5, c.w - 16, {
              align: c.align,
              characterSpacing: 0.6,
            }),
          );
          y += 26;
        };
        ensureSpace(26 + 40);
        tableHeader();
        prescription.medicines.forEach((med: any, i: number) => {
          const tags = [
            med.type && med.type !== 'MEDICINE'
              ? med.type === 'OINTMENT'
                ? 'Topical / Ointment'
                : this.toTitleCase(med.type)
              : '',
            med.instructions ? `Note: ${med.instructions}` : '',
          ]
            .filter(Boolean)
            .join('  •  ');
          doc.font('Body').fontSize(8);
          const tagH = tags
            ? Math.min(doc.heightOfString(tags, { width: cols[1].w - 16 }), 30)
            : 0;
          const rowH = Math.max(34, 26 + tagH);
          if (ensureSpace(rowH)) tableHeader();
          doc.rect(M, y, W, rowH).fill(i % 2 ? '#ffffff' : C.soft);
          doc.font('Bold').fontSize(9.5).fillColor(C.primary);
          line(String(i + 1), colX(0) + 8, y + 10, cols[0].w - 16, {
            align: 'center',
          });
          doc.fillColor(C.text);
          line(med.name, colX(1) + 8, y + 9, cols[1].w - 16);
          if (tags) {
            doc.font('Body').fontSize(8).fillColor(C.muted);
            doc.text(tags, colX(1) + 8, y + 24, {
              width: cols[1].w - 16,
              height: 30,
              ellipsis: true,
            });
          }
          doc.font('Body').fontSize(9).fillColor(C.text);
          [
            med.dosage,
            med.frequency,
            this.toTitleCase(med.timing || ''),
            med.duration,
          ].forEach((v, k) =>
            line(v || '-', colX(k + 2) + 8, y + 10, cols[k + 2].w - 16),
          );
          y += rowH;
        });
        doc
          .moveTo(M, y)
          .lineTo(M + W, y)
          .lineWidth(1)
          .strokeColor(C.primary)
          .stroke();
        y += 16;

        // ─── Advice + validity ───
        noteBox(
          'ADVICE',
          bullets(prescription.notes, /\r?\n|;/),
          '#d97706',
          '#fffbeb',
        );
        // ─── Signature + closing note ───
        ensureSpace(60);
        const sy = Math.max(y, FOOTER_TOP - 66);
        doc.font('Italic').fontSize(8.5).fillColor(C.muted);
        doc.text(
          'Take medicines exactly as prescribed. Do not stop or change any medicine without consulting your doctor. Keep this prescription for your records.',
          M,
          sy + 8,
          { width: W - 220 },
        );
        const sigW = 180;
        const sx = M + W - sigW;
        doc
          .moveTo(sx, sy + 12)
          .lineTo(sx + sigW, sy + 12)
          .lineWidth(0.8)
          .strokeColor(C.muted)
          .stroke();
        doc.font('Bold').fontSize(11).fillColor(C.text);
        line(doctorName, sx, sy + 17, sigW, { align: 'center' });
        doc.font('Body').fontSize(8).fillColor(C.muted);
        line(
          [
            'Digital Signature',
            doctor.registrationNo && `Reg. No: ${doctor.registrationNo}`,
          ]
            .filter(Boolean)
            .join('  •  '),
          sx,
          sy + 34,
          sigW,
          { align: 'center' },
        );

        drawFooter();
        doc.end();
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
    const rel = logoUrl.replace(/^\/uploads\//, '');
    const primary = path.join(getUploadDir('logos'), path.basename(rel));
    if (fs.existsSync(primary)) return primary;
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
