import { CursorDto } from "src/common/dto/cursor.dto";
import { ResultDto } from "src/common/dto/result.dto";
import { BuildEntityDto } from "./build-entity.dto";

export class BuildCursorResultDto extends ResultDto<CursorDto<BuildEntityDto>> {
}