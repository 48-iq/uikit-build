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
