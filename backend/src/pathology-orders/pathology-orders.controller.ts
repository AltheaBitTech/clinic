import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LabOrderStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PathologyLabsService } from '../pathology-labs/pathology-labs.service';
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
import { PathologyOrdersService } from './pathology-orders.service';

const HOSPITAL_ROLES = [
  UserRole.HOSPITAL_ADMIN,
  UserRole.DOCTOR,
  UserRole.RECEPTIONIST,
];

@ApiTags('pathology-orders')
@ApiBearerAuth()
@Controller('pathology-orders')
export class PathologyOrdersController {
  constructor(
    private readonly ordersService: PathologyOrdersService,
    private readonly pathologyLabsService: PathologyLabsService,
  ) {}

  @Post('hospital')
  @Roles(...HOSPITAL_ROLES)
  @ApiOperation({
    summary: 'Place a lab order for a hospital patient against a linked lab',
  })
  createForHospital(
    @CurrentUser() user: any,
    @Body() dto: CreateLabOrderHospitalDto,
  ) {
    return this.ordersService.createForHospital(user.tenantId, user.id, dto);
  }

  @Get('collectors')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: "List this lab's sample collectors" })
  async findCollectors(@CurrentUser() user: any) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.findCollectors(lab.id);
  }

  @Post('collectors')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Add a sample collector to the roster' })
  async createCollector(
    @CurrentUser() user: any,
    @Body() dto: CreateLabCollectorDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.createCollector(lab.id, dto);
  }

  @Put('collectors/:id')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Update a sample collector' })
  async updateCollector(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLabCollectorDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.updateCollector(id, lab.id, dto);
  }

  @Post()
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: "Create a walk-in order for the lab's own patient" })
  async createWalkIn(
    @CurrentUser() user: any,
    @Body() dto: CreateLabOrderWalkInDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.createWalkIn(lab.id, user.id, dto);
  }

  @Get()
  @Roles(UserRole.PATHOLOGY, ...HOSPITAL_ROLES)
  @ApiOperation({
    summary:
      'List lab orders (lab sees all its orders; hospital sees only its own)',
  })
  @ApiQuery({ name: 'status', required: false, enum: LabOrderStatus })
  @ApiQuery({ name: 'hospitalTenantId', required: false })
  @ApiQuery({ name: 'collectionType', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: LabOrderStatus,
    @Query('hospitalTenantId') hospitalTenantId?: string,
    @Query('collectionType') collectionType?: string,
  ) {
    if (user.role === UserRole.PATHOLOGY) {
      const lab = await this.pathologyLabsService.getMine(user.id);
      return this.ordersService.findAllForLab(lab.id, {
        hospitalTenantId,
        status,
        collectionType,
      });
    }
    return this.ordersService.findAllForHospital(user.tenantId, { status });
  }

  @Get(':id')
  @Roles(UserRole.PATHOLOGY, ...HOSPITAL_ROLES)
  @ApiOperation({ summary: 'Get a lab order by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role === UserRole.PATHOLOGY) {
      const lab = await this.pathologyLabsService.getMine(user.id);
      return this.ordersService.findOneForLab(id, lab.id);
    }
    return this.ordersService.findOneForHospital(id, user.tenantId);
  }

  @Put(':id/schedule-collection')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({
    summary: 'Schedule (or update) sample collection for an order',
  })
  async scheduleCollection(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ScheduleCollectionDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.scheduleCollection(id, lab.id, user.id, dto);
  }

  @Put(':id/mark-collected')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({
    summary: 'Register the sample as collected — assigns Sample ID/barcode',
  })
  async markCollected(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CollectSampleDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.markCollected(id, lab.id, user.id, dto);
  }

  @Put(':id/receive')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Mark the sample as received at the lab' })
  async receive(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.receive(id, lab.id, user.id);
  }

  @Put(':id/accept-sample')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Accept a received sample for processing' })
  async acceptSample(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.acceptSample(id, lab.id, user.id);
  }

  @Put(':id/reject-sample')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({
    summary: 'Reject a received sample (insufficient, wrong container, etc.)',
  })
  async rejectSample(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RejectSampleDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.rejectSample(id, lab.id, user.id, dto);
  }

  @Put(':id/request-recollection')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Request recollection after a rejected sample' })
  async requestRecollection(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.requestRecollection(id, lab.id, user.id);
  }

  @Put(':id/start-processing')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Mark the order as being processed' })
  async startProcessing(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.startProcessing(id, lab.id, user.id);
  }

  @Put(':id/payment-status')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Mark an order as paid, pending, or refunded' })
  async updatePaymentStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.updatePaymentStatus(id, lab.id, user.id, dto);
  }

  @Put(':id/cancel')
  @Roles(UserRole.PATHOLOGY)
  @ApiOperation({ summary: 'Cancel an order' })
  async cancel(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CancelLabOrderDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.ordersService.cancel(id, lab.id, user.id, dto);
  }
}
