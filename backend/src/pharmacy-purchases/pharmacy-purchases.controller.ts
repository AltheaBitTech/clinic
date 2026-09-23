import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmaciesService } from '../pharmacies/pharmacies.service';
import {
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  SendPurchaseOrderEmailDto,
} from './dto/purchase-order.dto';
import { PharmacyPurchasesService } from './pharmacy-purchases.service';

@ApiTags('pharmacy-purchases')
@ApiBearerAuth()
@Controller('pharmacy/purchases')
@Roles(UserRole.PHARMACY)
export class PharmacyPurchasesController {
  constructor(
    private readonly purchasesService: PharmacyPurchasesService,
    private readonly pharmaciesService: PharmaciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a purchase order' })
  async create(@CurrentUser() user: any, @Body() dto: CreatePurchaseOrderDto) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.create(pharmacy.id, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  async findAll(@CurrentUser() user: any) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.findAll(pharmacy.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.findOne(id, pharmacy.id);
  }

  @Post(':id/receive')
  @ApiOperation({
    summary: 'Receive stock against a purchase order (full or partial)',
  })
  async receive(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.receive(id, pharmacy.id, user.id, dto);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download purchase order PDF' })
  async downloadPdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    const { buffer, fileName } = await this.purchasesService.getPdfFile(
      id,
      pharmacy.id,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(buffer);
  }

  @Post(':id/email')
  @ApiOperation({ summary: 'Email the purchase order PDF to the supplier' })
  async email(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SendPurchaseOrderEmailDto,
  ) {
    const pharmacy = await this.pharmaciesService.getMine(user.id);
    return this.purchasesService.emailToSupplier(id, pharmacy.id, dto);
  }

  // Unauthenticated so the order can be shared as a link (e.g. via WhatsApp)
  // with a supplier who has no account in the system. `@Roles()` with no
  // arguments overrides the class-level @Roles(PHARMACY) so RolesGuard does
  // not reject the request for having no authenticated user.
  @Get(':id/pdf/public')
  @Public()
  @Roles()
  @ApiOperation({ summary: 'View the purchase order PDF via a shareable link' })
  async downloadPublicPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName } =
      await this.purchasesService.getPublicPdfFile(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    res.send(buffer);
  }
}
