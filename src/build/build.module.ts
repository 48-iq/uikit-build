import { Module } from '@nestjs/common';
import { ComponentController } from '../component/component.controller';
import { RollupBuildService } from './services/rollup-build.service';
import { BuildService } from './services/build-service.interface';

@Module({
  imports: [],
  providers: [{ provide: BuildService, useClass: RollupBuildService }],
  exports: [BuildService],
})
export class BuildModule {}
