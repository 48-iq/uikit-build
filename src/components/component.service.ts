import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client as MinioClient } from 'minio';
import { MINIO_COMPONENTS_BUCKET } from 'src/minio/constants';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Component } from 'src/postgres/entities/component.entity';
import { Repository } from 'typeorm';
import { ComponentCreateDto } from './dto/component-create.dto';
import { Source } from 'src/postgres/entities/source.entity';
import { AppError } from 'src/errors/app-error';
import { ERROR_CODES } from 'src/errors/error-codes';

@Injectable()
export class ComponentService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectMinio()
    private readonly minio: MinioClient,
    
  ) {}

  async getById(id: string) {
    const component = await this.componentRepository.findOneBy({ id });
    if (!component) throw new AppError(ERROR_CODES.COMPONENT_NOT_FOUND);
    return component;
  }

  async create(args: {
    username: string;
    dto: ComponentCreateDto;
  }) {
    const lastVersionComponent = await this.componentRepository
      .createQueryBuilder('component')
      .where('component.username = :username', { username: args.username })
      .andWhere('component.name = :name', { username: args.dto.name })
      .orderBy('component.version', 'DESC')
      .limit(1)
      .getOne();

    let component = new Component();
    component.framework = args.dto.framework;
    component.description = args.dto.description;
    component.name = args.dto.name;
    component.username = args.username;
    component.source = args.source;
    component.version = version;

    await this.componentRepository.save(component);

    return component;
  }

  async updateComponent(args: {
    username: string;
    name: string;
    file: Express.Multer.File;
    dependencies: Record<string, string>;
  }) {
    const { username, name, file, dependencies } = args;
  }

  async getManyByFilters(args: {
    username?: string;
    startDate: Date;
    skip?: number;
    limit?: number;
    query?: string;
    framework?: string;
    sort?: string;
    name?: string;
  }) {
    const { username, startDate, skip, limit, query, framework, name } = args;

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

    if (name) qb = qb.andWhere('component.name = :name', { name });

    if (!args.sort || args.sort === 'desk') {
      qb = qb.orderBy('component.createdAt', 'DESC');
    } else if (args.sort === 'asc') {
      qb = qb.orderBy('component.createdAt', 'ASC');
    }
  
    const total = await qb.getCount(); 

    if (skip) qb = qb.offset(skip);

    if (limit) qb = qb.limit(limit);

    const total = await this.componentRepository.count();
    const count = await qb.getCount();
    const itemsLeft = total - (skip ?? 0) - count;

    const components = await qb.getMany();
    const itemsLeft = Math.max(0, total - (skip ?? 0) - components.length);
    return {
      components,
      itemsLeft,
      startDate,
      itemsSkipped: skip ?? 0,
    };
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
