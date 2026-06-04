import { Transform } from "class-transformer";
import { IsObject } from "class-validator";

export class ComponentNewVersionDto {
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
}