import { Module } from "@nestjs/common";
import { LoadController } from "./load.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Load } from "src/postgres/entities/load.entity";
import { Component } from "src/postgres/entities/component.entity";
import { LoadService } from "./load.service";

@Module({
  imports: [TypeOrmModule.forFeature([Load, Component])],
  controllers: [LoadController],
  providers: [LoadService],
})
export class LoadModule {}