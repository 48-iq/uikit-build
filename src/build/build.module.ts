import { Module } from '@nestjs/common';
import { RollupBuildService } from './rollup-build.service';
import { PreviewBuildService } from './preview-build.service';
import { BuildService } from './build.service';
import { BuildLogService } from './build-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from 'src/postgres/entities/build.entity';
import { BuildController } from './build.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Build])],
  providers: [BuildService, RollupBuildService, PreviewBuildService, BuildLogService],
  exports: [BuildService, RollupBuildService, PreviewBuildService, BuildLogService],
  controllers: [BuildController],
})
export class BuildModule {}
