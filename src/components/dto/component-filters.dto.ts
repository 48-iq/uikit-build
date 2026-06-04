import { Framework } from "src/postgres/entities/component.entity";
import { IsOptional, IsString, IsInt, IsEnum, IsDateString, IsArray, IsIn, Min, Max } from "class-validator";
import { Transform, Type } from "class-transformer";
import { ComponentTag } from "src/postgres/entities/component-tag.enum";

export class ComponentFiltersDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEnum(Framework)
  framework?: Framework;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return value.split(",").filter(Boolean);
    return value;
  })
  @IsArray()
  @IsEnum(ComponentTag, { each: true })
  tags?: ComponentTag[];

  @IsOptional()
  @IsIn(["asc", "desc"])
  sort?: "asc" | "desc";
}