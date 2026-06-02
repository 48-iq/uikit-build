import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Build, BuildStatus } from 'src/postgres/entities/build.entity';
import { Load } from 'src/postgres/entities/load.entity';
import { Repository } from 'typeorm';
import { DailyStatPointDto } from './dto/component-stat.dto';
import { UserStatDto } from './dto/user-stat.dto';
import { UserStatResultDto } from './dto/user-stat-result.dto';

@Injectable()
export class UserStatService {
  constructor(
    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>,

    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async getUserStat(username: string): Promise<UserStatResultDto> {
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
      this.buildRepository
        .createQueryBuilder('build')
        .innerJoin('build.component', 'component')
        .where('component.username = :username', { username })
        .select('COUNT(DISTINCT component.id)', 'count')
        .getRawOne()
        .then((r) => Number(r?.count ?? 0)),
      countBuilds(),
      countBuilds(BuildStatus.SUCCESS),
      countBuilds(BuildStatus.FAILED),
      countBuilds(BuildStatus.PENDING),
      countBuilds(BuildStatus.RUNNING),
    ]);

    const dailyLoadsChart = await this.getDailyLoadsChart(username, 30);

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

  private async getDailyLoadsChart(username: string, days: number): Promise<DailyStatPointDto[]> {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);

    const raw: { date: string; count: string }[] = await this.loadRepository
      .createQueryBuilder('load')
      .innerJoin('load.build', 'build')
      .innerJoin('build.component', 'component')
      .select("DATE(load.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('component.username = :username', { username })
      .andWhere('load.createdAt >= :since', { since })
      .groupBy('DATE(load.createdAt)')
      .orderBy('DATE(load.createdAt)', 'ASC')
      .getRawMany();

    return fillDailyGaps(raw, days);
  }
}

function fillDailyGaps(raw: { date: string; count: string }[], days: number): DailyStatPointDto[] {
  const byDate = new Map(raw.map((r) => [r.date, Number(r.count)]));
  const result: DailyStatPointDto[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    result.push({ date, count: byDate.get(date) ?? 0 });
  }

  return result;
}
