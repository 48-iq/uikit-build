import { EntityDto } from 'src/common/dto/entity.dto';
import { BuildStatus } from 'src/postgres/entities/build.entity';
export class BuildEntityDto extends EntityDto {
  
  version: number;

  componentId: string;

  status: BuildStatus;

  logs: string;

  sourceFileText?: string;

  startedAt: string;

  finishedAt: string;

  packageFilename?: string;
}
