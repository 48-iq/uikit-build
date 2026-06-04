import { Injectable } from '@nestjs/common';
import { ComponentEntityDto } from 'src/components/dto/component-entity.dto';
import { Component } from 'src/postgres/entities/component.entity';
import { ComponentCursorResultDto } from './dto/component-cursor-result.dto';
import { ComponentResultDto } from './dto/component-result.dto';
import { ComponentCreateResultDto } from './dto/component-create-result.dto';
import { Build } from 'src/postgres/entities/build.entity';
import { BuildMapper } from 'src/build/mappers/build.mapper';

@Injectable()
export class ComponentMapper {
  static toEntityDto(component: Component, build?: Build) {
    const entityDto = new ComponentEntityDto();

    entityDto.id = component.id;
    entityDto.name = component.name;
    entityDto.framework = component.framework;
    entityDto.description = component.description;
    entityDto.username = component.username;
    entityDto.createdAt = component.createdAt.toISOString();
    entityDto.updatedAt = component.updatedAt?.toISOString() ?? 'none';
    entityDto.tags = component.tags;
    entityDto.version = build?.version ?? null;
    entityDto.buildId = build?.id ?? null;

    return entityDto;
  }

  static toEntityCreateResultDto(component: Component, build: Build) {
    const componentResultDto = this.toEntityDto(component);

    const componentCreateResultDto = new ComponentCreateResultDto();

    componentCreateResultDto.result = {
      component: componentResultDto,
      build: BuildMapper.toEntityDto(build),
    }
    componentCreateResultDto.success = true;

    return componentCreateResultDto;
  }

  static toEntityResultDto(component: Component, build?: Build) {
    const entityDto = this.toEntityDto(component, build);

    const componentResultDto = new ComponentResultDto();

    componentResultDto.result = entityDto;
    componentResultDto.success = true;

    return componentResultDto;
  }

  static toEntityDtos(components: Component[]) {
    return components.map((component) => this.toEntityDto(component));
  }

  static toCursorResultDto(args: {
    components: Component[];
    itemsLeft: number;
    startDate: Date;
    itemsSkipped: number;
  }) {

    const cursorResultDto = new ComponentCursorResultDto();

    cursorResultDto.result = {
      itemsLeft: args.itemsLeft,
      data: args.components.map((component) => this.toEntityDto(component)),
      startDate: args.startDate.toISOString()||'none',
      itemsSkipped: args.itemsSkipped,
    };
    cursorResultDto.success = true;

    return cursorResultDto;
  }
}
