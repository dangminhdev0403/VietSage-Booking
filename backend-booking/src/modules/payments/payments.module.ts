import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import { VietSageSyncModule } from '../vietsage-sync/vietsage-sync.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeSignatureVerifier } from './stripe-signature.verifier';
import { StripeLocalMateClient } from './stripe-localmate.client';

@Module({
  imports: [PrismaModule, IdentityAccessModule, VietSageSyncModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeSignatureVerifier, StripeLocalMateClient],
  exports: [PaymentsService, StripeSignatureVerifier, StripeLocalMateClient],
})
export class PaymentsModule {}
