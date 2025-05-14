import * as cookieParser from 'cookie-parser';

import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
