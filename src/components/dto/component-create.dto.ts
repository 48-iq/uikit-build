import { FrameworkType } from "src/build/types";

export class ComponentCreateDto {
  
  name: string;

  framework: FrameworkType;

  description: string;

  dependencies: string;

  tags: string[];
}
