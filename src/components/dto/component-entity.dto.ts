import { EntityDto } from '../../common/dto/entity.dto';

export class ComponentEntityDto extends EntityDto {
  name: string;
  username: string;
  framework: string;
  description: string;
  version: string;
}
