import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { VietSageSyncModule } from '../vietsage-sync/vietsage-sync.module';

@Module({
  imports: [VietSageSyncModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
