import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  InviteUserDto,
} from './dto/tenant.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

// PNG/JPEG only: the formats PDFKit can embed in invoices and prescriptions.
const LOGO_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new hospital/clinic tenant [SuperAdmin]' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tenants [SuperAdmin]' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.tenantsService.findAll(page, limit, type);
  }

  @Get('my')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get current user tenant profile' })
  getMyTenant(@CurrentUser() user: any) {
    return this.tenantsService.findOne(user.tenantId);
  }

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Browse active hospitals for patient signup [Public]',
  })
  @ApiQuery({ name: 'search', required: false })
  findPublic(@Query('search') search?: string) {
    return this.tenantsService.findPublic(search);
  }

  @Get('my/stats')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get hospital stats for current tenant' })
  getMyStats(@CurrentUser() user: any) {
    return this.tenantsService.getStats(user.tenantId);
  }

  @Get('my/analytics')
  @Roles(UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary:
      'Get appointment trends, financial trends, and department distribution for current tenant',
  })
  getMyAnalytics(@CurrentUser() user: any) {
    return this.tenantsService.getAnalytics(user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get tenant by ID [SuperAdmin]' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update tenant [SuperAdmin, HospitalAdmin]' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Post(':id/logo')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload hospital/clinic logo [SuperAdmin, HospitalAdmin]',
  })
  async uploadLogo(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.tenantId !== id) {
      throw new ForbiddenException('You can only change your own logo');
    }
    const ext = file && LOGO_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Upload a PNG or JPG logo (max 2MB)');
    }
    // Stored in the storage bucket, not local disk: serverless disk is
    // per-instance and wiped, so disk-saved logos vanished on Vercel.
    const url = await this.storageService.uploadBuffer(
      `logos/${id}/${Date.now()}${ext}`,
      file.buffer,
      file.mimetype,
    );
    await this.tenantsService.update(id, { logoUrl: url });
    return { url };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete tenant [SuperAdmin]' })
  delete(@Param('id') id: string) {
    return this.tenantsService.delete(id);
  }

  @Post(':id/invite')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Invite a user to the hospital' })
  invite(@Param('id') id: string, @Body() dto: InviteUserDto) {
    return this.tenantsService.inviteUser(id, dto);
  }
}
