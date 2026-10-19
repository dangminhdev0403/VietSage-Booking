import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RequirePermission } from '../../common/auth/require-permission.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  CancelBookingDto,
  CreateBookingDto,
  LookupBookingDto,
  QuoteBookingDto,
  UpdateBookingStatusDto,
} from './dto/bookings.dto';

import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @RateLimit({ points: 20, duration: 60, keyPrefix: 'booking:quote' })
  @Post('quote')
  async getQuote(@Body() body: QuoteBookingDto) {
    const data = await this.bookingsService.getQuote(body);
    return ok(data);
  }

  @Public()
  @RateLimit({
    points: 6,
    duration: 60,
    keyPrefix: 'booking:create',
    errorMessage:
      'Bạn đã thực hiện quá nhiều yêu cầu đặt phòng. Vui lòng thử lại sau 1 phút.',
  })
  @Post()
  async createBooking(
    @Body() body: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-idempotency-key') xIdempotencyKey?: string,
  ) {
    const key = idempotencyKey || xIdempotencyKey;
    const data = await this.bookingsService.createBooking(body, undefined, key);
    return ok(data);
  }

  @Public()
  @RateLimit({
    points: 15,
    duration: 60,
    keyPrefix: 'booking:lookup',
    errorMessage:
      'Quá nhiều lần tra cứu đơn đặt phòng. Vui lòng chờ 1 phút trước khi thử lại.',
  })
  @Post('lookup')
  async lookupBooking(
    @Body() body: LookupBookingDto,
    @Headers('x-lookup-token') headerToken?: string,
  ) {
    const data = await this.bookingsService.lookupBooking({
      ...body,
      lookup_token: body.lookup_token || body.token || headerToken,
    });
    return ok(data);
  }

  @Public()
  @RateLimit({ points: 5, duration: 60, keyPrefix: 'booking:cancel' })
  @Post(':code/cancel')
  async cancelBooking(
    @Param('code') code: string,
    @Body() body: CancelBookingDto,
    @Headers('x-lookup-token') headerToken?: string,
  ) {
    const token = body.lookup_token || body.token || headerToken || '';
    const data = await this.bookingsService.cancelBooking(
      code,
      token,
      body.reason,
    );
    return ok(data);
  }

  @RequirePermission('bookings:read')
  @Get()
  async listBookings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('payment_status') paymentStatus?: string,
    @Query('search') search?: string,
    @Query('check_in_from') checkInFrom?: string,
    @Query('check_in_to') checkInTo?: string,
    @Query('property_id') propertyId?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    const data = await this.bookingsService.listBookings(
      {
        status,
        paymentStatus,
        search,
        checkInFrom,
        checkInTo,
        propertyId,
        page: page ? parseInt(page, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      },
      user,
    );
    return ok(data);
  }

  @RequirePermission('bookings:read')
  @Get('summary')
  async getBookingSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('property_id') propertyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.bookingsService.getBookingSummary(user, {
      propertyId,
      from,
      to,
    });
    return ok(data);
  }

  @RequirePermission('bookings:read')
  @Get(':id')
  async getBooking(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.bookingsService.getBookingByIdOrCode(id, user);
    return ok(data);
  }

  @RequirePermission('bookings:cancel')
  @Patch(':id/status')
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.bookingsService.updateBookingStatus(id, body, user);
    return ok(data);
  }
}
