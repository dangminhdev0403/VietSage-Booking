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
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  CancelBookingDto,
  CreateBookingDto,
  LookupBookingDto,
  QuoteBookingDto,
  UpdateBookingStatusDto,
} from './dto/bookings.dto';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post('quote')
  async getQuote(@Body() body: QuoteBookingDto) {
    const data = await this.bookingsService.getQuote(body);
    return ok(data);
  }

  @Public()
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

  @Get()
  async listBookings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    const data = await this.bookingsService.listBookings(
      {
        status,
        page: page ? parseInt(page, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      },
      user,
    );
    return ok(data);
  }

  @Get(':id')
  async getBooking(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.bookingsService.getBookingByIdOrCode(id, user);
    return ok(data);
  }

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
