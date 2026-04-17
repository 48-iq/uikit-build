import { Module } from '@nestjs/common';
import { ComponentController } from '../component/component.controller';
import { BuildService } from './build.service';

@Module({
  imports: [],
  providers: [BuildService],
  exports: [BuildService],
})
export class BuildModule {}
