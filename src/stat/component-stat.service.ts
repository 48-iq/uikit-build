import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Load } from 'src/postgres/entities/load.entity';
import { Repository } from 'typeorm';
import { ComponentStatDto, DailyStatPointDto } from './dto/component-stat.dto';
import { ComponentStatResultDto } from './dto/component-stat-result.dto';

@Injectable()
export class ComponentStatService {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async getComponentStat(componentId: string): Promise<ComponentStatResultDto> {
    const now = Date.now();
    const msDay = 1000 * 60 * 60 * 24;

    const countSince = (since: Date) =>
      this.loadRepository
        .createQueryBuilder('load')
        .innerJoin('load.build', 'build')
        .innerJoin('build.component', 'component')
        .where('component.id = :componentId', { componentId })
        .andWhere('load.createdAt >= :since', { since })
        .getCount();

    const [loadsTotal, loadsForYear, loadsForMonth, loadsForWeek, loadsForDay] = await Promise.all([
      countSince(new Date(0)),
      countSince(new Date(now - msDay * 365)),
      countSince(new Date(now - msDay * 30)),
      countSince(new Date(now - msDay * 7)),
      countSince(new Date(now - msDay)),
    ]);

    const dailyChart = await this.getDailyChart(componentId, 30);

    const result: ComponentStatDto = {
      componentId,
      loadsTotal,
      loadsForYear,
      loadsForMonth,
      loadsForWeek,
      loadsForDay,
      dailyChart,
    };

    return { success: true, result };
  }

  private async getDailyChart(componentId: string, days: number): Promise<DailyStatPointDto[]> {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * days);

    const raw: { date: string; count: string }[] = await this.loadRepository
      .createQueryBuilder('load')
      .innerJoin('load.build', 'build')
      .innerJoin('build.component', 'component')
      .select("DATE(load.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('component.id = :componentId', { componentId })
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
