import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { RequirePermission } from '../../common/auth/require-permission.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  CreatePropertyDto,
  CreateRoomTypeDto,
  CreateServiceDto,
  UpdateAllotmentDto,
  UpdatePropertyDto,
  UpdateRoomTypeDto,
} from './dto/catalog.dto';

import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';

@Controller('api/v1')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @RateLimit({ points: 60, duration: 60, keyPrefix: 'catalog:list' })
  @Get('properties')
  async listProperties(
    @Query('city') city?: string,
    @Query('keyword') keyword?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('star_rating') starRating?: string,
    @Query('guests') guests?: string,
    @Query('sort_by')
    sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest',
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    const data = await this.catalogService.listProperties({
      city,
      keyword,
      min_price: minPrice ? parseInt(minPrice, 10) : undefined,
      max_price: maxPrice ? parseInt(maxPrice, 10) : undefined,
      star_rating: starRating ? parseFloat(starRating) : undefined,
      guests: guests ? parseInt(guests, 10) : undefined,
      sort_by: sortBy,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
    return ok(data);
  }

  @Public()
  @Get('properties/:id')
  async getProperty(@Param('id') id: string) {
    const data = await this.catalogService.getPropertyById(id);
    return ok(data);
  }

  @RequirePermission('catalog:read')
  @Get('properties/:id/allotments')
  async getPropertyAllotments(
    @Param('id') id: string,
    @Query('month') month: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.getPropertyAllotments(
      id,
      month,
      user,
    );
    return ok(data);
  }

  @RequirePermission('allotments:manage')
  @Post('allotments/update')
  async updateAllotment(
    @Body() body: UpdateAllotmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateAllotment(body, user);
    return ok(data);
  }

  @RequirePermission('catalog:onboard')
  @Post('properties')
  async createProperty(@Body() body: CreatePropertyDto) {
    const data = await this.catalogService.createProperty(body);
    return ok(data);
  }

  @RequirePermission('catalog:manage')
  @Put('properties/:id')
  async updateProperty(
    @Param('id') id: string,
    @Body() body: UpdatePropertyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateProperty(id, body, user);
    return ok(data);
  }

  @RequirePermission('catalog:manage')
  @Get('properties/:id/vietsage-preview')
  async previewVietSageRooms(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.previewVietSageRooms(id, user);
    return ok(data);
  }

  @RequirePermission('catalog:manage')
  @Post('properties/:id/vietsage-import')
  async importVietSageRooms(
    @Param('id') id: string,
    @Body() body: { selected_keys?: string[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.importVietSageRooms(
      id,
      body?.selected_keys,
      user,
    );
    return ok(data);
  }

  @Public()
  @Get('services')
  async listServices(@Query('category') category?: string) {
    const data = await this.catalogService.listServices(category);
    return ok(data);
  }

  @RequirePermission('catalog:onboard')
  @Post('services')
  async createService(@Body() body: CreateServiceDto) {
    const data = await this.catalogService.createService(body);
    return ok(data);
  }

  @RequirePermission('catalog:manage')
  @Post('room-types')
  async createRoomType(
    @Body() body: CreateRoomTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.createRoomType(body, user);
    return ok(data);
  }

  @RequirePermission('catalog:manage')
  @Put('room-types/:id')
  async updateRoomType(
    @Param('id') id: string,
    @Body() body: UpdateRoomTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateRoomType(id, body, user);
    return ok(data);
  }

  @RequirePermission('catalog:manage')
  @Delete('room-types/:id')
  async deleteRoomType(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.deleteRoomType(id, user);
    return ok(data);
  }
}
