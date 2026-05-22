import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Component } from 'src/postgres/entities/component.entity';
import { Load } from 'src/postgres/entities/load.entity';
import { Repository } from 'typeorm';
import { Client as MinioClient } from 'minio';
import { MINIO_COMPONENTS_BUCKET } from 'src/minio/constants';

@Injectable()
export class LoadService {
  constructor(
    @InjectRepository(Load)
    private readonly LoadRepository: Repository<Load>,
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectMinio() private readonly minio: MinioClient,
  ) {}

  async loadPackage(args: { username: string; name: string; version: string }) {
    const component = await this.componentRepository.findOneBy({
      username: args.username,
      name: args.name,
      version: args.version,
    });

    if (!component) {
      throw new Error('Component not found');
    }

    const load = new Load();
    load.component = component;
    await this.LoadRepository.save(load);

    return await this.minio.getObject(MINIO_COMPONENTS_BUCKET, component.id);
  }
}
