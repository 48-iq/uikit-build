import { Controller, Get, Logger, Param } from '@nestjs/common';
import { BuildService } from 'src/build/build.service';

@Controller('/api/components/builds') // TODO нормально сделать роутинг, сейчас костыль для тестов
export class BuildController {
  private readonly logger = new Logger(BuildController.name);

  constructor(private buildService: BuildService) {}

  @Get('/:buildId/logs')
  async getBuildLogs(@Param('buildId') buildId: string) {
    const build = await this.buildService.getBuild(buildId);
    return {
      buildId: build.id,
      status: build.status,
      logs: build.logs || '',
      startedAt: build.startedAt,
      finishedAt: build.finishedAt,
      errorMessage: build.errorMessage,
      
    };
  }

  @Get('/:buildId')
  async getBuild(@Param('buildId') buildId: string) {
    return this.buildService.getBuild(buildId);
  }
}
