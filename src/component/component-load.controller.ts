import { Controller, Get, Query } from '@nestjs/common';
import { ComponentService } from './component.service';
import { ComponentMapper } from './component.mapper';

@Controller('/api/component-load')
export class ComponentLoadController {
  constructor(private readonly componentService: ComponentService,
    private readonly componentMapper: ComponentMapper
  ) {}

  @Get()
  async load(
    @Query('components') ids: string[],
  ) {
    const components = await this.componentService.load(ids);
    const response = this.componentMapper.toEntityDtos(components);
    return response;
  }
}
