import { Module } from "@nestjs/common";
import { PreviewController } from "./preview.controller";
import { PreviewService } from "./preview.service";
import { ComponentModule } from "src/components/component.module";
import { Build } from "src/postgres/entities/build.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [ComponentModule, TypeOrmModule.forFeature([Build])],
  controllers: [PreviewController],
  providers: [PreviewService],
  exports: []
})
export class PreviewModule {}