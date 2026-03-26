import { ComponentCreateDto } from '@48-iq/uikit-dto-lib';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BuildService } from './build.service';
import type { Response } from 'express';

@Controller('/api/components')
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async build(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ComponentCreateDto,
  ) {
    return await this.buildService.build(file.buffer, body.name);
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
