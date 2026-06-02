import { IsObject } from "class-validator";

export class ComponentNewVersionDto {
  @IsObject()
  dependencies: Record<string, string>;
}