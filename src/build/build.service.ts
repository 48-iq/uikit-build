import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Build, BuildStatus } from 'src/postgres/entities/build.entity';
import { Component } from 'src/postgres/entities/component.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BuildService {
  constructor(
    @InjectRepository(Build)
    private buildRepo: Repository<Build>,

    @InjectRepository(Component)
    private componentRepo: Repository<Component>,
  ) {}

  async createBuild(data: {
    componentId: string;
  }) {
    const component = await this.componentRepo.findOneByOrFail({ id: data.componentId });

    let build = new Build();
    build.component = component;
    build.logs = '';
    build.status = BuildStatus.RUNNING;
    
    build = await this.buildRepo.save(build);

    return build;
  }

  async appendLog(
    buildId: string,
    message: string,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info',
  ) {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] `;
    const logLine = `${prefix}${message}\n`;

    await this.buildRepo
      .createQueryBuilder()
      .update(Build)
      .set({
        logs: () => `COALESCE(logs, '') || '${logLine.replace(/'/g, "''")}'`,
      })
      .where('id = :id', { id: buildId })
      .execute();
  }

  async finishBuild(buildId: string, status: BuildStatus, error?: string) {
    await this.buildRepo.update(buildId, {
      status,
      finishedAt: new Date(),
      errorMessage: error,
    });
  }

  async getBuildsByComponent(componentId: string) {
    return this.buildRepo.find({
      where: { component: { id: componentId } },
      order: { startedAt: 'DESC' },
    });
  }

  async getBuildsByUsername(username: string) {
    return this.buildRepo.find({
      where: {
        component: { username },
      },
      order: { startedAt: 'DESC' },
      take: 50,
      relations: ['component'],
    });
  }

  async getBuild(buildId: string) {
    const build = await this.buildRepo.findOne({
      where: { id: buildId },
      relations: ['component'],
    });

    if (!build) {
      throw new Error(`Build with id ${buildId} not found`);
    }
    return build;
  }
}
