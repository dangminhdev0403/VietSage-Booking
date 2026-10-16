import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthenticationGuard } from '../../common/auth/jwt-authentication.guard';
import { RequireRole } from '../../common/auth/require-role.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type { CreateBookingDto, UpdateBookingStatusDto } from './dto/bookings.dto';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post()
  async createBooking(
    @Body() body: CreateBookingDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ) {
    const data = await this.bookingsService.createBooking(body, user?.id);
    return ok(data);
  }

  @Public()
  @Get()
  async listBookings(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const isCustomer = user?.role === 'TRAVELER';
    const data = await this.bookingsService.listBookings({
      status,
      accountId: isCustomer ? user?.id : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
    return ok(data);
  }

  @Public()
  @Get(':id')
  async getBooking(@Param('id') id: string) {
    const data = await this.bookingsService.getBookingByIdOrCode(id);
    return ok(data);
  }

  @Public()
  @Patch(':id/status')

  async updateBookingStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.bookingsService.updateBookingStatus(id, body, user.id);
    return ok(data);
  }
}
