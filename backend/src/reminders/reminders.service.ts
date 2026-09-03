import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  @Cron('0 */15 * * * *') // Every 15 minutes
  async processReminders() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 16 * 60 * 1000); // next 16 min

    const pending = await this.prisma.medicineReminder.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { gte: now, lte: windowEnd },
      },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, email: true, phone: true, firstName: true },
            },
          },
        },
        medicine: true,
      },
      take: 100,
    });

    for (const reminder of pending) {
      try {
        if (reminder.channel === 'WHATSAPP') {
          await this.whatsappService.sendMedicineReminderWhatsapp({
            recipientUserId: reminder.patient.user.id,
            recipientPhone: reminder.patient.user.phone,
            patientName: reminder.patient.user.firstName,
            medicineName: reminder.medicine.name,
            dosage: reminder.medicine.dosage,
          });
        } else {
          // TODO: Replace with real channel dispatch (Email/SMS)
          console.log(
            `[REMINDER] ${reminder.patient.user.firstName}: Take ${reminder.medicine.name} (${reminder.medicine.dosage}) — ${reminder.channel}`,
          );
        }

        await this.prisma.medicineReminder.update({
          where: { id: reminder.id },
          data: { status: 'SENT', sentAt: new Date() },
        });

        // Log in timeline
        await this.prisma.patientTimeline.create({
          data: {
            patientId: reminder.patientId,
            eventType: 'REMINDER_SENT',
            title: `Medicine Reminder Sent`,
            description: `Reminder for ${reminder.medicine.name} via ${reminder.channel}`,
            metadata: {
              medicineId: reminder.medicineId,
              channel: reminder.channel,
            },
          },
        });
      } catch (err) {
        await this.prisma.medicineReminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED' },
        });
      }
    }

    if (pending.length > 0) {
      console.log(`[CRON] Processed ${pending.length} medicine reminders`);
    }
  }

  @Cron('0 0 * * * *') // Every hour
  async processAppointmentReminders() {
    // Send reminders for appointments in the next 24 hours
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: tomorrow, lte: tomorrowEnd },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        tenant: { select: { name: true } },
      },
    });

    for (const appt of upcoming) {
      console.log(
        `[APPT REMINDER] ${appt.patient.user.firstName}: Appointment tomorrow with Dr. ${appt.doctor.user.firstName} at ${appt.scheduledAt.toLocaleTimeString()}`,
      );

      try {
        await this.whatsappService.sendAppointmentReminderWhatsapp({
          recipientUserId: appt.patient.user.id,
          recipientPhone: appt.patient.user.phone,
          patientName:
            `${appt.patient.user.firstName} ${appt.patient.user.lastName}`.trim(),
          doctorName:
            `Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`.trim(),
          hospitalName: appt.tenant?.name,
          scheduledAt: appt.scheduledAt,
          appointmentId: appt.id,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.error(
          `Appointment reminder WhatsApp failed (appointmentId=${appt.id}, error=${message})`,
        );
      }

      await this.prisma.notification.create({
        data: {
          userId: appt.patient.userId,
          title: 'Appointment Tomorrow',
          body: `Your appointment with Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName} is tomorrow at ${appt.scheduledAt.toLocaleTimeString()}`,
          channel: 'EMAIL',
          scheduledAt: new Date(),
        },
      });
    }

    if (upcoming.length > 0) {
      console.log(`[CRON] Sent ${upcoming.length} appointment reminders`);
    }
  }
}
