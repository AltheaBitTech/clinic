import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PathologyLabsService } from '../pathology-labs/pathology-labs.service';
import {
  AcknowledgeCriticalDto,
  AmendReportDto,
  EnterLabResultsDto,
} from './dto/lab-result.dto';
import { PathologyResultsService } from './pathology-results.service';

@ApiTags('pathology-results')
@ApiBearerAuth()
@Controller('pathology-orders')
@Roles(UserRole.PATHOLOGY)
export class PathologyResultsController {
  constructor(
    private readonly resultsService: PathologyResultsService,
    private readonly pathologyLabsService: PathologyLabsService,
  ) {}

  @Post(':orderItemId/results')
  @ApiOperation({
    summary: 'Enter (or replace) structured results for one order item',
  })
  async enterResults(
    @CurrentUser() user: any,
    @Param('orderItemId') orderItemId: string,
    @Body() dto: EnterLabResultsDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.resultsService.enterResults(orderItemId, lab.id, user.id, dto);
  }

  @Put('results/:resultValueId/notify-critical')
  @ApiOperation({ summary: 'Record that the ordering doctor was notified of a critical result' })
  async notifyCritical(
    @CurrentUser() user: any,
    @Param('resultValueId') resultValueId: string,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.resultsService.notifyCritical(resultValueId, lab.id, user.id);
  }

  @Put('results/:resultValueId/acknowledge-critical')
  @ApiOperation({ summary: 'Record the doctor/nurse acknowledgement of a critical result' })
  async acknowledgeCritical(
    @CurrentUser() user: any,
    @Param('resultValueId') resultValueId: string,
    @Body() dto: AcknowledgeCriticalDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.resultsService.acknowledgeCritical(resultValueId, lab.id, user.id, dto);
  }

  @Put(':id/submit-for-verification')
  @ApiOperation({
    summary: 'Technician submits completed results for pathologist verification',
  })
  async submitForVerification(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.resultsService.submitForVerification(id, lab.id, user.id);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Pathologist sign-off — generates the report PDF' })
  async verify(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.resultsService.verify(id, lab.id, user.id);
  }

  @Put(':id/deliver')
  @ApiOperation({
    summary: 'Deliver the report to the patient (and hospital, if linked)',
  })
  async deliver(@CurrentUser() user: any, @Param('id') id: string) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.resultsService.deliver(id, lab.id, user.id);
  }

  @Put(':id/amend')
  @ApiOperation({
    summary: 'Reopen a finalized report for correction (pathologist only)',
  })
  async amend(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AmendReportDto,
  ) {
    const lab = await this.pathologyLabsService.getMine(user.id);
    return this.resultsService.amend(id, lab.id, user.id, dto);
  }
}
