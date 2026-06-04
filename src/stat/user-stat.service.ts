import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Build, BuildStatus } from 'src/postgres/entities/build.entity';
import { Load } from 'src/postgres/entities/load.entity';
import { Component } from 'src/postgres/entities/component.entity';
import { Repository } from 'typeorm';
import { DailyStatPointDto } from './dto/component-stat.dto';
import { UserStatDto } from './dto/user-stat.dto';
import { UserStatResultDto } from './dto/user-stat-result.dto';
import { AppError } from 'src/errors/app.error';
import { ERROR_CODE } from 'src/errors/error-code';

@Injectable()
export class UserStatService {
  constructor(
    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
  ) {}

  async getUserStat(username: string): Promise<UserStatResultDto> {
    const firstComponent = await this.componentRepository
      .createQueryBuilder('component')
      .where('component.username = :username', { username })
      .orderBy('component.createdAt', 'ASC')
      .limit(1)
      .getOne();

    if (!firstComponent) throw new AppError(ERROR_CODE.USER_NOT_FOUND);

    const createdAt = firstComponent.createdAt;

    const countBuilds = (status?: BuildStatus) => {
      const qb = this.buildRepository
        .createQueryBuilder('build')
        .innerJoin('build.component', 'component')
        .where('component.username = :username', { username });
      if (status) qb.andWhere('build.status = :status', { status });
      return qb.getCount();
    };

    const [
      totalComponents,
      totalBuilds,
      successBuilds,
      failedBuilds,
      pendingBuilds,
      runningBuilds,
    ] = await Promise.all([
      this.componentRepository
        .createQueryBuilder('component')
        .where('component.username = :username', { username })
        .getCount(),
      countBuilds(),
      countBuilds(BuildStatus.SUCCESS),
      countBuilds(BuildStatus.FAILED),
      countBuilds(BuildStatus.PENDING),
      countBuilds(BuildStatus.RUNNING),
    ]);

    const dailyLoadsChart = await this.getDailyLoadsChart(username, 30, createdAt);

    const result: UserStatDto = {
      username,
      totalComponents,
      totalBuilds,
      successBuilds,
      failedBuilds,
      pendingBuilds,
      runningBuilds,
      dailyLoadsChart,
    };

    return { success: true, result };
  }

  private async getDailyLoadsChart(
    username: string,
    days: number,
    createdAt: Date,
  ): Promise<DailyStatPointDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(createdAt);
    start.setHours(0, 0, 0, 0);

    const naturalEnd = new Date(start);
    naturalEnd.setDate(naturalEnd.getDate() + (days - 1));

    let windowStart: Date;
    let windowEnd: Date;

    if (naturalEnd <= today) {
      windowEnd = today;
      windowStart = new Date(today);
      windowStart.setDate(windowStart.getDate() - (days - 1));
    } else {
      windowStart = start;
      windowEnd = naturalEnd;
    }

    const raw: { date: string; count: string }[] = await this.loadRepository
      .createQueryBuilder('load')
      .innerJoin('load.build', 'build')
      .innerJoin('build.component', 'component')
      .select("TO_CHAR(load.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('component.username = :username', { username })
      .andWhere('load.createdAt >= :start', { start: windowStart })
      .andWhere('load.createdAt < :endExclusive', {
        endExclusive: new Date(windowEnd.getTime() + 1000 * 60 * 60 * 24),
      })
      .groupBy("TO_CHAR(load.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(load.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    return fillDailyRange(raw, windowStart, windowEnd);
  }
}

function fillDailyRange(
  raw: { date: string; count: string }[],
  start: Date,
  end: Date,
): DailyStatPointDto[] {
  const byDate = new Map(raw.map((r) => [r.date, Number(r.count)]));
  const result: DailyStatPointDto[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().split('T')[0];
    result.push({ date, count: byDate.get(date) ?? 0 });
  }

  return result;
}