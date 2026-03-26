import { Module } from '@nestjs/common';
import { MinioModule } from './minio/minio.module';
import { BuildModule } from './build/build.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MinioModule,
    BuildModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
