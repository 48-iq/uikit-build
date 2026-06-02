import { Module } from '@nestjs/common';
import { RollupBuildService } from './services/rollup-build.service';
import { PreviewBuildService } from './services/preview-build.service';
import { BuildService } from './services/build.service';
import { BuildLogService } from './services/build-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from 'src/postgres/entities/build.entity';
import { BuildController } from './build.controller';
import { Load } from 'src/postgres/entities/load.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Build, Load])],
  providers: [
    BuildService,
    RollupBuildService,
    PreviewBuildService,
    BuildLogService,
  ],
  exports: [
    BuildService,
    RollupBuildService,
    PreviewBuildService,
    BuildLogService,
  ],
  controllers: [BuildController],
})
export class BuildModule {}
