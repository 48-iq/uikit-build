import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { Public } from 'src/security/public.decorator';
import { LoadService } from './load.service';

@Controller()
export class LoadController {
  constructor(private readonly loadService: LoadService) {}

  @Public()
  @Get('/package/:username/:name/:version')
  async getPackage(
    @Param('username') username: string,
    @Param('name') name: string,
    @Param('version') version: string,
  ) {
    return new StreamableFile(
      await this.loadService.loadPackage({ username, name, version }),
    );
  }

  
}
