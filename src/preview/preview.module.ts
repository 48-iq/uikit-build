import { Module } from "@nestjs/common";
import { PreviewController } from "./preview.controller";
import { PreviewService } from "./preview.service";

@Module({
  imports: [],
  controllers: [PreviewController],
  providers: [PreviewService],
  exports: []
})
export class PreviewModule {}