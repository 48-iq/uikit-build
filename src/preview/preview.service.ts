import { Injectable } from '@nestjs/common';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Client as MinioClient } from 'minio';
import { MINIO_PREVIEW_BUCKET } from 'src/minio/constants';

@Injectable()
export class PreviewService {
  constructor(
    @InjectMinio() private readonly minio: MinioClient,
  ) {}

  async getPreview(id: string) {
    try {
      const stat = await this.minio.statObject(MINIO_PREVIEW_BUCKET, id);

      console.log(stat);

      return await this.minio.getObject(MINIO_PREVIEW_BUCKET, id);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
