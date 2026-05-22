import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Component } from 'src/postgres/entities/component.entity';
import { Load } from 'src/postgres/entities/load.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ComponentStatService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,

    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async getComponentStat(id: string) {
    const loadsForYear = await this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.component', 'component')
      .where('component.id = :id', { id: id })
      .andWhere('load.createdAt >= :startDate', {
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
      })
      .getCount();
    
    const loadsByMonth = await this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.component', 'component')
      .where('component.id = :id', { id: id })
      .andWhere('load.createdAt >= :startDate', {
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      })
      .getCount();

    const loadsByWeek = await this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.component', 'component')
      .where('component.id = :id', { id: id })
      .andWhere('load.createdAt >= :startDate', {
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      })
      .getCount();
    
    const loadsByDay = await this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.component', 'component')
      .where('component.id = :id', { id: id })
      .andWhere('load.createdAt >= :startDate', {
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      })
      .getCount();

    return {
      id,
      loadsForYear,
      loadsByMonth,
      loadsByWeek,
      loadsByDay,
    };
  }
}
