import { Build } from 'src/postgres/entities/build.entity';
import { BuildEntityResultDto } from './dto/build-entity-result.dto';
import { BuildEntityDto } from './dto/build-entity.dto';
import { BuildCursorResultDto } from './dto/build-cursor-result.dto';

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

  static toEntityDto(build: Build, sourceFileText?: string): BuildEntityDto {
    return {
      id: build.id,
      componentId: build.component.id,
      status: build.status,
      logs: build.logs ?? '',
      startedAt: build.startedAt?.toISOString() ?? 'none',
      finishedAt: build.finishedAt?.toISOString() ?? 'none',
      createdAt: build.startedAt?.toISOString() ?? 'none',
      updatedAt: build.updatedAt.toISOString() ?? 'none',
      version: build.version,
      sourceFileText: sourceFileText ?? '',
    };
  }

  static toCursorResultDto(args: {
    builds: Build[];
    itemsLeft: number;
    startDate: Date;
    itemsSkipped: number;
  }) {
    const { builds, itemsLeft, startDate, itemsSkipped } = args;

    const cursorResultDto = new BuildCursorResultDto();
    
    cursorResultDto.success = true;
    cursorResultDto.result = {
      itemsLeft,
      data: builds.map((build) => this.toEntityDto(build)),
      startDate: startDate.toISOString(),
      itemsSkipped,
    };

    return cursorResultDto;
  }
}
