import { CursorDto } from 'src/common/dto/cursor.dto';
import { ResultDto } from 'src/common/dto/result.dto';
import { ComponentEntityDto } from './component-entity.dto';

export class ComponentCursorResultDto extends ResultDto<CursorDto<ComponentEntityDto>> {}
