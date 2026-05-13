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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { ComponentService } from 'src/components/component.service';
import { SourceService } from 'src/source/source.service';
import { ComponentMapper } from './component.mapper';
import { FileExtensionType, FrameworkType } from 'src/build/types';
import { Public } from 'src/security/public.decorator';
import { RollupBuildService } from 'src/build/rollup-build.service';
import { ComponentCreateDto } from 'src/components/dto/component-create.dto';

@Controller('/api/components')
export class ComponentController {
  private readonly logger = new Logger(ComponentController.name);

  constructor(
    private readonly buildService: RollupBuildService,
    private readonly componentService: ComponentService,
    private readonly sourceService: SourceService,
    private readonly componentMapper: ComponentMapper,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ComponentCreateDto,
    @Req() req: Request,
  ) {
    this.logger.log(JSON.stringify(req['authPayload']));
    const username = req['authPayload']['username'];

    const framework = body.framework as FrameworkType;

    const fileExtension = body.fileExtension as FileExtensionType;

    const css = JSON.parse(body.css);

    const dependencies = JSON.parse(body.dependencies);

    const component = await this.componentService.save({
      username,
      name: body.name,
      version: body.version,
      description: body.description,
      framework,
    });

    await this.sourceService.save(file.buffer, component.id);

    await this.buildService.buildAndSave({
      buffer: file.buffer,
      options: {
        id: component.id,
        version: body.version,
        name: body.name,
        framework,
        fileExtension: fileExtension,
        css: css,
        username,
        dependencies: dependencies,
      },
    });

    const result = this.componentMapper.toEntityResultDto(component);

    return result;
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
  @Get('/:username')
  async getManyByUser(
    @Param('username') username: string,
    @Query('startDate') startDate?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ) {
    const date = startDate === undefined ? new Date() : new Date(startDate);

    const result = await this.componentService.getMany({
      username,
      startDate: date,
      skip,
      limit,
    });

    return this.componentMapper.toCursorResultDto(result);
  }

  @Public()
  @Get()
  async getMany(
    @Query('startDate') startDate?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ) {
    const date = startDate === undefined ? new Date() : new Date(startDate);
    const result = await this.componentService.getMany({
      startDate: date,
      skip,
      limit,
      username: undefined,
    });
    return this.componentMapper.toCursorResultDto(result);
  }

  @Public()
  @Get('/package/:username/:name')
  async getPackage(
    @Param('username') username: string,
    @Param('name') name: string,
  ) {
   
    return new StreamableFile(await this.componentService.getPackage(username, name));
  }

}
