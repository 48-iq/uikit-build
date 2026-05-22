import { Controller, Get, Param } from "@nestjs/common";
import { UserStatService } from "./user-stat.service";
import { Public } from "src/security/public.decorator";


@Controller('/api/components/stat/users')
export class UserStatController {

  constructor(
    private readonly userStatService: UserStatService
  ) {}

  @Public()
  @Get("/:username")
  async getUserStat(@Param('username') username: string) {
    return this.userStatService.getUserStat(username);
  }
}