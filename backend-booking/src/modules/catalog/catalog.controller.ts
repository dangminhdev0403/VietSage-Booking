import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import type {
  CreatePropertyDto,
  CreateServiceDto,
  UpdateAllotmentDto,
} from './dto/catalog.dto';

@Controller('api/v1')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
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

  @Post('allotments/update')
  async updateAllotment(
    @Body() body: UpdateAllotmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.catalogService.updateAllotment(body, user);
    return ok(data);
  }

  @Post('properties')
  async createProperty(@Body() body: CreatePropertyDto) {
    const data = await this.catalogService.createProperty(body);
    return ok(data);
  }

  @Public()
  @Get('services')
  async listServices(@Query('category') category?: string) {
    const data = await this.catalogService.listServices(category);
    return ok(data);
  }

  @Post('services')
  async createService(@Body() body: CreateServiceDto) {
    const data = await this.catalogService.createService(body);
    return ok(data);
  }
}
