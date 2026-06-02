import { Module, ValidationPipe } from '@nestjs/common';
import { MinioModule } from './minio/minio.module';
import { BuildModule } from './build/build.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgresModule } from './postgres/postgres.module';
import { ComponentModule } from './components/component.module';
import { PreviewModule } from './preview/preview.module';
import { StatModule } from './stat/stat.module';
import { RedisModule } from './redis/redis.module';
import { JwtGuard } from './security/jwt.guard';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './errors/all-exceptions.filter';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MinioModule,
    BuildModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PostgresModule,
    ComponentModule,
    PreviewModule,
    StatModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        //issuer: configService.getOrThrow<string>('JWT_ISSUER'),
        //audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
        //algorithm: configService.getOrThrow<string>('JWT_ALGORITHM'),
        //expTime: configService.getOrThrow<number>('JWT_EXP_TIME'),
        
      }),
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // удаляет лишние поля
        forbidNonWhitelisted: true, // бросает ошибку на лишние поля
        transform: true, // автоматически преобразует типы
      }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtGuard
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    }
  ],
  
})
export class AppModule {}
