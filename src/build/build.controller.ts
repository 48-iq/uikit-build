import { ComponentCreateDto } from '@48-iq/uikit-dto-lib';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BuildService } from './build.service';
import type { Request, Response } from 'express';

@Controller('/api/components')
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

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

    return await this.buildService.build({
      buffer: file.buffer,
      options: {
        name: body.name,
        framework,
        fileExtension: fileExtension,
        css: ['css'],
        username,
        dependencies: body.dependencies,
      },
    });
  }

  @Get('/:componentName')
  async get(
    @Param('componentName') componentName: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const stream = await this.buildService.get(componentName);
    const file = new StreamableFile(stream);
    return file;
  }
}
