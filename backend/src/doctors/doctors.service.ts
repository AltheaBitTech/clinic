import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDoctorDto) {
    // Update user role to DOCTOR
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: 'DOCTOR', tenantId },
    });

    return this.prisma.doctor.create({
      data: {
        userId: dto.userId,
        tenantId,
        specialization: dto.specialization,
        departmentId: dto.departmentId,
        qualification: dto.qualification,
        registrationNo: dto.registrationNo,
        experienceYears: dto.experienceYears,
        consultationFee: dto.consultationFee,
        bio: dto.bio,
        availableDays: dto.availableDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        consultationStart: dto.consultationStart || '09:00',
        consultationEnd: dto.consultationEnd || '17:00',
        slotDuration: dto.slotDuration || 30,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
        department: true,
      },
    });
  }

  async findAll(tenantId: string, departmentId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (departmentId) where.departmentId = departmentId;

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
          department: true,
          _count: { select: { appointments: true, prescriptions: true } },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        _count: { select: { appointments: true, prescriptions: true } },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findOne(id);
    return this.prisma.doctor.update({
      where: { id },
      data: {
        specialization: dto.specialization,
        departmentId: dto.departmentId,
        qualification: dto.qualification,
        registrationNo: dto.registrationNo,
        experienceYears: dto.experienceYears,
        consultationFee: dto.consultationFee,
        bio: dto.bio,
        availableDays: dto.availableDays,
        consultationStart: dto.consultationStart,
        consultationEnd: dto.consultationEnd,
        slotDuration: dto.slotDuration,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } }, department: true },
    });
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const doctor = await this.findOne(doctorId);
    const dayDate = new Date(date);
    const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dayDate.getDay()];

    if (!doctor.availableDays.includes(dayName)) {
      return { available: false, slots: [] };
    }

    // Get existing appointments for that day
    const existingAppts = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: new Date(dayDate.setHours(0, 0, 0, 0)),
          lt: new Date(dayDate.setHours(23, 59, 59, 999)),
        },
        status: { notIn: ['CANCELLED'] },
      },
      select: { scheduledAt: true },
    });

    const bookedTimes = existingAppts.map((a) => a.scheduledAt.getHours() * 60 + a.scheduledAt.getMinutes());

    // Generate slots
    const [startH, startM] = doctor.consultationStart.split(':').map(Number);
    const [endH, endM] = doctor.consultationEnd.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const slots: string[] = [];

    const now = new Date();
    const isToday = now.toDateString() === new Date(date).toDateString();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (let min = startMin; min < endMin; min += doctor.slotDuration) {
      if (isToday && min <= nowMin) continue;
      if (!bookedTimes.includes(min)) {
        const h = Math.floor(min / 60).toString().padStart(2, '0');
        const m = (min % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }

    return { available: true, slots, date };
  }
}
