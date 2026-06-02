import { Controller, Get, Param } from '@nestjs/common';
import { ComponentStatService } from './component-stat.service';
import { Public } from 'src/security/public.decorator';
import { ComponentStatResultDto } from './dto/component-stat-result.dto';

@Controller('/api/components/stat/components')
export class ComponentStatController {
  constructor(private readonly componentStatService: ComponentStatService) {}

  @Public()
  @Get('/:id')
  async getComponentStat(@Param('id') id: string): Promise<ComponentStatResultDto> {
    return this.componentStatService.getComponentStat(id);
  }
}
