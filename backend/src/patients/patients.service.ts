import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  AddFamilyMemberDto,
} from './dto/patient.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(tenantId: string, dto: CreatePatientDto) {
    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    let temporaryPassword: string | undefined;

    if (user) {
      // Check if already a patient at this tenant
      const existing = await this.prisma.patient.findFirst({
        where: { userId: user.id, tenantId },
      });
      if (existing)
        throw new ConflictException(
          'Patient already registered at this hospital',
        );
    } else {
      // Create user account
      temporaryPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          role: 'PATIENT',
          tenantId,
          isVerified: true,
          whatsappOptIn: !!dto.whatsappOptIn,
          whatsappOptInAt: dto.whatsappOptIn ? new Date() : null,
        },
      });
    }

    const patientCode = `P${Date.now().toString().slice(-8)}`;

    const patient = await this.prisma.patient.create({
      data: {
        userId: user.id,
        tenantId,
        patientCode,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        address: dto.address,
        city: dto.city,
        emergencyName: dto.emergencyName,
        emergencyPhone: dto.emergencyPhone,
        emergencyRelation: dto.emergencyRelation,
        allergies: dto.allergies || [],
        chronicConditions: dto.chronicConditions || [],
        notes: dto.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Add registration event to timeline
    await this.prisma.patientTimeline.create({
      data: {
        patientId: patient.id,
        eventType: 'NOTE_ADDED',
        title: 'Patient Registered',
        description: `Patient registered at hospital`,
      },
    });

    // Welcome email only when a new login account was created (not re-linked).
    if (temporaryPassword) {
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true },
        });
        await this.emailService.sendRegistrationWelcome({
          recipientEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`.trim(),
          role: 'PATIENT',
          hospitalName: tenant?.name,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.error(
          `Registration welcome email failed (patientId=${patient.id}, error=${message})`,
        );
      }
    }

    return temporaryPassword ? { ...patient, temporaryPassword } : patient;
  }

  async findAll(tenantId: string, search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { patientCode: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { appointments: true, prescriptions: true, reports: true },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId?: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        familyMembers: true,
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 5,
          include: {
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { medicines: true },
        },
        reports: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, tenantId: string, dto: UpdatePatientDto) {
    await this.findOne(id, tenantId);
    return this.prisma.patient.update({
      where: { id },
      data: {
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        address: dto.address,
        city: dto.city,
        emergencyName: dto.emergencyName,
        emergencyPhone: dto.emergencyPhone,
        emergencyRelation: dto.emergencyRelation,
        allergies: dto.allergies,
        chronicConditions: dto.chronicConditions,
        notes: dto.notes,
      },
      include: { user: true, familyMembers: true },
    });
  }

  async addFamilyMember(
    patientId: string,
    tenantId: string,
    dto: AddFamilyMemberDto,
  ) {
    await this.findOne(patientId, tenantId);
    return this.prisma.familyMember.create({
      data: {
        patientId,
        name: dto.name,
        relation: dto.relation,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        phone: dto.phone,
        allergies: dto.allergies || [],
      },
    });
  }

  async getTimeline(patientId: string, tenantId: string, page = 1, limit = 20) {
    await this.findOne(patientId, tenantId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.patientTimeline.findMany({
        where: { patientId },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.patientTimeline.count({ where: { patientId } }),
    ]);
    return { data, total, page, limit };
  }
}
