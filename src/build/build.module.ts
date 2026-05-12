import { Module } from '@nestjs/common';
import { ComponentController } from '../component/component.controller';
import { RollupBuildService } from './rollup-build.service';

@Module({
  imports: [],
  providers: [RollupBuildService],
  exports: [RollupBuildService],
})
export class BuildModule {}
