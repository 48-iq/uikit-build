import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Component } from 'src/postgres/entities/component.entity';
import { ComponentService } from './component.service';
import { ComponentController } from './component.controller';
import { BuildModule } from 'src/build/build.module';
import { ComponentMapper } from './component.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([Component]), BuildModule],
  providers: [ComponentService],
  exports: [ComponentService],
  controllers: [ComponentController],
})
export class ComponentModule {}
