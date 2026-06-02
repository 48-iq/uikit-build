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

  async getByNameAndUsername(args: { name: string; username: string }) {
    const component = await this.componentRepository.findOneBy({
      name: args.name,
      username: args.username,
    });

    if (!component) throw new AppError(ERROR_CODE.COMPONENT_NOT_FOUND);

    return ComponentMapper.toEntityDto(component);
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

    if (query)
      qb = qb.andWhere(
        `component.username || '/' || component.name || '/' || component.version LIKE :query`,
        { query: `%${query}%` },
      );

    if (framework)
      qb = qb.andWhere('component.framework = :framework', { framework });

    if (filters.tags) {
      qb = qb.andWhere('component.tags @> :tags', { tags: filters.tags });
    }

    if (skip) qb = qb.offset(skip);

    if (limit) qb = qb.limit(limit);

    const total = await this.componentRepository.count();
    const count = await qb.getCount();
    const itemsLeft = total - (skip ?? 0) - count;

    const components = await qb.getMany();
    return ComponentMapper.toCursorResultDto({
      components,
      itemsLeft,
      startDate,
      itemsSkipped: skip ?? 0,
    });
  }
}
