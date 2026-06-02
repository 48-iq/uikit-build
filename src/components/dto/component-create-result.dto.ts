import { ResultDto } from 'src/common/dto/result.dto';
import { ComponentEntityDto } from './component-entity.dto';
import { BuildEntityDto } from 'src/build/dto/build-entity.dto';

export class ComponentCreateResultDto extends ResultDto<{
  component: ComponentEntityDto;
  build: BuildEntityDto;
}> {}
