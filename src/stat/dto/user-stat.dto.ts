import { DailyStatPointDto } from './component-stat.dto';

export class UserStatDto {
  username: string;
  totalComponents: number;
  totalBuilds: number;
  successBuilds: number;
  failedBuilds: number;
  pendingBuilds: number;
  runningBuilds: number;
  dailyLoadsChart: DailyStatPointDto[];
}
