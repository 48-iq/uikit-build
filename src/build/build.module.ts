import { Module } from '@nestjs/common';
import { RollupBuildService } from './rollup-build.service';

@Module({
  imports: [],
  providers: [RollupBuildService],
  exports: [RollupBuildService],
})
export class BuildModule {}
