import { Module } from '@nestjs/common';
import { UserStatService } from './user-stat.service';
import { ComponentStatService } from './component-stat.service';
import { UserStatController } from './user-stat.controller';
import { ComponentStatController } from './component-stat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Load } from 'src/postgres/entities/load.entity';
import { Build } from 'src/postgres/entities/build.entity';
import { Component } from 'src/postgres/entities/component.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Load, Build, Component])],
  controllers: [UserStatController, ComponentStatController],
  providers: [UserStatService, ComponentStatService],
})
export class StatModule {}
