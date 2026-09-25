import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LabOrderStatus, TimelineEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HospitalLabLinksService } from '../hospital-lab-links/hospital-lab-links.service';
import { LabAuditService } from '../pathology-shared/lab-audit.service';
import { LabCommissionService } from '../pathology-shared/lab-commission.service';
import {
  CancelLabOrderDto,
  CollectSampleDto,
  CreateLabOrderHospitalDto,
  CreateLabOrderWalkInDto,
  RejectSampleDto,
  ScheduleCollectionDto,
  UpdatePaymentStatusDto,
} from './dto/lab-order.dto';
import {
  CreateLabCollectorDto,
  UpdateLabCollectorDto,
} from './dto/lab-collector.dto';

const ORDER_INCLUDE = {
  patient: true,
  items: { include: { test: true } },
  collector: true,
  report: true,
} as const;

@Injectable()
export class PathologyOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hospitalLabLinksService: HospitalLabLinksService,
    private readonly commissionService: LabCommissionService,
    private readonly auditService: LabAuditService,
  ) {}

  private async nextOrderNo(labId: string) {
    const count = await this.prisma.labOrder.count({ where: { labId } });
    return `LAB-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }

  private async nextSampleId(labId: string) {
    const count = await this.prisma.labOrder.count({
      where: { labId, sampleId: { not: null } },
    });
    return `SMP-${String(count + 1).padStart(5, '0')}`;
  }

  private async resolveTests(labId: string, testIds: string[]) {
    if (!testIds?.length) {
      throw new BadRequestException('At least one test must be ordered');
    }
    const tests = await this.prisma.labTestCatalog.findMany({
      where: { id: { in: testIds }, labId, isActive: true },
    });
    if (tests.length !== new Set(testIds).size) {
      throw new BadRequestException(
        "One or more tests are not in this lab's catalog",
      );
    }
    return tests;
  }

  async createForHospital(
    hospitalTenantId: string,
    orderedByUserId: string,
    dto: CreateLabOrderHospitalDto,
  ) {
    await this.hospitalLabLinksService.assertActiveLink(
      hospitalTenantId,
      dto.labId,
    );

    const hospitalPatient = await this.prisma.patient.findFirst({
      where: { id: dto.hospitalPatientId, tenantId: hospitalTenantId },
      include: { user: true },
    });
    if (!hospitalPatient) throw new NotFoundException('Patient not found');

    let labPatient = await this.prisma.labPatient.findFirst({
      where: { labId: dto.labId, arogyixPatientId: hospitalPatient.id },
    });
    if (!labPatient) {
      labPatient = await this.prisma.labPatient.create({
        data: {
          labId: dto.labId,
          arogyixPatientId: hospitalPatient.id,
          name: `${hospitalPatient.user.firstName} ${hospitalPatient.user.lastName}`.trim(),
          phone: hospitalPatient.user.phone,
          email: hospitalPatient.user.email,
          dateOfBirth: hospitalPatient.dateOfBirth,
          gender: hospitalPatient.gender,
          address: hospitalPatient.address,
        },
      });
    }

    const tests = await this.resolveTests(dto.labId, dto.testIds);
    const order = await this.buildOrder({
      labId: dto.labId,
      patientId: labPatient.id,
      hospitalTenantId,
      hospitalPatientId: hospitalPatient.id,
      orderedByUserId,
      tests,
      dto,
    });

    await this.prisma.patientTimeline.create({
      data: {
        patientId: hospitalPatient.id,
        eventType: TimelineEventType.LAB_ORDER_PLACED,
        title: `Lab order placed (${order.orderNo})`,
        description: tests.map((t) => t.name).join(', '),
        metadata: { labOrderId: order.id },
      },
    });

    return order;
  }

  async createWalkIn(
    labId: string,
    orderedByUserId: string,
    dto: CreateLabOrderWalkInDto,
  ) {
    let patientId = dto.patientId;
    if (!patientId) {
      if (!dto.patient) {
        throw new BadRequestException(
          'Provide either patientId or patient details',
        );
      }
      const created = await this.prisma.labPatient.create({
        data: {
          labId,
          name: dto.patient.name,
          phone: dto.patient.phone,
          email: dto.patient.email,
          dateOfBirth: dto.patient.dateOfBirth
            ? new Date(dto.patient.dateOfBirth)
            : undefined,
          gender: dto.patient.gender,
          address: dto.patient.address,
        },
      });
      patientId = created.id;
    } else {
      const existing = await this.prisma.labPatient.findFirst({
        where: { id: patientId, labId },
      });
      if (!existing) throw new NotFoundException('Lab patient not found');
    }

    const tests = await this.resolveTests(labId, dto.testIds);
    return this.buildOrder({
      labId,
      patientId,
      hospitalTenantId: null,
      hospitalPatientId: null,
      orderedByUserId,
      tests,
      dto,
    });
  }

  private async buildOrder(params: {
    labId: string;
    patientId: string;
    hospitalTenantId: string | null;
    hospitalPatientId: string | null;
    orderedByUserId: string;
    tests: { id: string; name: string; price: any }[];
    dto: CreateLabOrderHospitalDto | CreateLabOrderWalkInDto;
  }) {
    const {
      labId,
      patientId,
      hospitalTenantId,
      hospitalPatientId,
      orderedByUserId,
      tests,
      dto,
    } = params;

    const subtotal = tests.reduce((sum, t) => sum + Number(t.price), 0);
    const discount = dto.discount ?? 0;
    const total = Math.max(subtotal - discount, 0);
    const commissionAmount = this.commissionService.compute(
      total,
      dto.commissionPercent,
    );
    const orderNo = await this.nextOrderNo(labId);

    const order = await this.prisma.labOrder.create({
      data: {
        labId,
        patientId,
        hospitalTenantId: hospitalTenantId ?? undefined,
        hospitalPatientId: hospitalPatientId ?? undefined,
        orderedByUserId,
        referringDoctorId: dto.referringDoctorId,
        referringDoctorName: dto.referringDoctorName,
        referringDoctorPhone: dto.referringDoctorPhone,
        commissionPercent: dto.commissionPercent,
        commissionAmount: commissionAmount ?? undefined,
        orderNo,
        collectionType: dto.collectionType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        collectionAddress: dto.collectionAddress,
        status:
          dto.collectionType === 'HOME' || dto.scheduledAt
            ? LabOrderStatus.SAMPLE_SCHEDULED
            : LabOrderStatus.ORDERED,
        subtotal,
        discount,
        tax: 0,
        total,
        notes: dto.notes,
        items: {
          create: tests.map((t) => ({
            testId: t.id,
            testNameSnapshot: t.name,
            price: t.price,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    await this.auditService.log(
      labId,
      orderedByUserId,
      'CREATE',
      'LabOrder',
      order.id,
    );
    return order;
  }

  async findAllForLab(
    labId: string,
    filters: {
      hospitalTenantId?: string;
      status?: LabOrderStatus;
      collectionType?: string;
    },
  ) {
    return this.prisma.labOrder.findMany({
      where: {
        labId,
        ...(filters.hospitalTenantId
          ? { hospitalTenantId: filters.hospitalTenantId }
          : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.collectionType
          ? { collectionType: filters.collectionType as any }
          : {}),
      },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForHospital(
    hospitalTenantId: string,
    filters: { status?: LabOrderStatus },
  ) {
    return this.prisma.labOrder.findMany({
      where: {
        hospitalTenantId,
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { ...ORDER_INCLUDE, lab: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForLab(id: string, labId: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, labId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findOneForHospital(id: string, hospitalTenantId: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: { id, hospitalTenantId },
      include: { ...ORDER_INCLUDE, lab: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async transition(
    id: string,
    labId: string,
    userId: string,
    from: LabOrderStatus[],
    to: LabOrderStatus,
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    const order = await this.findOneForLab(id, labId);
    if (!from.includes(order.status)) {
      throw new BadRequestException(
        `Cannot move an order from ${order.status} to ${to}`,
      );
    }
    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: { status: to, ...extra },
      include: ORDER_INCLUDE,
    });
    await this.auditService.log(labId, userId, action, 'LabOrder', id, {
      status: order.status,
    }, { status: to });
    return updated;
  }

  async scheduleCollection(
    id: string,
    labId: string,
    userId: string,
    dto: ScheduleCollectionDto,
  ) {
    return this.transition(
      id,
      labId,
      userId,
      [
        LabOrderStatus.ORDERED,
        LabOrderStatus.SAMPLE_SCHEDULED,
        LabOrderStatus.RECOLLECTION_REQUESTED,
      ],
      LabOrderStatus.SAMPLE_SCHEDULED,
      'SCHEDULE_COLLECTION',
      {
        collectionType: dto.collectionType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        collectionAddress: dto.collectionAddress,
        collectorId: dto.collectorId,
      },
    );
  }

  async markCollected(
    id: string,
    labId: string,
    userId: string,
    dto: CollectSampleDto = {},
  ) {
    const sampleId = await this.nextSampleId(labId);
    return this.transition(
      id,
      labId,
      userId,
      [LabOrderStatus.ORDERED, LabOrderStatus.SAMPLE_SCHEDULED],
      LabOrderStatus.SAMPLE_COLLECTED,
      'MARK_COLLECTED',
      {
        sampleId,
        barcodeValue: sampleId,
        sampleType: dto.sampleType,
        container: dto.container,
        collectionNotes: dto.notes,
        sampleCollectedAt: new Date(),
      },
    );
  }

  async receive(id: string, labId: string, userId: string) {
    return this.transition(
      id,
      labId,
      userId,
      [LabOrderStatus.SAMPLE_COLLECTED],
      LabOrderStatus.RECEIVED_AT_LAB,
      'RECEIVE',
      { receivedAtLabAt: new Date() },
    );
  }

  async acceptSample(id: string, labId: string, userId: string) {
    return this.transition(
      id,
      labId,
      userId,
      [LabOrderStatus.RECEIVED_AT_LAB],
      LabOrderStatus.ACCEPTED,
      'ACCEPT_SAMPLE',
      { acceptedAt: new Date(), acceptedByUserId: userId },
    );
  }

  async rejectSample(
    id: string,
    labId: string,
    userId: string,
    dto: RejectSampleDto,
  ) {
    return this.transition(
      id,
      labId,
      userId,
      [LabOrderStatus.RECEIVED_AT_LAB],
      LabOrderStatus.SAMPLE_REJECTED,
      'REJECT_SAMPLE',
      {
        rejectedAt: new Date(),
        rejectedByUserId: userId,
        rejectionReason: dto.rejectionReason,
        rejectionNotes: dto.rejectionNotes,
      },
    );
  }

  async requestRecollection(id: string, labId: string, userId: string) {
    return this.transition(
      id,
      labId,
      userId,
      [LabOrderStatus.SAMPLE_REJECTED],
      LabOrderStatus.RECOLLECTION_REQUESTED,
      'REQUEST_RECOLLECTION',
      { recollectionRequestedAt: new Date() },
    );
  }

  async startProcessing(id: string, labId: string, userId: string) {
    return this.transition(
      id,
      labId,
      userId,
      [LabOrderStatus.ACCEPTED],
      LabOrderStatus.IN_PROGRESS,
      'START_PROCESSING',
    );
  }

  async cancel(id: string, labId: string, userId: string, dto: CancelLabOrderDto) {
    const order = await this.findOneForLab(id, labId);
    const terminal: LabOrderStatus[] = [
      LabOrderStatus.VERIFIED,
      LabOrderStatus.REPORT_DELIVERED,
      LabOrderStatus.CANCELLED,
    ];
    if (terminal.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel an order that is ${order.status}`,
      );
    }
    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: {
        status: LabOrderStatus.CANCELLED,
        cancelReason: dto.cancelReason,
      },
      include: ORDER_INCLUDE,
    });
    await this.auditService.log(labId, userId, 'CANCEL', 'LabOrder', id, {
      status: order.status,
    }, { status: LabOrderStatus.CANCELLED });
    return updated;
  }

  async updatePaymentStatus(
    id: string,
    labId: string,
    userId: string,
    dto: UpdatePaymentStatusDto,
  ) {
    const order = await this.findOneForLab(id, labId);
    if (order.paymentStatus === dto.paymentStatus) {
      return order;
    }
    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: { paymentStatus: dto.paymentStatus },
      include: ORDER_INCLUDE,
    });
    await this.auditService.log(
      labId,
      userId,
      'UPDATE_PAYMENT_STATUS',
      'LabOrder',
      id,
      { paymentStatus: order.paymentStatus },
      { paymentStatus: dto.paymentStatus },
    );
    return updated;
  }

  // ── Collectors ──────────────────────────────────────────────

  async createCollector(labId: string, dto: CreateLabCollectorDto) {
    return this.prisma.labCollector.create({ data: { labId, ...dto } });
  }

  async findCollectors(labId: string) {
    return this.prisma.labCollector.findMany({
      where: { labId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateCollector(id: string, labId: string, dto: UpdateLabCollectorDto) {
    const collector = await this.prisma.labCollector.findFirst({
      where: { id, labId },
    });
    if (!collector) throw new NotFoundException('Collector not found');
    return this.prisma.labCollector.update({ where: { id }, data: dto });
  }
}
