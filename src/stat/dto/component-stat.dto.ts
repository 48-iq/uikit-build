export class DailyStatPointDto {
  date: string;
  count: number;
}

export class ComponentStatDto {
  componentId: string;
  loadsTotal: number;
  loadsForYear: number;
  loadsForMonth: number;
  loadsForWeek: number;
  loadsForDay: number;
  dailyChart: DailyStatPointDto[];
}
