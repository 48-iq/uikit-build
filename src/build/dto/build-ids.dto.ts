import { IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class BuildIdsDto {
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
