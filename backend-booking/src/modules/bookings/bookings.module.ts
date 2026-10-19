import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import { VietSageSyncModule } from '../vietsage-sync/vietsage-sync.module';

@Module({
  imports: [IdentityAccessModule, VietSageSyncModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
