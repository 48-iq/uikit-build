import { ComponentTag } from 'src/postgres/entities/component-tag.enum';
import { EntityDto } from '../../common/dto/entity.dto';

export class ComponentEntityDto extends EntityDto {
  name: string;
  username: string;
  framework: string;
  description: string;
  tags: ComponentTag[];
  version: number | null;
  buildId: string | null;
}
