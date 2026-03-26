import { Module } from "@nestjs/common";
import { BuildController } from "./build.controller";
import { BuildService } from "./build.service";


@Module({
  imports: [],
  controllers: [BuildController],
  providers: [BuildService],
})
export class BuildModule {}