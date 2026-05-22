import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client as MinioClient } from 'minio';
import { MINIO_COMPONENTS_BUCKET } from 'src/minio/constants';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Component } from 'src/postgres/entities/component.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ComponentService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectMinio() private readonly minio: MinioClient,
  ) {}

  async save(args: {
    username: string;
    name: string;
    version: string;
    description: string;
    framework: string;
  }) {
    const { username, name, version, description, framework } = args;

    let component = new Component();

    component.framework = framework;

    component.description = description;

    component.name = name;

    component.username = username;

    component.createdAt = new Date();

    component.version = version;

    component = await this.componentRepository.save(component);

    return component;
  }

  async getManyByFilters(args: {
    username?: string;
    startDate: Date;
    skip?: number;
    limit?: number;
    query?: string;
    framework?: string;
    sort?: string;
  }) {
    const { username, startDate, skip, limit, query, framework } = args;

    let qb = this.componentRepository
      .createQueryBuilder('component')
      .where('1 = 1');

    if (username)
      qb = qb.andWhere('component.username = :username', { username });

    if (startDate)
      qb = qb.andWhere('component.createdAt < :startDate', { startDate });

    if (query)
      qb = qb.andWhere(
        `component.username || '/' || component.name || '/' || component.version LIKE :query`,
        { query: `%${query}%` },
      );
 
    if (framework)
      qb = qb.andWhere('component.framework = :framework', { framework });

    if (!args.sort || args.sort === 'desk') {
      qb = qb.orderBy('component.createdAt', 'DESC');
    } else if (args.sort === 'asc'){
      qb = qb.orderBy('component.createdAt', 'ASC');
    }
  
    const total = await qb.getCount(); 

    if (skip) qb = qb.offset(skip);

    if (limit) qb = qb.limit(limit);

    const components = await qb.getMany();
    const itemsLeft = Math.max(0, total - (skip ?? 0) - components.length);
    return {
      components,
      itemsLeft,
      startDate,
      itemsSkipped: skip ?? 0,
    }  
  }

  async getByUsernameAndName(args: { name: string; username: string }) {
    const { name, username } = args;
    return await this.componentRepository.findOneByOrFail({ name, username });
  }

  async getPackage(username: string, name: string) {
    const component = await this.componentRepository.findOneByOrFail({
      username,
      name,
    });

    if (!component) {
      throw new Error('Component not found');
    }
    return await this.minio.getObject(MINIO_COMPONENTS_BUCKET, component.id);
  }

  async load(components: string[]) {
    const result = await this.componentRepository
      .createQueryBuilder('component')
      .where('component.id IN (:ids)', { ids: components })
      .getMany();

    return result;
  }
}
