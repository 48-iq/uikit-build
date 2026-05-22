import { Module } from '@nestjs/common';
import { RollupBuildService } from './rollup-build.service';
import { BuildService } from './build.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Build } from 'src/postgres/entities/build.entity';
import { BuildController } from './build.controller';
import { Component } from 'src/postgres/entities/component.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Build, Component])],
  providers: [RollupBuildService, BuildService],
  exports: [RollupBuildService, BuildService],
  controllers: [BuildController],
})
export class BuildModule {}
