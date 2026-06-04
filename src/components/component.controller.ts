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
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { ComponentService } from 'src/components/component.service';
import { ComponentMapper } from './component.mapper';
import { Public } from 'src/security/public.decorator';
import { RollupBuildService } from 'src/build/services/rollup-build.service';
import { ComponentCreateDto } from 'src/components/dto/component-create.dto';
import { BuildService } from 'src/build/services/build.service';
import { ComponentFiltersDto } from './dto/component-filters.dto';
import { AppError } from 'src/errors/app.error';
import { ERROR_CODE } from 'src/errors/error-code';
import { ComponentNewVersionDto } from './dto/component-new-version.dto';

@Controller('/api/components/main')
export class ComponentController {
  private readonly logger = new Logger(ComponentController.name);

  constructor(
    private readonly componentService: ComponentService,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ComponentCreateDto,
    @Req() req: Request,
  ) {
    const username = req['authPayload']['username'];

    return await this.componentService.create({ username, dto, file });
  }

  @Post('/:username/:name/version')
  @UseInterceptors(FileInterceptor('file'))
  async newVersion(
    @UploadedFile() file: Express.Multer.File,
    @Param('username') username: string,
    @Param('name') name: string,
    @Body() dto: ComponentNewVersionDto,
    @Req() req: Request,
  ) {
    const authUsername = req['authPayload']['username'];
    if (authUsername !== username) throw new AppError(ERROR_CODE.FORBIDDEN);

    return await this.componentService.postNewVersion({
      username,
      dependencies: dto.dependencies,
      name,
      file,
    });
  }

  @Public()
  @Get('/:username/:name')
  async get(
    @Param('username') username: string,
    @Param('name') name: string,
    @Query('version') version?: string,
  ) {
    return await this.componentService.getByNameAndUsername({
      name,
      username,
      version: version ? +version : undefined,
    });
  }

  @Public()
  @Get()
  async getMany(@Query() componentFiltersDto: ComponentFiltersDto) {
    return await this.componentService.getManyByFilters(componentFiltersDto);
  }
}
