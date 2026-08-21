import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { UpdateProfileDto, UploadAvatarDto } from './dto/user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { getUploadDir } from '../common/utils/upload.util';

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir('avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get()
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all users' })
  findAll(
    @CurrentUser() user: any,
    @Query('role') role?: UserRole,
    @Query('page') page?: number,
  ) {
    return this.svc.findAll(user.tenantId, role, page);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { storage }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  @ApiOperation({ summary: 'Upload profile avatar' })
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/avatars/${file.filename}` };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update own user profile' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.svc.updateProfile(user.id, dto);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle user active/inactive status' })
  toggleActive(@Param('id') id: string) {
    return this.svc.toggleActive(id);
  }
}
