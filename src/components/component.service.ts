import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client as MinioClient } from 'minio';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Component } from 'src/postgres/entities/component.entity';
import { Repository } from 'typeorm';
import { ComponentCreateDto } from './dto/component-create.dto';
import { AppError } from 'src/errors/app.error';
import { ERROR_CODE } from 'src/errors/error-code';
import { ComponentFiltersDto } from './dto/component-filters.dto';
import { ComponentMapper } from './component.mapper';
import { BuildService } from 'src/build/services/build.service';
import { Build } from 'src/postgres/entities/build.entity';

@Injectable()
export class ComponentService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectMinio()
    private readonly minio: MinioClient,

    private readonly buildService: BuildService,
  ) {}

  async getById(id: string) {
    const component = await this.componentRepository.findOneBy({ id });
    if (!component) throw new AppError(ERROR_CODE.COMPONENT_NOT_FOUND);
    return ComponentMapper.toEntityDto(component);
  }

  async getByNameAndUsername(args: {
    name: string;
    username: string;
    version?: number;
  }) {
    let buildSubquery: string;
    const subqueryParams: Record<string, any> = {};

    if (args.version != null) {
      buildSubquery = `
        latestBuild.id = (
          SELECT b.id FROM builds b
          WHERE b."componentId" = component.id
            AND b.version = :version
            AND b.status = 'success'
          LIMIT 1
        )
      `;
      subqueryParams.version = args.version;
    } else {
      buildSubquery = `
        latestBuild.id = (
          SELECT b.id FROM builds b
          WHERE b."componentId" = component.id
            AND b.status = 'success'
          ORDER BY b.version DESC
          LIMIT 1
        )
      `;
    }

    const component = (await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndMapOne('component.latestBuild', 'builds', 'latestBuild', buildSubquery, subqueryParams)
      .where('component.name = :name AND component.username = :username', args)
      .getOne()) as (Component & { latestBuild?: Build }) | null;

    if (!component) throw new AppError(ERROR_CODE.COMPONENT_NOT_FOUND);

    return ComponentMapper.toEntityResultDto(component, component.latestBuild);
  }

  async create(args: {
    username: string;
    dto: ComponentCreateDto;
    file: Express.Multer.File;
  }) {
    if (await this.componentRepository.existsBy({ name: args.dto.name, username: args.username })) {
      throw new AppError(ERROR_CODE.COMPONENT_ALREADY_EXISTS);
    }
    const component = await this.componentRepository.save({
      name: args.dto.name,
      username: args.username,
      framework: args.dto.framework,
      description: args.dto.description,
      tags: args.dto.tags,
    });

    const build = await this.buildService.create({
      component,
      file: args.file,
      dependencies: args.dto.dependencies,
    });

    return ComponentMapper.toEntityCreateResultDto(component, build);
  }

  async postNewVersion(args: {
    username: string;
    name: string;
    file: Express.Multer.File;
    dependencies: Record<string, string>;
  }) {
    const { username, name, file, dependencies } = args;
    const component = await this.componentRepository.findOneBy({
      name,
      username,
    });
    if (!component) throw new AppError(ERROR_CODE.COMPONENT_NOT_FOUND);
    const build = await this.buildService.create({
      component,
      file,
      dependencies,
    });
    return ComponentMapper.toEntityCreateResultDto(component, build);
  }

  async getManyByFilters(filters: ComponentFiltersDto) {
    const { username, skip, limit, query, framework } = filters;
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date();

    let qb = this.componentRepository
      .createQueryBuilder('component')
      .where('1 = 1');

    if (username)
      qb = qb.andWhere('component.username = :username', { username });

    qb = qb.andWhere('component.createdAt < :startDate', { startDate });

    qb = qb.orderBy('component.createdAt', filters.sort === 'asc' ? 'ASC' : 'DESC');

    if (query)
      qb = qb.andWhere(
        `component.username || '/' || component.name LIKE :query`,
        { query: `%${query}%` },
      );

    if (framework)
      qb = qb.andWhere('component.framework = :framework', { framework });

    if (filters.tags) {
      qb = qb.andWhere('component.tags @> :tags', { tags: filters.tags });
    }

    const filteredTotal = await qb.getCount();

    if (skip) qb = qb.offset(skip);
    if (limit) qb = qb.limit(limit);

    const components = await qb.getMany();

    const itemsLeft = filteredTotal - (skip ?? 0) - components.length;

    return ComponentMapper.toCursorResultDto({
      components,
      itemsLeft,
      startDate,
      itemsSkipped: skip ?? 0,
    });
  }
}
