import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Build, BuildStatus } from 'src/postgres/entities/build.entity';
import { Component } from 'src/postgres/entities/component.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserStatService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,

    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>,
  ) {}

  async getUserStat(username: string) {
    const totalComponents = await this.componentRepository.countBy({
      username,
    });

    const totalBuilds = await this.buildRepository.countBy({
      component: { username },
    });

    const successBuilds = await this.buildRepository
      .createQueryBuilder('build')
      .where('build.username = :username', { username })
      .andWhere('build.status = :status', { status: BuildStatus.SUCCESS })
      .getCount();

    const failedBuilds = await this.buildRepository
      .createQueryBuilder('build')
      .where('build.username = :username', { username })
      .andWhere('build.status = :status', { status: BuildStatus.FAILED })
      .getCount();

    const pendingBuilds = await this.buildRepository
      .createQueryBuilder('build')
      .where('build.username = :username', { username })
      .andWhere('build.status = :status', { status: BuildStatus.PENDING })
      .getCount();

    const runningBuilds = await this.buildRepository
      .createQueryBuilder('build')
      .where('build.username = :username', { username })
      .andWhere('build.status = :status', { status: BuildStatus.RUNNING })
      .getCount();

    return {
      username,
      totalComponents,
      totalBuilds,
      successBuilds,
      failedBuilds,
      pendingBuilds,
      runningBuilds,
    };
  }
}
