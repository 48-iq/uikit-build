import { Build } from 'src/postgres/entities/build.entity';
import { BuildEntityResultDto } from '../dto/build-entity-result.dto';
import { BuildEntityDto } from '../dto/build-entity.dto';
import { BuildCursorResultDto } from '../dto/build-cursor-result.dto';

export class BuildMapper {
  static toEntityResultDto(
    build: Build,
    sourceFileText?: string,
  ): BuildEntityResultDto {
    return {
      success: true,
      result: this.toEntityDto(build, sourceFileText),
    };
  }

  static toEntityDto(build: Build, sourceFileText?: string) {
    return {
      id: build.id,
      componentId: build.component.id,
      component: build.component,
      status: build.status,
      logs: build.logs ?? '',
      startedAt: build.startedAt?.toISOString() ?? 'none',
      finishedAt: build.finishedAt?.toISOString() ?? 'none',
      createdAt: build.startedAt?.toISOString() ?? 'none',
      updatedAt: build.updatedAt?.toISOString() ?? 'none',
      version: build.version,
      sourceFileText: sourceFileText ?? '',
    };
  }

  static toCursorResultDto(args: {
    builds: Build[];
    itemsLeft: number;
    startDate: Date;
    itemsSkipped: number;
  }): BuildCursorResultDto {
    const dto = new BuildCursorResultDto();
    dto.success = true;
    dto.result = {
      itemsLeft: args.itemsLeft,
      data: args.builds.map((b) => this.toEntityDto(b)),
      startDate: args.startDate.toISOString(),
      itemsSkipped: args.itemsSkipped,
    };
    return dto;
  }
}