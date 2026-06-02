import { Controller, Get, Param } from '@nestjs/common';
import { UserStatService } from './user-stat.service';
import { Public } from 'src/security/public.decorator';
import { UserStatResultDto } from './dto/user-stat-result.dto';

@Controller('/api/components/stat/users')
export class UserStatController {
  constructor(private readonly userStatService: UserStatService) {}

  @Public()
  @Get('/:username')
  async getUserStat(@Param('username') username: string): Promise<UserStatResultDto> {
    return this.userStatService.getUserStat(username);
  }
}
