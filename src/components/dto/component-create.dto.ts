import { Transform } from 'class-transformer';
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

  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  dependencies: Record<string, string>;

  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return value;
  })
  @IsEnum(ComponentTag, { each: true })
  @IsArray()
  tags: ComponentTag[];
}
