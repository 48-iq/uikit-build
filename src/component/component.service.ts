import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client as MinioClient } from 'minio';
import { BuildResult } from 'src/build/models/build-result.interface';
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

  async save(args: { build: BuildResult; description: string }) {
    let component = new Component();
    component.id = args.build.id;
    component.framework = args.build.framework;
    component.description = args.description;
    component.name = args.build.name;
    component.username = args.build.username;
    component.createdAt = new Date();
    component.version = args.build.version;
    component = await this.componentRepository.save(component);

    return component;
  }

  async getMany(args: {
    username?: string;
    startDate: Date;
    skip?: number;
    limit?: number;
  }) {
    const { username, startDate, skip, limit } = args;
    let qb = this.componentRepository.createQueryBuilder('component');
    if (username)
      qb = qb
        .where('component.username = :username', { username })
        .andWhere('component.createdAt < :startDate', { startDate });
    else qb = qb.where('component.createdAt < :startDate', { startDate });

    qb = qb.orderBy('component.createdAt', 'DESC');

    if (skip) qb = qb.offset(skip);

    if (limit) qb = qb.limit(limit);

    const total = await this.componentRepository.count();
    const count = await qb.getCount();
    const itemsLeft = total - (skip ?? 0) - count;

    const components = await qb.getMany();
    return {
      components,
      itemsLeft,
      startDate,
      itemsSkipped: skip ?? 0,
    };
  }

  async getOne(id: string) {
    return await this.componentRepository.findOneByOrFail({ id });
  }

  async getPackage(objectName: string) {
    return await this.minio.getObject(MINIO_COMPONENTS_BUCKET, objectName);
  }

  async load(components: string[]) {
    const result = await this.componentRepository
      .createQueryBuilder('component')
      .where('component.id IN (:ids)', { ids: components })
      .getMany();

    return result;
  }
}
