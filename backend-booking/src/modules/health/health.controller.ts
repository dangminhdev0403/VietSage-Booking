import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/public.decorator';
import { HealthService } from './health.service';
import type { HealthResponse, ReadinessResponse } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Public()
  @Get('ready')
  getReadiness(): Promise<ReadinessResponse> {
    return this.healthService.getReadiness();
  }
}
