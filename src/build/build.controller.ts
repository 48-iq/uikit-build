import { Controller, Get, Logger, Param, Query, Req, StreamableFile } from '@nestjs/common';
import { BuildService } from 'src/build/services/build.service';
import { BuildFiltersDto } from './dto/build-filters.dto';
import { Public } from 'src/security/public.decorator';

@Controller('/api/components/builds')
export class BuildController {
  private readonly logger = new Logger(BuildController.name);

  constructor(private buildService: BuildService) {}

  @Public()
  @Get('/:buildId')
  async getById(@Param('buildId') buildId: string) {
    return this.buildService.getById(buildId);
  }

  @Public()
  @Get()
  async getByFilters(@Query() buildFiltersDto: BuildFiltersDto) {
    return this.buildService.getByFilters(buildFiltersDto);
  }

  @Public()
  @Get('/:id/preview')
  async getPreview(@Param('id') id: string) {
    const preview = await this.buildService.getPreview(id);
    return new StreamableFile(preview);
  }

  @Public()
  @Get('/:id/source')
  async getSource(@Param('id') id: string) {
    const source = await this.buildService.getSource(id);
    return new StreamableFile(source);
  }

  @Public()
  @Get('/:id/package')
  async getPackage(@Param('id') id: string) {
    const npmPackage = await this.buildService.getPackage(id);
    return new StreamableFile(npmPackage);
  }
}
