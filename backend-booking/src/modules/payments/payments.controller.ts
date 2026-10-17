import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RequireRole } from '../../common/auth/require-role.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  ConfirmPaymentDto,
  CreatePaymentIntentDto,
} from './dto/payments.dto';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
