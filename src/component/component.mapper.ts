import { ComponentCreateResultDto, ComponentEntityDto, CursorDto, CursorResultDto } from '@48-iq/uikit-dto-lib';
import { Injectable } from '@nestjs/common';
import { Component } from 'src/postgres/entities/component.entity';

@Injectable()
export class ComponentMapper {
  toEntityDto(component: Component) {
    return new ComponentEntityDto({
      id: component.id,
      name: component.name,
      framework: component.framework,
      description: component.description,
      username: component.username,
      createdAt: component.createdAt.toISOString(),
      updatedAt: component.updatedAt?.toISOString() ?? 'none',
    });
  }

  toEntityDtos(components: Component[]) {
    return components.map((component) => this.toEntityDto(component));
  }

  toCursorResultDto(args: {
    components: Component[];
    itemsLeft: number;
    startDate: Date;
    itemsSkipped: number;
  }){
    const { components, itemsLeft, startDate, itemsSkipped } = args;
    const data = this.toEntityDtos(components);
    const cursorDto = new CursorDto<ComponentEntityDto>();
    cursorDto.data = data;
    cursorDto.itemsLeft = itemsLeft;
    cursorDto.startDate = startDate.toISOString();
    cursorDto.itemsSkipped = itemsSkipped;
    const cursorResultDto = new CursorResultDto<ComponentEntityDto>({
      result: cursorDto,
    });
    return cursorResultDto;
  }
}
