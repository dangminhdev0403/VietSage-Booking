import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  getRuntimeValue,
  validateProductionEnvironment,
} from './common/config/runtime-config';

async function bootstrap() {
  validateProductionEnvironment();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const allowedOrigins = getRuntimeValue(
    'CORS_ORIGINS',
    'http://localhost:3000',
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true });
  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  console.log(`[VietSage-Booking Backend] Running at http://localhost:${port}`);
}
void bootstrap();
