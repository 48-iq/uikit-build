import { Injectable } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { MINIO_SOURCE_BUCKET } from 'src/minio/constants';
import { InjectMinio } from 'src/minio/minio.decorator';

@Injectable()
export class SourceService {
  constructor(@InjectMinio() private readonly minio: MinioClient) {}

  async save(buffer: Buffer, id: string) {
    await this.minio.putObject(MINIO_SOURCE_BUCKET, id, buffer);
  }

  async getText(id: string): Promise<string> {
    const file = await this.minio.getObject(MINIO_SOURCE_BUCKET, id);
    let result = '';
    for await (const chunk of file) {
      result += chunk
    }
    return result;
  }
}
