import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GlobalExceptionFilter } from './common/http/global-exception.filter';
import { HttpLoggerMiddleware } from './common/http/http-logger.middleware';
import { JwtAuthenticationGuard } from './common/auth/jwt-authentication.guard';
import { PermissionGuard } from './common/auth/permission.guard';
import { IdentityAccessModule } from './modules/identity-access/identity-access.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { VietSageSyncModule } from './modules/vietsage-sync/vietsage-sync.module';

@Module({
  imports: [
    PrismaModule,
    IdentityAccessModule,
    CatalogModule,
    BookingsModule,
    PaymentsModule,
    VietSageSyncModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
