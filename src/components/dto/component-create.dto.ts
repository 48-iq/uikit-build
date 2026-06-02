import { IsArray, IsEnum, IsObject, IsString } from 'class-validator';
import { ComponentTag } from 'src/postgres/entities/component-tag.enum';
import { Framework } from 'src/postgres/entities/component.entity';
export class ComponentCreateDto {
  @IsString()
  name: string;

  @IsEnum(Framework)
  framework: Framework;

  @IsString()
  description: string;

  @IsObject()
  dependencies: Record<string, string>;

  @IsEnum(ComponentTag, { each: true })
  @IsArray()
  tags: ComponentTag[];
}
