import { Controller, Get, Param } from "@nestjs/common";
import { ComponentStatService } from "./component-stat.service";

@Controller('/api/components/stat/components')
export class ComponentStatController {

  constructor(
    private readonly componentStatService: ComponentStatService
  ) {}

  @Get('/:id')
  async getComponentStat(
    @Param('id') id: string
  ) {
    return await this.componentStatService.getComponentStat(id);
  }
}