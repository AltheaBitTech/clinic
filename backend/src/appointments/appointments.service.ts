import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';

const CLINIC_TIMEZONE = 'Asia/Kolkata';
const HISTORICAL_STATUSES = ['COMPLETED', 'CANCELLED'];

// The server process may run in UTC (or any other TZ) while the clinic
// operates in IST, so day boundaries must be computed against the clinic's
// timezone rather than via Date's local-timezone setHours/getHours — a naive
// comparison here shifts the "today" window by IST's +5:30 offset and can
// silently drop or misplace early-morning appointments.
function getDayBoundsInClinicTimezone(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // en-CA formatToParts of a UTC instant tells us that instant's Y-M-D in
  // IST; we binary-search-free this by computing the known IST offset
  // directly since it's fixed (no DST) at UTC+5:30.
  const utcMidnightForIstDate =
    Date.UTC(year, month - 1, day) - 5.5 * 60 * 60 * 1000;
  return {
    gte: new Date(utcMidnightForIstDate),
    lt: new Date(utcMidnightForIstDate + 24 * 60 * 60 * 1000),
  };
}

function getStartOfTodayInClinicTimezone() {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
  }).format(new Date());
  return getDayBoundsInClinicTimezone(todayStr).gte;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private whatsappService: WhatsappService,
  ) {}

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
                id: true,
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
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        // Loaded only for confirmation email; stripped before the API response.
        tenant: { select: { name: true } },
      },
    });

    const { tenant, ...appointmentResponse } = appointment;

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
        body: `Your appointment with Dr. ${appointment.doctor.user.firstName} is scheduled for ${scheduledAt.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}`,
        channel: 'EMAIL',
        scheduledAt: new Date(),
      },
    });

    const patientUser = appointment.patient.user;
    const doctorUser = appointment.doctor.user;
    const patientName =
      `${patientUser.firstName} ${patientUser.lastName}`.trim();
    const doctorName =
      `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`.trim();

    try {
      await this.emailService.sendAppointmentConfirmation({
        recipientEmail: patientUser.email,
        patientName,
        doctorName,
        hospitalName: tenant?.name,
        scheduledAt,
        appointmentId: appointment.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Appointment confirmation email failed (appointmentId=${appointment.id}, error=${message})`,
      );
    }

    try {
      await this.whatsappService.sendAppointmentConfirmationWhatsapp({
        recipientUserId: patientUser.id,
        recipientPhone: patientUser.phone,
        patientName,
        doctorName,
        hospitalName: tenant?.name,
        scheduledAt,
        appointmentId: appointment.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Appointment confirmation WhatsApp failed (appointmentId=${appointment.id}, error=${message})`,
      );
    }

    try {
      await this.emailService.sendDoctorAppointmentBooked({
        recipientEmail: doctorUser.email,
        doctorName,
        patientName,
        hospitalName: tenant?.name,
        scheduledAt,
        appointmentId: appointment.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(
        `Doctor appointment notification email failed (appointmentId=${appointment.id}, error=${message})`,
      );
    }

    return appointmentResponse;
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

    const search = filters.search ? String(filters.search).trim() : '';
    if (search) {
      const words = search.split(/\s+/).filter(Boolean);
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            user: { firstName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          patient: {
            user: { lastName: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          patient: {
            user: { phone: { contains: search, mode: 'insensitive' } },
          },
        },
        // Full-name search (e.g. "John Doe"): every word must match either
        // the first or last name, regardless of order.
        ...(words.length > 1
          ? [
              {
                AND: words.map((word) => ({
                  OR: [
                    {
                      patient: {
                        user: {
                          firstName: { contains: word, mode: 'insensitive' },
                        },
                      },
                    },
                    {
                      patient: {
                        user: {
                          lastName: { contains: word, mode: 'insensitive' },
                        },
                      },
                    },
                  ],
                })),
              },
            ]
          : []),
      ];
    }

    let orderBy: { scheduledAt: 'asc' | 'desc' } = { scheduledAt: 'asc' };
    if (filters.date) {
      where.scheduledAt = getDayBoundsInClinicTimezone(filters.date);
    } else if (
      search ||
      (filters.status && HISTORICAL_STATUSES.includes(filters.status))
    ) {
      // Completed/cancelled appointments (and search results, which should
      // span a patient's full history) are inherently in the past — show
      // the most recently resolved ones first rather than the oldest ones
      // the tenant ever recorded.
      orderBy = { scheduledAt: 'desc' };
    } else {
      // With no explicit date/history/search filter, default to
      // today-and-onward so a hospital's full appointment history (across
      // every doctor) doesn't bury a just-booked appointment many pages
      // behind page 1 — a doctor's own, much smaller list doesn't hit this,
      // which is why the same unfiltered view "worked" for doctors but not
      // for admin/receptionist.
      where.scheduledAt = { gte: getStartOfTodayInClinicTimezone() };
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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

  async update(user: any, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(id);

    if (user.role === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });
      if (!patient || appointment.patientId !== patient.id) {
        throw new NotFoundException('Appointment not found');
      }
      if (
        dto.status !== 'CANCELLED' ||
        Object.keys(dto).some(
          (key) => !['status', 'cancelReason'].includes(key),
        )
      ) {
        throw new BadRequestException(
          'Patients may only cancel their own appointments',
        );
      }
    }

    const previousScheduledAt = appointment.scheduledAt;
    const isReschedule =
      !!dto.scheduledAt &&
      new Date(dto.scheduledAt).getTime() !== previousScheduledAt.getTime();

    if (dto.status === 'COMPLETED') {
      // An appointment can only be completed on the day it's actually
      // scheduled for — not ahead of time, and not as stale cleanup days
      // later — otherwise the record no longer reflects when care happened.
      const scheduledDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: CLINIC_TIMEZONE,
      }).format(appointment.scheduledAt);
      const { gte, lt } = getDayBoundsInClinicTimezone(scheduledDateStr);
      const now = new Date();
      if (now < gte || now >= lt) {
        throw new BadRequestException(
          'Appointments can only be marked completed on their scheduled date.',
        );
      }

      const prescriptionCount = await this.prisma.prescription.count({
        where: { appointmentId: id },
      });
      if (prescriptionCount === 0) {
        throw new BadRequestException(
          'Please write a prescription for this appointment before marking it completed.',
        );
      }
    }

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

    const updated = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
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
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    const isCancellation = dto.status === 'CANCELLED';
    if (isCancellation || isReschedule) {
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: updated.tenantId },
          select: { name: true },
        });
        const patientUser = updated.patient.user;
        const doctorUser = updated.doctor.user;
        const patientName =
          `${patientUser.firstName} ${patientUser.lastName}`.trim();
        const doctorName =
          `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`.trim();

        if (isCancellation) {
          await this.emailService.sendAppointmentCancellation({
            recipientEmail: patientUser.email,
            patientName,
            doctorName,
            hospitalName: tenant?.name,
            scheduledAt: updated.scheduledAt,
            appointmentId: updated.id,
            reason: dto.cancelReason,
          });
          await this.emailService.sendDoctorAppointmentCancelled({
            recipientEmail: doctorUser.email,
            doctorName,
            patientName,
            hospitalName: tenant?.name,
            scheduledAt: updated.scheduledAt,
            appointmentId: updated.id,
            reason: dto.cancelReason,
          });
          await this.whatsappService.sendAppointmentCancellationWhatsapp({
            recipientUserId: patientUser.id,
            recipientPhone: patientUser.phone,
            patientName,
            doctorName,
            hospitalName: tenant?.name,
            scheduledAt: updated.scheduledAt,
            appointmentId: updated.id,
            reason: dto.cancelReason,
          });
        } else if (isReschedule) {
          await this.emailService.sendAppointmentReschedule({
            recipientEmail: patientUser.email,
            patientName,
            doctorName,
            hospitalName: tenant?.name,
            scheduledAt: updated.scheduledAt,
            previousScheduledAt,
            appointmentId: updated.id,
          });
          await this.emailService.sendDoctorAppointmentRescheduled({
            recipientEmail: doctorUser.email,
            doctorName,
            patientName,
            hospitalName: tenant?.name,
            scheduledAt: updated.scheduledAt,
            previousScheduledAt,
            appointmentId: updated.id,
          });
          await this.whatsappService.sendAppointmentRescheduleWhatsapp({
            recipientUserId: patientUser.id,
            recipientPhone: patientUser.phone,
            patientName,
            doctorName,
            hospitalName: tenant?.name,
            scheduledAt: updated.scheduledAt,
            previousScheduledAt,
            appointmentId: updated.id,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.error(
          `Appointment update email failed (appointmentId=${updated.id}, error=${message})`,
        );
      }
    }

    return updated;
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
