import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VietSageSyncService {
  private readonly logger = new Logger(VietSageSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncFromVietSage(syncType = 'all'): Promise<never> {
    this.logger.warn(`VietSage sync requested for type: ${syncType}, but adapter runtime is not configured.`);

    // Fail closed: Do NOT log fake SUCCESS or return fake success copy
    throw new NotImplementedException(
      'Tính năng đồng bộ VietSage PMS chưa được kích hoạt: runtime connector/adapter chưa được cấu hình.',
    );
  }

  async pushBookingToVietSage(bookingId: string): Promise<never> {
    this.logger.warn(`Push booking ${bookingId} to VietSage rejected: runtime connector not configured.`);

    throw new NotImplementedException(
      'Tính năng đẩy đơn đặt phòng sang VietSage chưa được kích hoạt: runtime connector/adapter chưa được cấu hình.',
    );
  }
}
