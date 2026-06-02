import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const origin = configService.getOrThrow<string>('CORS_ORIGIN');

  app.enableCors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
