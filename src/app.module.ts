import { Module } from '@nestjs/common';
import { MinioModule } from './minio/minio.module';
import { BuildModule } from './build/build.module';
import { ConfigModule } from '@nestjs/config';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    MinioModule,
    BuildModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SecurityModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
