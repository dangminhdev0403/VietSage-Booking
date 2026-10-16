import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ok } from '../../common/http/api-response';
import { Public } from '../../common/auth/public.decorator';
import { JwtAuthenticationGuard } from '../../common/auth/jwt-authentication.guard';
import { RequireRole } from '../../common/auth/require-role.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';
import type { CreatePropertyDto, CreateServiceDto } from './dto/catalog.dto';

@Controller('api/v1')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('properties')
  async listProperties(
    @Query('city') city?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    const data = await this.catalogService.listProperties({
      city,
      keyword,
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

  @UseGuards(JwtAuthenticationGuard, PermissionGuard)
  @RequireRole('ADMIN', 'SUPER_ADMIN', 'HOTEL_PARTNER')
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

  @UseGuards(JwtAuthenticationGuard, PermissionGuard)
  @RequireRole('ADMIN', 'SUPER_ADMIN', 'HOTEL_PARTNER')
  @Post('services')
  async createService(@Body() body: CreateServiceDto) {
    const data = await this.catalogService.createService(body);
    return ok(data);
  }
}
