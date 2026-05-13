import { Injectable } from '@nestjs/common';
import { ComponentEntityDto } from 'src/components/dto/component-entity.dto';
import { Component } from 'src/postgres/entities/component.entity';
import { ComponentCursorDto } from './dto/component-cursor.dto';
import { ComponentCursorResultDto } from './dto/component-cursor-result.dto';
import { ComponentResultDto } from './dto/component-result.dto';

@Injectable()
export class ComponentMapper {
  toEntityDto(component: Component) {
    const entityDto = new ComponentEntityDto();

    entityDto.id = component.id;
    entityDto.name = component.name;
    entityDto.framework = component.framework;
    entityDto.description = component.description;
    entityDto.version = component.version;
    entityDto.username = component.username;
    entityDto.createdAt = component.createdAt.toISOString();
    entityDto.updatedAt = component.updatedAt?.toISOString() ?? 'none';

    return entityDto;
  }

  toEntityResultDto(component: Component) {
    const entityDto = this.toEntityDto(component);

    const componentResultDto = new ComponentResultDto();

    componentResultDto.result = entityDto;
    componentResultDto.success = true;

    return componentResultDto;
  }

  toEntityDtos(components: Component[]) {
    return components.map((component) => this.toEntityDto(component));
  }

  toCursorDto(args: {
    components: Component[];
    itemsLeft: number;
    startDate: Date;
    itemsSkipped: number;
  }) {
    const { components, itemsLeft, startDate, itemsSkipped } = args;

    const cursorDto = new ComponentCursorDto();

    cursorDto.data = this.toEntityDtos(components);
    cursorDto.itemsLeft = itemsLeft;
    cursorDto.startDate = startDate.toISOString();
    cursorDto.itemsSkipped = itemsSkipped;

    return cursorDto;
  }

  toCursorResultDto(args: {
    components: Component[];
    itemsLeft: number;
    startDate: Date;
    itemsSkipped: number;
  }) {
    const cursorDto = this.toCursorDto(args);

    const cursorResultDto = new ComponentCursorResultDto();

    cursorResultDto.result = cursorDto;
    cursorResultDto.success = true;

    return cursorResultDto;
  }
}
