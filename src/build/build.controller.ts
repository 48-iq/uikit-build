import { Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { BuildService } from 'src/build/build.service';
import { BuildFiltersDto } from './dto/build-filters.dto';

@Controller('/api/components/builds') 
export class BuildController {
  private readonly logger = new Logger(BuildController.name);

  constructor(private buildService: BuildService) {}

  @Get('/:buildId')
  async getBuild(@Param('buildId') buildId: string) {
    return this.buildService.getBuild(buildId);
  }

  @Get()
  async getBuildsByFilter(
    @Query() buildFiltersDto: BuildFiltersDto
  ) {
    return this.buildService.getBuildsByFilters(buildFiltersDto);
  }
}
