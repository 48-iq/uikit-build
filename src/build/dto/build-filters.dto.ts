import { IsOptional, IsString, IsEnum, IsInt, IsDateString, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { BuildStatus } from "src/postgres/entities/build.entity";

export class BuildFiltersDto {
  @IsOptional()
  @IsString()
  componentId?: string;

  @IsOptional()
  @IsEnum(BuildStatus)
  status?: BuildStatus;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  query?: string;
}