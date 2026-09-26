import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  LabOrderStatus,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ReportType =
  | 'appointments'
  | 'patients'
  | 'doctor-activity'
  | 'revenue'
  | 'invoices'
  | 'payments'
  | 'prescriptions'
  | 'pharmacy-sales'
  | 'inventory'
  | 'follow-ups'
  | 'cancellations'
  | 'lab-orders';

export interface ReportFilters {
  preset?: string;
  from?: string;
  to?: string;
  doctorId?: string;
  departmentId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportResult {
  columns: ReportColumn[];
  rows: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
  summary?: Record<string, any>;
}

const REPORT_LABELS: Record<ReportType, string> = {
  appointments: 'Appointment Report',
  patients: 'Patient Report',
  'doctor-activity': 'Doctor Activity Report',
  revenue: 'Revenue Report',
  invoices: 'Invoice Report',
  payments: 'Payment Report',
  prescriptions: 'Prescription Report',
  'pharmacy-sales': 'Pharmacy Sales Report',
  inventory: 'Inventory Report',
  'follow-ups': 'Follow-up Report',
  cancellations: 'Cancellation Report',
  'lab-orders': 'Lab Orders Report',
};

function fullName(user?: { firstName?: string; lastName?: string } | null) {
  if (!user) return '—';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—';
}

function age(dateOfBirth?: Date | null) {
  if (!dateOfBirth) return null;
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

@Injectable()
export class HospitalReportsService {
  constructor(private prisma: PrismaService) {}

  isValidType(type: string): type is ReportType {
    return Object.prototype.hasOwnProperty.call(REPORT_LABELS, type);
  }

  labelFor(type: ReportType) {
    return REPORT_LABELS[type];
  }

  private resolveDateRange(preset?: string, from?: string, to?: string) {
    if (from || to) {
      return {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + 'T23:59:59.999') } : {}),
      };
    }
    if (!preset || preset === 'all') return undefined;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    switch (preset) {
      case 'today':
        return { gte: startOfToday, lte: endOfToday };
      case 'yesterday': {
        const y = new Date(startOfToday);
        y.setDate(y.getDate() - 1);
        const yEnd = new Date(endOfToday);
        yEnd.setDate(yEnd.getDate() - 1);
        return { gte: y, lte: yEnd };
      }
      case 'week': {
        const dayOfWeek = now.getDay();
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - dayOfWeek);
        return { gte: start, lte: endOfToday };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { gte: start, lte: endOfToday };
      }
      case 'year': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { gte: start, lte: endOfToday };
      }
      default:
        throw new BadRequestException(`Unknown date preset: ${preset}`);
    }
  }

  private async resolveDoctorIds(
    tenantId: string,
    doctorId?: string,
    departmentId?: string,
  ): Promise<string[] | undefined> {
    if (!doctorId && !departmentId) return undefined;
    if (doctorId && !departmentId) return [doctorId];

    const doctors = await this.prisma.doctor.findMany({
      where: {
        tenantId,
        ...(departmentId ? { departmentId } : {}),
        ...(doctorId ? { id: doctorId } : {}),
      },
      select: { id: true },
    });
    return doctors.map((d) => d.id);
  }

  async getReport(
    tenantId: string,
    type: ReportType,
    filters: ReportFilters,
  ): Promise<ReportResult> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

    switch (type) {
      case 'appointments':
        return this.appointmentsReport(tenantId, filters, page, limit);
      case 'patients':
        return this.patientsReport(tenantId, filters, page, limit);
      case 'doctor-activity':
        return this.doctorActivityReport(tenantId, filters, page, limit);
      case 'revenue':
        return this.revenueReport(tenantId, filters, page, limit);
      case 'invoices':
        return this.invoicesReport(tenantId, filters, page, limit);
      case 'payments':
        return this.paymentsReport(tenantId, filters, page, limit);
      case 'prescriptions':
        return this.prescriptionsReport(tenantId, filters, page, limit);
      case 'pharmacy-sales':
        return this.pharmacySalesReport(tenantId, filters, page, limit);
      case 'inventory':
        return this.inventoryReport(tenantId, filters, page, limit);
      case 'follow-ups':
        return this.followUpsReport(tenantId, filters, page, limit);
      case 'cancellations':
        return this.cancellationsReport(tenantId, filters, page, limit);
      case 'lab-orders':
        return this.labOrdersReport(tenantId, filters, page, limit);
      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }

  private async appointmentsReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );
    const doctorIds = await this.resolveDoctorIds(
      tenantId,
      filters.doctorId,
      filters.departmentId,
    );

    const where: any = {
      tenantId,
      ...(range ? { scheduledAt: range } : {}),
      ...(doctorIds ? { doctorId: { in: doctorIds } } : {}),
      ...(filters.status
        ? { status: filters.status as AppointmentStatus }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                patient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
              {
                doctor: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total, statusGroups] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true, department: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    const rows = rowsRaw.map((a) => ({
      id: a.id,
      date: a.scheduledAt,
      patient: fullName(a.patient?.user),
      doctor: fullName(a.doctor?.user),
      department: a.doctor?.department?.name || '—',
      type: a.type,
      status: a.status,
      reason: a.reason || '—',
    }));

    return {
      columns: [
        { key: 'date', label: 'Date & Time' },
        { key: 'patient', label: 'Patient' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'department', label: 'Department' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'reason', label: 'Reason' },
      ],
      rows,
      total,
      page,
      limit,
      summary: {
        totalAppointments: total,
        byStatus: statusGroups.map((g) => ({
          status: g.status,
          count: g._count.status,
        })),
      },
    };
  }

  private async patientsReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );

    const where: any = {
      tenantId,
      ...(range ? { createdAt: range } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                patientCode: { contains: filters.search, mode: 'insensitive' },
              },
              {
                user: {
                  OR: [
                    {
                      firstName: {
                        contains: filters.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      lastName: {
                        contains: filters.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      phone: { contains: filters.search, mode: 'insensitive' },
                    },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true,
          _count: { select: { appointments: true } },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    const rows = rowsRaw.map((p) => ({
      id: p.id,
      code: p.patientCode,
      name: fullName(p.user),
      gender: p.gender || '—',
      age: age(p.dateOfBirth) ?? '—',
      phone: p.user?.phone || '—',
      city: p.city || '—',
      registeredOn: p.createdAt,
      totalAppointments: p._count.appointments,
    }));

    return {
      columns: [
        { key: 'code', label: 'Patient Code' },
        { key: 'name', label: 'Name' },
        { key: 'gender', label: 'Gender' },
        { key: 'age', label: 'Age' },
        { key: 'phone', label: 'Phone' },
        { key: 'city', label: 'City' },
        { key: 'registeredOn', label: 'Registered On' },
        { key: 'totalAppointments', label: 'Total Appts' },
      ],
      rows,
      total,
      page,
      limit,
      summary: { totalPatients: total },
    };
  }

  private async doctorActivityReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );

    const doctorWhere: any = {
      tenantId,
      ...(filters.doctorId ? { id: filters.doctorId } : {}),
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.search
        ? {
            user: {
              OR: [
                {
                  firstName: { contains: filters.search, mode: 'insensitive' },
                },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where: doctorWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, department: true },
      }),
      this.prisma.doctor.count({ where: doctorWhere }),
    ]);

    const doctorIds = doctors.map((d) => d.id);

    const [apptGroups, prescriptionGroups, paidInvoices] = doctorIds.length
      ? await Promise.all([
          this.prisma.appointment.groupBy({
            by: ['doctorId', 'status'],
            where: {
              tenantId,
              doctorId: { in: doctorIds },
              ...(range ? { scheduledAt: range } : {}),
            },
            _count: { status: true },
          }),
          this.prisma.prescription.groupBy({
            by: ['doctorId'],
            where: {
              doctorId: { in: doctorIds },
              ...(range ? { createdAt: range } : {}),
            },
            _count: { doctorId: true },
          }),
          this.prisma.invoice.findMany({
            where: {
              tenantId,
              status: 'PAID',
              ...(range ? { paidAt: range } : {}),
              appointment: { doctorId: { in: doctorIds } },
            },
            select: {
              total: true,
              appointment: { select: { doctorId: true } },
            },
          }),
        ])
      : [[], [], []];

    const revenueByDoctor = new Map<string, number>();
    for (const inv of paidInvoices) {
      const doctorId = inv.appointment?.doctorId;
      if (!doctorId) continue;
      revenueByDoctor.set(
        doctorId,
        (revenueByDoctor.get(doctorId) || 0) + Number(inv.total),
      );
    }
    const prescriptionsByDoctor = new Map<string, number>(
      prescriptionGroups.map(
        (g) => [g.doctorId, g._count.doctorId] as [string, number],
      ),
    );

    const rows = doctors.map((d) => {
      const statuses = apptGroups.filter((g) => g.doctorId === d.id);
      const totalAppointments = statuses.reduce(
        (sum, g) => sum + g._count.status,
        0,
      );
      const completed =
        statuses.find((g) => g.status === 'COMPLETED')?._count.status || 0;
      const cancelled =
        statuses.find((g) => g.status === 'CANCELLED')?._count.status || 0;

      return {
        id: d.id,
        doctor: fullName(d.user),
        department: d.department?.name || '—',
        totalAppointments,
        completed,
        cancelled,
        prescriptions: prescriptionsByDoctor.get(d.id) || 0,
        revenue: revenueByDoctor.get(d.id) || 0,
      };
    });

    return {
      columns: [
        { key: 'doctor', label: 'Doctor' },
        { key: 'department', label: 'Department' },
        { key: 'totalAppointments', label: 'Total Appts' },
        { key: 'completed', label: 'Completed' },
        { key: 'cancelled', label: 'Cancelled' },
        { key: 'prescriptions', label: 'Prescriptions' },
        { key: 'revenue', label: 'Revenue (₹)' },
      ],
      rows,
      total,
      page,
      limit,
      summary: {
        totalRevenue: rows.reduce((sum, r) => sum + r.revenue, 0),
      },
    };
  }

  private async revenueReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );
    const doctorIds = await this.resolveDoctorIds(
      tenantId,
      filters.doctorId,
      filters.departmentId,
    );

    const where: any = {
      tenantId,
      status: 'PAID',
      ...(range ? { paidAt: range } : {}),
      ...(doctorIds ? { appointment: { doctorId: { in: doctorIds } } } : {}),
      ...(filters.search
        ? {
            OR: [
              { invoiceNo: { contains: filters.search, mode: 'insensitive' } },
              {
                patient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total, agg] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { include: { user: true } },
          appointment: { include: { doctor: { include: { user: true } } } },
        },
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.aggregate({ where, _sum: { total: true } }),
    ]);

    const rows = rowsRaw.map((inv) => ({
      id: inv.id,
      date: inv.paidAt,
      invoiceNo: inv.invoiceNo,
      patient: fullName(inv.patient?.user),
      doctor: fullName(inv.appointment?.doctor?.user),
      amount: Number(inv.amount),
      discount: Number(inv.discount || 0),
      tax: Number(inv.tax || 0),
      total: Number(inv.total),
    }));

    return {
      columns: [
        { key: 'date', label: 'Paid On' },
        { key: 'invoiceNo', label: 'Invoice No.' },
        { key: 'patient', label: 'Patient' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'amount', label: 'Amount (₹)' },
        { key: 'discount', label: 'Discount (₹)' },
        { key: 'tax', label: 'Tax (₹)' },
        { key: 'total', label: 'Total (₹)' },
      ],
      rows,
      total,
      page,
      limit,
      summary: { totalRevenue: Number(agg._sum.total || 0) },
    };
  }

  private async invoicesReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );
    const doctorIds = await this.resolveDoctorIds(
      tenantId,
      filters.doctorId,
      filters.departmentId,
    );

    const where: any = {
      tenantId,
      ...(range ? { createdAt: range } : {}),
      ...(doctorIds ? { appointment: { doctorId: { in: doctorIds } } } : {}),
      ...(filters.status ? { status: filters.status as PaymentStatus } : {}),
      ...(filters.search
        ? {
            OR: [
              { invoiceNo: { contains: filters.search, mode: 'insensitive' } },
              {
                patient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total, agg, statusGroups] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { patient: { include: { user: true } } },
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.aggregate({ where, _sum: { total: true } }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    const rows = rowsRaw.map((inv) => ({
      id: inv.id,
      date: inv.createdAt,
      invoiceNo: inv.invoiceNo,
      patient: fullName(inv.patient?.user),
      amount: Number(inv.amount),
      discount: Number(inv.discount || 0),
      tax: Number(inv.tax || 0),
      total: Number(inv.total),
      status: inv.status,
    }));

    return {
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'invoiceNo', label: 'Invoice No.' },
        { key: 'patient', label: 'Patient' },
        { key: 'amount', label: 'Amount (₹)' },
        { key: 'discount', label: 'Discount (₹)' },
        { key: 'tax', label: 'Tax (₹)' },
        { key: 'total', label: 'Total (₹)' },
        { key: 'status', label: 'Status' },
      ],
      rows,
      total,
      page,
      limit,
      summary: {
        totalAmount: Number(agg._sum.total || 0),
        byStatus: statusGroups.map((g) => ({
          status: g.status,
          count: g._count.status,
        })),
      },
    };
  }

  private async paymentsReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );

    const where: any = {
      tenantId,
      status: { in: ['PAID', 'PENDING'] as PaymentStatus[] },
      ...(range ? { createdAt: range } : {}),
      ...(filters.status ? { status: filters.status as PaymentStatus } : {}),
      ...(filters.search
        ? {
            OR: [
              { invoiceNo: { contains: filters.search, mode: 'insensitive' } },
              {
                patient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total, successfulAgg, pendingAgg] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { patient: { include: { user: true } } },
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { total: true },
        _count: { _all: true },
      }),
    ]);

    const rows = rowsRaw.map((inv) => ({
      id: inv.id,
      date: inv.createdAt,
      invoiceNo: inv.invoiceNo,
      patient: fullName(inv.patient?.user),
      total: Number(inv.total),
      status: inv.status,
      paidAt: inv.paidAt,
    }));

    return {
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'invoiceNo', label: 'Invoice No.' },
        { key: 'patient', label: 'Patient' },
        { key: 'total', label: 'Amount (₹)' },
        { key: 'status', label: 'Status' },
        { key: 'paidAt', label: 'Paid On' },
      ],
      rows,
      total,
      page,
      limit,
      summary: {
        successfulCount: successfulAgg._count._all,
        successfulAmount: Number(successfulAgg._sum.total || 0),
        pendingCount: pendingAgg._count._all,
        pendingAmount: Number(pendingAgg._sum.total || 0),
      },
    };
  }

  private async prescriptionsReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );
    const doctorIds = await this.resolveDoctorIds(
      tenantId,
      filters.doctorId,
      filters.departmentId,
    );

    const where: any = {
      doctor: { tenantId },
      ...(range ? { createdAt: range } : {}),
      ...(doctorIds ? { doctorId: { in: doctorIds } } : {}),
      ...(filters.search
        ? {
            OR: [
              { diagnosis: { contains: filters.search, mode: 'insensitive' } },
              {
                patient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          medicines: true,
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    const rows = rowsRaw.map((p) => ({
      id: p.id,
      date: p.createdAt,
      patient: fullName(p.patient?.user),
      doctor: fullName(p.doctor?.user),
      diagnosis: p.diagnosis || '—',
      medicinesCount: p.medicines.length,
      validUntil: p.validUntil,
    }));

    return {
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'patient', label: 'Patient' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'medicinesCount', label: 'Medicines' },
        { key: 'validUntil', label: 'Valid Until' },
      ],
      rows,
      total,
      page,
      limit,
      summary: { totalPrescriptions: total },
    };
  }

  /**
   * Hospitals don't own pharmacy Sale/Inventory data (pharmacies are
   * independent tenants with no hospital-linkage, unlike pathology labs).
   * This reports on medicines prescribed by this hospital's doctors as the
   * closest proxy available from data the hospital tenant actually owns.
   */
  private async pharmacySalesReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );
    const doctorIds = await this.resolveDoctorIds(
      tenantId,
      filters.doctorId,
      filters.departmentId,
    );

    const where: any = {
      prescription: {
        doctor: { tenantId },
        ...(range ? { createdAt: range } : {}),
        ...(doctorIds ? { doctorId: { in: doctorIds } } : {}),
      },
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
    };

    const [rowsRaw, total] = await Promise.all([
      this.prisma.medicine.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          prescription: {
            include: {
              patient: { include: { user: true } },
              doctor: { include: { user: true } },
            },
          },
        },
      }),
      this.prisma.medicine.count({ where }),
    ]);

    const rows = rowsRaw.map((m) => ({
      id: m.id,
      date: m.createdAt,
      medicine: m.name,
      type: m.type,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      patient: fullName(m.prescription?.patient?.user),
      doctor: fullName(m.prescription?.doctor?.user),
    }));

    return {
      columns: [
        { key: 'date', label: 'Prescribed On' },
        { key: 'medicine', label: 'Medicine' },
        { key: 'type', label: 'Type' },
        { key: 'dosage', label: 'Dosage' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'duration', label: 'Duration' },
        { key: 'patient', label: 'Patient' },
        { key: 'doctor', label: 'Prescribed By' },
      ],
      rows,
      total,
      page,
      limit,
      summary: {
        note: 'Proxy report based on medicines prescribed by this hospital’s doctors — pharmacies are independently-owned tenants with no linked sales data.',
      },
    };
  }

  /**
   * Proxy: the hospital's own medicine/ointment catalog (medical-catalog
   * module). There is no stock-quantity model owned by the hospital tenant.
   */
  private async inventoryReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const where: any = {
      tenantId,
      ...(filters.status ? { type: filters.status } : {}),
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
    };

    const [rowsRaw, total] = await Promise.all([
      this.prisma.medicalCatalogItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.medicalCatalogItem.count({ where }),
    ]);

    const rows = rowsRaw.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      dosage: c.dosage || '—',
      frequency: c.frequency || '—',
      timing: c.timing || '—',
      updatedOn: c.updatedAt,
    }));

    return {
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'dosage', label: 'Default Dosage' },
        { key: 'frequency', label: 'Default Frequency' },
        { key: 'timing', label: 'Default Timing' },
        { key: 'updatedOn', label: 'Updated On' },
      ],
      rows,
      total,
      page,
      limit,
      summary: {
        note: 'Hospital medicine/ointment catalog — hospitals don’t hold stock-quantity data directly.',
      },
    };
  }

  private async followUpsReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );
    const doctorIds = await this.resolveDoctorIds(
      tenantId,
      filters.doctorId,
      filters.departmentId,
    );
    const now = new Date();

    const followUpDateConditions: any[] = [{ followUpDate: { not: null } }];
    if (range) followUpDateConditions.push({ followUpDate: range });
    if (filters.status === 'overdue')
      followUpDateConditions.push({ followUpDate: { lt: now } });
    if (filters.status === 'upcoming')
      followUpDateConditions.push({ followUpDate: { gte: now } });

    const where: any = {
      tenantId,
      AND: followUpDateConditions,
      ...(doctorIds ? { doctorId: { in: doctorIds } } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                patient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { followUpDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const rows = rowsRaw.map((a) => ({
      id: a.id,
      originalDate: a.scheduledAt,
      patient: fullName(a.patient?.user),
      doctor: fullName(a.doctor?.user),
      followUpDate: a.followUpDate,
      followUpNotes: a.followUpNotes || '—',
      status: a.followUpDate && a.followUpDate < now ? 'Overdue' : 'Upcoming',
    }));

    return {
      columns: [
        { key: 'originalDate', label: 'Appointment Date' },
        { key: 'patient', label: 'Patient' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'followUpDate', label: 'Follow-up Date' },
        { key: 'followUpNotes', label: 'Notes' },
        { key: 'status', label: 'Status' },
      ],
      rows,
      total,
      page,
      limit,
      summary: { totalFollowUps: total },
    };
  }

  private async cancellationsReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );
    const doctorIds = await this.resolveDoctorIds(
      tenantId,
      filters.doctorId,
      filters.departmentId,
    );

    const where: any = {
      tenantId,
      status: 'CANCELLED' as AppointmentStatus,
      ...(range ? { cancelledAt: range } : {}),
      ...(doctorIds ? { doctorId: { in: doctorIds } } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                patient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
              {
                cancelReason: { contains: filters.search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { cancelledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true, department: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const rows = rowsRaw.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt,
      cancelledAt: a.cancelledAt,
      patient: fullName(a.patient?.user),
      doctor: fullName(a.doctor?.user),
      department: a.doctor?.department?.name || '—',
      reason: a.cancelReason || '—',
    }));

    return {
      columns: [
        { key: 'scheduledAt', label: 'Was Scheduled For' },
        { key: 'cancelledAt', label: 'Cancelled On' },
        { key: 'patient', label: 'Patient' },
        { key: 'doctor', label: 'Doctor' },
        { key: 'department', label: 'Department' },
        { key: 'reason', label: 'Reason' },
      ],
      rows,
      total,
      page,
      limit,
      summary: { totalCancellations: total },
    };
  }

  private async labOrdersReport(
    tenantId: string,
    filters: ReportFilters,
    page: number,
    limit: number,
  ): Promise<ReportResult> {
    const range = this.resolveDateRange(
      filters.preset,
      filters.from,
      filters.to,
    );

    const where: any = {
      hospitalTenantId: tenantId,
      ...(range ? { createdAt: range } : {}),
      ...(filters.status ? { status: filters.status as LabOrderStatus } : {}),
      ...(filters.search
        ? {
            OR: [
              { orderNo: { contains: filters.search, mode: 'insensitive' } },
              {
                hospitalPatient: {
                  user: {
                    OR: [
                      {
                        firstName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filters.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rowsRaw, total, byLabGroups] = await Promise.all([
      this.prisma.labOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lab: { select: { name: true } },
          hospitalPatient: { include: { user: true } },
        },
      }),
      this.prisma.labOrder.count({ where }),
      this.prisma.labOrder.groupBy({
        by: ['labId'],
        where,
        _sum: { total: true },
        _count: { _all: true },
      }),
    ]);

    const labIds = byLabGroups.map((g) => g.labId);
    const labs = labIds.length
      ? await this.prisma.pathologyLab.findMany({
          where: { id: { in: labIds } },
          select: { id: true, name: true },
        })
      : [];
    const labNameById = new Map(labs.map((l) => [l.id, l.name]));

    const rows = rowsRaw.map((o) => ({
      id: o.id,
      date: o.createdAt,
      orderNo: o.orderNo,
      lab: o.lab.name,
      patient: fullName(o.hospitalPatient?.user),
      status: o.status,
      total: Number(o.total),
    }));

    const totalSpend = byLabGroups.reduce(
      (sum, g) => sum + Number(g._sum.total || 0),
      0,
    );

    return {
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'orderNo', label: 'Order No.' },
        { key: 'lab', label: 'Lab' },
        { key: 'patient', label: 'Patient' },
        { key: 'status', label: 'Status' },
        { key: 'total', label: 'Total (₹)' },
      ],
      rows,
      total,
      page,
      limit,
      summary: {
        totalOrders: total,
        totalSpendAmount: totalSpend,
        byLab: byLabGroups.map((g) => ({
          labId: g.labId,
          labName: labNameById.get(g.labId) || 'Unknown',
          orderCount: g._count._all,
          totalSpend: Number(g._sum.total || 0),
        })),
      },
    };
  }

  toCsv(result: ReportResult): string {
    const escape = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = value instanceof Date ? value.toISOString() : String(value);
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const header = result.columns.map((c) => escape(c.label)).join(',');
    const lines = result.rows.map((row) =>
      result.columns.map((c) => escape(row[c.key])).join(','),
    );
    return [header, ...lines].join('\n');
  }
}
