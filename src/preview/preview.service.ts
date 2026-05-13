import { Injectable } from '@nestjs/common';
import { InjectMinio } from 'src/minio/minio.decorator';
import { Client as MinioClient } from 'minio';

@Injectable()
export class PreviewService {
  constructor(
    @InjectMinio() private readonly minio: MinioClient,
  ) {}

  async getPreview(id: string) {
    try {
      const stat = await this.minio.statObject('preview', id);

      console.log(stat);

      return await this.minio.getObject('preview', id);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
