import { Body, Controller, Get, Headers, Post, Query, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { WhatsappService } from './whatsapp.service';

@ApiExcludeController()
@Controller('whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Public()
  @Get('webhook')
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    return this.whatsappService.verifyWebhookChallenge(mode, token, challenge);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ) {
    return this.whatsappService.processWebhookEvent(
      req.rawBody,
      signature,
      body,
    );
  }
}
