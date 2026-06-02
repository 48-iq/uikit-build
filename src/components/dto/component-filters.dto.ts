import { Framework } from "src/postgres/entities/component.entity";

export class ComponentFiltersDto {
  username?: string;
  framework?: Framework;
  skip: number;
  limit: number;
  query?: string;
  startDate?: string;
  tags?: string[];
}
