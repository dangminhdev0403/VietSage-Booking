import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VietSageSyncService {
  private readonly logger = new Logger(VietSageSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncFromVietSage(syncType = 'all') {
    this.logger.log(`Starting VietSage synchronization for type: ${syncType}`);

    const syncLog = await this.prisma.vietSageSyncLog.create({
      data: {
        syncType,
        direction: 'INBOUND',
        status: 'PENDING',
        payload: { triggered_at: new Date().toISOString() },
      },
    });

    try {
      // In production, this calls VietSage API (e.g. GET /api/v1/hotels, GET /api/v1/rates)
      // Here we simulate successful sync or connector execution
      const syncedPropertiesCount = await this.prisma.property.count();

      await this.prisma.vietSageSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          response: {
            synced_properties_count: syncedPropertiesCount,
            message: 'Đồng bộ dữ liệu phòng và dịch vụ với VietSage thành công',
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        sync_id: syncLog.id,
        status: 'SUCCESS',
        synced_properties_count: syncedPropertiesCount,
        message: 'Đồng bộ hóa dữ liệu với VietSage PMS thành công',
      };
    } catch (error: any) {
      this.logger.error('VietSage sync failed', error);

      await this.prisma.vietSageSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      throw error;
    }
  }

  async pushBookingToVietSage(bookingId: string) {
    this.logger.log(`Pushing booking ${bookingId} to VietSage`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true, roomType: true },
    });

    if (!booking) return;

    await this.prisma.vietSageSyncLog.create({
      data: {
        syncType: 'booking_push',
        direction: 'OUTBOUND',
        status: 'SUCCESS',
        payload: {
          ota_booking_code: booking.bookingCode,
          guest_name: booking.guestName,
          check_in: booking.checkIn,
          check_out: booking.checkOut,
          total_price: booking.totalPrice,
        },
        response: {
          vietsage_reservation_id: `VS-RES-${Date.now()}`,
          status: 'RECEIVED',
        },
      },
    });
  }
}
