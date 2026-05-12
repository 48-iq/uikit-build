import { Module } from "@nestjs/common";
import { SourceService } from "./source.service";
import { SourceController } from "./source.controller";

@Module({
  providers: [SourceService],
  exports: [SourceService],
  controllers: [SourceController],
})
export class SourceModule {}