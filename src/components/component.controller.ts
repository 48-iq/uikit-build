import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { ComponentService } from 'src/components/component.service';
import { ComponentMapper } from './component.mapper';
import { Public } from 'src/security/public.decorator';
import { RollupBuildService } from 'src/build/rollup-build.service';
import { ComponentCreateDto } from 'src/components/dto/component-create.dto';
import { BuildService } from 'src/build/build.service';

@Controller('/api/components/main')
export class ComponentController {
  private readonly logger = new Logger(ComponentController.name);

  constructor(
    private readonly rollupBuildService: RollupBuildService,
    private readonly componentService: ComponentService,
    private readonly sourceService: SourceService,
    private readonly componentMapper: ComponentMapper,
    private buildService: BuildService,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFiles() file: Express.Multer.File,
    @Body() dto: ComponentCreateDto,
    @Req() req: Request,
  ) {
    const username = req['authPayload']['username'];
    
    
    const component = await this.componentService.create({ username, dto }); // +

    return this.componentMapper.toEntityResultDto(component);
  }

  @Post('/:componentId/version')
  @UseInterceptors(FileInterceptor('file'))
  async version(
    @UploadedFiles() file: Express.Multer.File,
    @Param('componentId') componentId: string,
    @Req() req: Request,
  ) {
    const username = req['authPayload']['username'];
    

  }

  @Public()
  @Get('/:username/:name')
  async get(
    @Param('username') username: string,
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const component = await this.componentService.getByUsernameAndName({
      name,
      username,
    });

    return this.componentMapper.toEntityDto(component);
  }

  @Public()
  @Get()
  async getMany(
    @Query('startDate') startDate?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
    @Query('query') query?: string,
    @Query('framework') framework?: string,
    @Query('username') username?: string,
    @Query('name') name?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.componentService.getManyByFilters({
      startDate: startDate === undefined ? new Date() : new Date(startDate),
      skip,
      limit: limit === undefined ? 20 : limit,
      query,
      framework,
      username,
      name,
      sort: sort === undefined ? 'desc' : sort === 'asc' ? 'asc' : 'desc',
    });

    return this.componentMapper.toCursorDto(result);
  }
}
