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
import { RequirePermission } from '../../common/auth/require-permission.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  ConfirmPaymentDto,
  CreateDepositCheckoutDto,
  CreatePaymentIntentDto,
  VerifyCheckoutDto,
} from './dto/payments.dto';
import {
  createDepositCheckoutSchema,
  verifyCheckoutSchema,
} from './dto/payments.dto';

import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @RateLimit({ points: 10, duration: 60, keyPrefix: 'payment:checkout' })
  @Post('checkout')
  async createDepositCheckout(
    @Body() body: CreateDepositCheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-lookup-token') lookupTokenHeader?: string,
    @Headers('origin') originHeader?: string,
    @Headers('referer') refererHeader?: string,
  ) {
    const parsed = createDepositCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu khởi tạo thanh toán đặt cọc không hợp lệ',
        details: parsed.error.issues,
      });
    }
    const lookupToken = parsed.data.lookup_token || lookupTokenHeader;
    let returnBaseUrl = parsed.data.return_url || originHeader;
    if (!returnBaseUrl && refererHeader) {
      try {
        returnBaseUrl = new URL(refererHeader).origin;
      } catch {}
    }
    const data = await this.paymentsService.createDepositCheckout(
      parsed.data.booking_code,
      lookupToken,
      idempotencyKey,
      returnBaseUrl,
    );
    return ok(data);
  }

  @Public()
  @RateLimit({ points: 20, duration: 60, keyPrefix: 'payment:verify' })
  @Post('verify-checkout')
  async verifyCheckout(
    @Body() body: VerifyCheckoutDto,
    @Headers('x-lookup-token') lookupTokenHeader?: string,
  ) {
    const parsed = verifyCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu kiểm tra thanh toán không hợp lệ',
        details: parsed.error.issues,
      });
    }
    const lookupToken = parsed.data.lookup_token || lookupTokenHeader;
    const data = await this.paymentsService.verifyCheckoutSession(
      parsed.data.booking_code,
      parsed.data.session_id,
      lookupToken,
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
  @RateLimit({ points: 10, duration: 60, keyPrefix: 'payment:intent' })
  @Post('create-intent')
  async createPaymentIntent(
    @Body() body: CreatePaymentIntentDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    const data = await this.paymentsService.createPaymentIntent(body, user);
    return ok(data);
  }

  @RequirePermission('payments:reconcile')
  @Post('confirm')
  async confirmPayment(
    @Body() body: ConfirmPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.paymentsService.confirmPayment(body, user);
    return ok(data);
  }

  @RequirePermission('payments:read')
  @Get()
  async listPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('property_id') propertyId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    const data = await this.paymentsService.listPayments(user, {
      propertyId,
      status,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
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
