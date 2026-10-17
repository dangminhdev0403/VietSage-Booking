import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RequireRole } from '../../common/auth/require-role.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  ConfirmPaymentDto,
  CreateDepositCheckoutDto,
  CreatePaymentIntentDto,
} from './dto/payments.dto';
import { createDepositCheckoutSchema } from './dto/payments.dto';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('checkout')
  async createDepositCheckout(
    @Body() body: CreateDepositCheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-lookup-token') lookupTokenHeader?: string,
  ) {
    const parsed = createDepositCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu khởi tạo thanh toán đặt cọc không hợp lệ',
        details: parsed.error.issues,
      });
    }
    const lookupToken = parsed.data.lookup_token || lookupTokenHeader;
    const data = await this.paymentsService.createDepositCheckout(
      parsed.data.booking_code,
      lookupToken,
      idempotencyKey,
    );
    return ok(data);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signatureHeader: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: unknown,
  ) {
    let rawBody: Buffer | string | undefined = req?.rawBody;
    if (!rawBody) {
      if (Buffer.isBuffer(body)) {
        rawBody = body;
      } else if (typeof body === 'string') {
        rawBody = body;
      } else if (body && typeof body === 'object') {
        rawBody = JSON.stringify(body);
      } else {
        rawBody = '';
      }
    }
    const data = await this.paymentsService.handleWebhook(
      rawBody,
      signatureHeader,
    );
    return ok(data);
  }

  @Public()
  @Post('create-intent')
  async createPaymentIntent(
    @Body() body: CreatePaymentIntentDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    const data = await this.paymentsService.createPaymentIntent(body, user);
    return ok(data);
  }

  @RequireRole('ADMIN', 'SUPER_ADMIN')
  @Post('confirm')
  async confirmPayment(
    @Body() body: ConfirmPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.paymentsService.confirmPayment(body, user);
    return ok(data);
  }

  @Public()
  @Get('booking/:bookingId')
  async getPaymentByBookingId(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser | null,
    @Query('contact') contact?: string,
  ) {
    const data = await this.paymentsService.getPaymentByBookingId(
      bookingId,
      user,
      contact,
    );
    return ok(data);
  }
}
