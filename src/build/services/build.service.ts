import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Build, BuildStatus } from 'src/postgres/entities/build.entity';
import { Component } from 'src/postgres/entities/component.entity';
import { Repository } from 'typeorm';
import { RollupBuildService } from './rollup-build.service';
import { PreviewBuildService } from './preview-build.service';
import { BuildLogService } from './build-log.service';
import { BuildFiltersDto } from '../dto/build-filters.dto';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Client } from 'minio';
import {
  MINIO_COMPONENTS_BUCKET as MINIO_PACKAGE_BUCKET,
  MINIO_PREVIEW_BUCKET,
  MINIO_SOURCE_BUCKET,
} from 'src/minio/constants';
import { BuildMapper } from '../mappers/build.mapper';
import { AppError } from 'src/errors/app.error';
import { ERROR_CODE } from 'src/errors/error-code';
import { Load } from 'src/postgres/entities/load.entity';

@Injectable()
export class BuildService {
  private readonly logger = new Logger(BuildService.name);

  constructor(
    @InjectRepository(Build)
    private readonly buildRepository: Repository<Build>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    private readonly rollupBuildService: RollupBuildService,
    private readonly previewBuildService: PreviewBuildService,
    private readonly buildLog: BuildLogService,
    @InjectMinio() private readonly minio: Client,
  ) {}

  async create(args: {
    component: Component;
    file: Express.Multer.File;
    dependencies: Record<string, string>;
  }) {
    const lastBuild = await this.buildRepository
      .createQueryBuilder('build')
      .where('build.componentId = :componentId', { componentId: args.component.id })
      .orderBy('build.version', 'DESC')
      .getOne();

    let build = await this.buildRepository.save({
      component: args.component,
      status: BuildStatus.PENDING,
      logs: '',
      version: lastBuild ? lastBuild.version + 1 : 1,
    });

    await this.minio.putObject(MINIO_SOURCE_BUCKET, build.id, args.file.buffer);

    build.sourceFilename = build.id;

    build = await this.buildRepository.save(build);

    this.runBuild(build, args.component, args.file, args.dependencies).catch(
      (err) =>
        this.logger.error(`Build runner ${build.id} crashed unexpectedly`, err),
    );

    return build;
  }

  private async runBuild(
    build: Build,
    component: Component,
    file: Express.Multer.File,
    dependencies: Record<string, string>,
  ) {
    try {
      await this.buildRepository.update(
        { id: build.id },
        { status: BuildStatus.RUNNING },
      );

      const packageFilename = await this.rollupBuildService.buildAndSave({
        build,
        component,
        file,
        dependencies,
      });
      const previewFilename = await this.previewBuildService.buildAndSave({
        build,
        component,
        file,
        dependencies,
      });

      const status =
        packageFilename && previewFilename
          ? BuildStatus.SUCCESS
          : BuildStatus.FAILED;

      await this.buildRepository.update(
        { id: build.id },
        {
          status,
          packageFilename,
          previewFilename,
          finishedAt: new Date(),
        },
      );
    } catch (error: unknown) {
      this.logger.error(`Build ${build.id} runner failed`, error);
      await this.buildRepository.update(
        { id: build.id },
        {
          status: BuildStatus.FAILED,
          finishedAt: new Date(),
        },
      );
    } finally {
      await this.buildLog.flush(build.id);
    }
  }

  async getById(buildId: string) {
    const build = await this.buildRepository.findOne({
      where: { id: buildId },
      relations: ['component'],
    });

    if (!build) throw new Error(`Build with id ${buildId} not found`);

    return BuildMapper.toEntityResultDto(build);
  }

  async getByFilters(buildFiltersDto: BuildFiltersDto) {
    const { username, componentId, status, query, skip = 0, limit = 10 } = buildFiltersDto;

    const startDate = buildFiltersDto.startDate
      ? new Date(buildFiltersDto.startDate)
      : new Date();

    let qb = this.buildRepository
      .createQueryBuilder('build')
      .leftJoinAndSelect('build.component', 'component')
      .where('build.startedAt < :startDate', { startDate })
      .andWhere('build.status = :status', { status: status ?? BuildStatus.SUCCESS });

    if (username) {
      qb = qb.andWhere('component.username = :username', { username });
    }

    if (componentId) {
      qb = qb.andWhere('component.id = :componentId', { componentId });
    }

    if (query) {
      qb = qb.andWhere('LOWER(component.name) LIKE :query', {
        query: `%${query.toLowerCase()}%`,
      });
    }

    qb = qb.orderBy('build.version', 'DESC');

    const filteredTotal = await qb.getCount();

    if (skip) qb = qb.skip(skip);
    if (limit) qb = qb.take(limit);

    const builds = await qb.getMany();

    const itemsLeft = filteredTotal - skip - builds.length;

    return BuildMapper.toCursorResultDto({
      builds,
      itemsLeft,
      startDate,
      itemsSkipped: skip,
    });
  }

  async getPackage(buildId: string) {
    const build = await this.buildRepository.findOneBy({
      id: buildId,
    });
    if (!build) throw new AppError(ERROR_CODE.BUILD_NOT_FOUND);
    await this.loadRepository.save({
      build: build,
    });
    return this.minio.getObject(MINIO_PACKAGE_BUCKET, build.packageFilename);
  }

  async getSource(buildId: string) {
    const build = await this.buildRepository.findOneBy({
      id: buildId,
    });
    if (!build) throw new AppError(ERROR_CODE.BUILD_NOT_FOUND);
    return this.minio.getObject(MINIO_SOURCE_BUCKET, build.sourceFilename);
  }

  async getManyByIds(ids: string[]) {
    const builds = await this.buildRepository.find({
      where: ids.map((id) => ({ id })),
      relations: ['component'],
    });
    return BuildMapper.toListResultDto(builds);
  }

  async getPreview(buildId: string) {
    const build = await this.buildRepository.findOneBy({
      id: buildId,
    });
    if (!build) throw new AppError(ERROR_CODE.BUILD_NOT_FOUND);
    return this.minio.getObject(MINIO_PREVIEW_BUCKET, build.previewFilename);
  }
}
