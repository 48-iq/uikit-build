import { Controller, Get, Param } from "@nestjs/common";
import { SourceService } from "./source.service";
@Controller('/api/component/source')
export class SourceController {

  constructor(  
    private readonly sourceService: SourceService
  ) {}

  @Get('/text/:id')
  async getText(@Param('id') id: string) {
    return await this.sourceService.getText(id);
  }



}