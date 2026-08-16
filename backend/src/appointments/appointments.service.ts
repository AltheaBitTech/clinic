import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, dto: CreateAppointmentDto) {
    let finalTenantId = user.tenantId;
    let finalPatientId = dto.patientId;

    if (user.role === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });
      if (!patient) throw new NotFoundException('Patient profile not found');
      finalPatientId = patient.id;
      finalTenantId = patient.tenantId;
    } else {
      if (!finalTenantId) {
        const patient = await this.prisma.patient.findUnique({
          where: { id: dto.patientId },
        });
        if (!patient) throw new NotFoundException('Patient not found');
        finalTenantId = patient.tenantId;
      }
    }

    if (!finalTenantId) {
      throw new BadRequestException(
        'Tenant ID is required to create an appointment',
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt.getTime() < Date.now()) {
      throw new BadRequestException('Cannot book an appointment in the past');
    }
    const endsAt = new Date(scheduledAt.getTime() + 30 * 60 * 1000); // 30 min slot

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId: finalTenantId,
        patientId: finalPatientId,
        doctorId: dto.doctorId,
        scheduledAt,
        endsAt,
        type: dto.type || 'CONSULTATION',
        reason: dto.reason,
        notes: dto.notes,
      },
      include: {
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
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    // Add to patient timeline
    await this.prisma.patientTimeline.create({
      data: {
        patientId: finalPatientId,
        eventType: 'APPOINTMENT',
        title: `Appointment with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        description: dto.reason || 'Consultation',
        occurredAt: scheduledAt,
        metadata: { appointmentId: appointment.id },
      },
    });

    // Create notification for patient
    await this.prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        title: 'Appointment Confirmed',
        body: `Your appointment with Dr. ${appointment.doctor.user.firstName} is scheduled for ${scheduledAt.toLocaleString()}`,
        channel: 'EMAIL',
        scheduledAt: new Date(),
      },
    });

    return appointment;
  }

  async findAll(user: any, filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    let finalTenantId = user.tenantId;
    if (user.role === 'PATIENT') {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: user.id },
      });
      if (patient) {
        finalTenantId = patient.tenantId;
        where.patientId = patient.id;
      } else {
        where.patientId = 'none';
      }
    } else if (user.role === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.id },
      });
      if (doctor) {
        finalTenantId = doctor.tenantId;
        where.doctorId = doctor.id;
      } else {
        where.doctorId = 'none';
      }
    } else {
      // Admin/Receptionist
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.doctorId) where.doctorId = filters.doctorId;
    }

    if (finalTenantId) {
      where.tenantId = finalTenantId;
    }

    if (filters.status) where.status = filters.status;
    if (filters.date) {
      const date = new Date(filters.date);
      where.scheduledAt = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true, familyMembers: true } },
        doctor: { include: { user: true, department: true } },
        prescriptions: { include: { medicines: true } },
        invoice: true,
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(id);

    const data: any = { ...dto };
    if (dto.scheduledAt) {
      data.scheduledAt = new Date(dto.scheduledAt);
      if (data.scheduledAt.getTime() < Date.now()) {
        throw new BadRequestException(
          'Cannot reschedule an appointment to the past',
        );
      }
    }
    if (dto.followUpDate) data.followUpDate = new Date(dto.followUpDate);
    if (dto.status === 'COMPLETED') data.completedAt = new Date();
    if (dto.status === 'CANCELLED') data.cancelledAt = new Date();
    if (dto.status === 'IN_PROGRESS') data.checkedInAt = new Date();

    // Schedule follow-up timeline event if follow-up date is set
    if (dto.followUpDate) {
      await this.prisma.patientTimeline.create({
        data: {
          patientId: appointment.patientId,
          eventType: 'FOLLOW_UP',
          title: 'Follow-up Scheduled',
          description: dto.followUpNotes || 'Follow-up appointment',
          occurredAt: new Date(dto.followUpDate),
          metadata: { appointmentId: id },
        },
      });
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async getTodayAppointments(tenantId: string, doctorId?: string) {
    const today = new Date();
    const where: any = {
      tenantId,
      scheduledAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    };
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async getMissedFollowUps(tenantId: string) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        followUpDate: { lt: new Date() },
        NOT: {
          patient: {
            appointments: {
              some: {
                scheduledAt: {
                  gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
                status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] },
              },
            },
          },
        },
      },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      take: 20,
    });
  }
}
