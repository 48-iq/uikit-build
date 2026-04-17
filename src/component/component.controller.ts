import {
  ComponentCreateDto,
  ComponentCreateResultDto,
  ComponentEntityDto,
} from '@48-iq/uikit-dto-lib';
import {
  Body,
  Controller,
  Get,
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
import { BuildService } from '../build/build.service';
import type { Request, Response } from 'express';
import { ComponentService } from 'src/component/component.service';
import { SourceService } from 'src/source/source.service';
import { ComponentMapper } from './component.mapper';
import { time } from 'console';

@Controller('/api/components')
export class ComponentController {
  constructor(
    private readonly buildService: BuildService,
    private readonly componentService: ComponentService,
    private readonly sourceService: SourceService,
    private readonly componentMapper: ComponentMapper,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async build(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ComponentCreateDto,
    @Req() req: Request,
  ) {
    const username = req['authPayload']['username'];
    const framework = body.framework === 'react' ? 'react' : 'vanilla';
    const fileExtension =
      body.fileExtension === 'ts'
        ? 'ts'
        : body.fileExtension === 'tsx'
          ? 'tsx'
          : body.fileExtension === 'js'
            ? 'js'
            : 'jsx';
    const css = JSON.parse(body.css);
    const dependencies = JSON.parse(body.dependencies);
    const build = await this.buildService.buildAndSave({
      buffer: file.buffer,
      options: {
        name: body.name,
        framework,
        fileExtension: fileExtension,
        css: css,
        username,
        dependencies: dependencies,
      },
    });

    const component = await this.componentService.save({
      build,
      description: body.description,
    });

    await this.sourceService.save(file.buffer, build.id);

    const result = new ComponentCreateResultDto({
      result: this.componentMapper.toEntityDto(component),
    });
    return result;
  }

  @Get('/:username/:name')
  async get(
    @Param('username') username: string,
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const componentId = `${username}/${name}`;

    const component = await this.componentService.getOne(componentId);
    
    return this.componentMapper.toEntityDto(component); 
  }

  @Get('/:username')
  async getManyByUser(
    @Param('username') username: string,
    @Query('startDate') startDate?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number
  ) {
    const date = startDate === undefined ? new Date() : new Date(startDate);
    

    const result = await this.componentService.getMany({
      username,
      startDate: date,
      skip,
      limit
    });

    return this.componentMapper.toCursorResultDto(result);
  }

  @Get()
  async getMany(
    @Query('startDate') startDate?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number
  ){
    const date = startDate === undefined ? new Date() : new Date(startDate);
    const result = await this.componentService.getMany({ startDate: date, skip, limit, username: undefined });
    return this.componentMapper.toCursorResultDto(result);
  }

  @Get('package/:username/:name')
  async getPackage(@Param('username') username: string, @Param('name') name: string) {
    const id = `${username}/${name}`;
    return new StreamableFile(await this.componentService.getPackage(id));
  }
}
