import {
  Controller,
  Get,
  Logger,
  Param,
} from '@nestjs/common';
import { BuildTrackerService } from 'src/build/build-tracker.service';

@Controller('/api/components/') // TODO нормально сделать роутинг, сейчас костыль для тестов
export class BuildController {
  private readonly logger = new Logger(BuildController.name);

  constructor(
    private buildTracker: BuildTrackerService,
  ) {}

  @Get('/builds/:buildId/logs')
  async getBuildLogs(@Param('buildId') buildId: string) {
    const build = await this.buildTracker.getBuild(buildId);
    return { 
      buildId: build.id,
      status: build.status,
      logs: build.logs || '',
      startedAt: build.startedAt,
      finishedAt: build.finishedAt,
      errorMessage: build.errorMessage,
      type: build.type,
    };
  }

  @Get('/builds/:buildId')
  async getBuild(@Param('buildId') buildId: string) {
    return this.buildTracker.getBuild(buildId);
  }

  @Get('/:username/builds')
  async getUserBuilds(@Param('username') username: string) {
    return this.buildTracker.getBuildsByUsername(username);
  }

  @Get('/:username/:name/builds')
  async getRepoBuilds(
    @Param('username') username: string,
    @Param('name') name: string,
  ) {
    const componentId = `${username}/${name}`;
    return this.buildTracker.getBuildsByComponent(componentId);
  }
}
