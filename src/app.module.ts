import { Module, ValidationPipe } from '@nestjs/common';
import { MinioModule } from './minio/minio.module';
import { BuildModule } from './build/build.module';
import { ConfigModule } from '@nestjs/config';
import { SecurityModule } from './security/security.module';
import { PostgresModule } from './postgres/postgres.module';
import { ComponentModule } from './components/component.module';
import { SourceModule } from './source/source.module';
import { PreviewModule } from './preview/preview.module';
import { LoadModule } from './load/load.module';
import { StatModule } from './stat/stat.module';
import { RedisModule } from './redis/redis.module';
import { JwtGuard } from './security/jwt.guard';

@Module({
  imports: [
    MinioModule,
    BuildModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SecurityModule,
    PostgresModule,
    ComponentModule,
    SourceModule,
    PreviewModule,
    LoadModule,
    StatModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    {
      provide: 'APP_PIPE',
      useValue: new ValidationPipe({
        whitelist: true, // удаляет лишние поля
        forbidNonWhitelisted: true, // бросает ошибку на лишние поля
        transform: true, // автоматически преобразует типы
      }),
    },
    {
      provide: 'APP_FILTER',
      useClass: JwtGuard
    }
  ],
})
export class AppModule {}
