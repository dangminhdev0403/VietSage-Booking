import { Module } from '@nestjs/common';
import { VietSageSyncController } from './vietsage-sync.controller';
import { VietSageSyncService } from './vietsage-sync.service';

@Module({
  controllers: [VietSageSyncController],
  providers: [VietSageSyncService],
  exports: [VietSageSyncService],
})
export class VietSageSyncModule {}
