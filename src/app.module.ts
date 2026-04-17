import { Module } from '@nestjs/common';
import { MinioModule } from './minio/minio.module';
import { BuildModule } from './build/build.module';
import { ConfigModule } from '@nestjs/config';
import { SecurityModule } from './security/security.module';
import { PostgresModule } from './postgres/postgres.module';
import { ComponentModule } from './component/component.module';
import { SourceModule } from './source/source.module';

@Module({
  imports: [
    MinioModule,
    BuildModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SecurityModule,
    PostgresModule,
    ComponentModule,
    SourceModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
