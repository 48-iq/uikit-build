import { Module } from '@nestjs/common';
import { RollupBuildService } from './rollup-build.service';
import { BuildTrackerService } from './build-tracker.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from 'src/postgres/entities/build.entity';
import { BuildController } from './build.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Build])],
  providers: [RollupBuildService, BuildTrackerService],
  exports: [RollupBuildService, BuildTrackerService],
  controllers: [BuildController],
})
export class BuildModule {}