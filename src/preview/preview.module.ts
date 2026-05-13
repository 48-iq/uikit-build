import { Module } from "@nestjs/common";
import { PreviewController } from "./preview.controller";
import { PreviewService } from "./preview.service";
import { ComponentModule } from "src/components/component.module";

@Module({
  imports: [ComponentModule],
  controllers: [PreviewController],
  providers: [PreviewService],
  exports: []
})
export class PreviewModule {}