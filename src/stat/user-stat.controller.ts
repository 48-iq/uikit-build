import { Controller, Get, Param } from "@nestjs/common";
import { UserStatService } from "./user-stat.service";


@Controller('/api/components/stat/users')
export class UserStatController {

  constructor(
    private readonly userStatService: UserStatService
  ) {}

  @Get("/:username")
  async getUserStat(@Param('username') username: string) {
    return this.userStatService.getUserStat(username);
  }
}