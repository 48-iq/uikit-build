import { Injectable } from '@nestjs/common';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Client as MinioClient } from 'minio';
import { MINIO_PREVIEW_BUCKET } from 'src/minio/constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Build } from 'src/postgres/entities/build.entity';
import { AppError } from 'src/errors/app.error';
import { ERROR_CODE } from 'src/errors/error-code';

@Injectable()
export class PreviewService {
  constructor(
    @InjectRepository(Build) private readonly buildRepository: Repository<Build>,
    @InjectMinio() private readonly minio: MinioClient,
  ) {}

  async getPreview(buildId: string) {
    const build = await this.buildRepository.findOneBy({ id: buildId });
    if (!build) throw new AppError(ERROR_CODE.BUILD_NOT_FOUND);
    if (!build.previewFilename) throw new AppError(ERROR_CODE.PREVIEW_NOT_FOUND);
    return this.minio.getObject(MINIO_PREVIEW_BUCKET, build.previewFilename);
  }
}
