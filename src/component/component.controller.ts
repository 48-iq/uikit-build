import {
  ComponentCreateDto,
  ComponentCreateResultDto,
} from '@48-iq/uikit-dto-lib';
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
import { ComponentService } from 'src/component/component.service';
import { SourceService } from 'src/source/source.service';
import { ComponentMapper } from './component.mapper';
import { FileExtensionType, FrameworkType } from 'src/build/types';
import { Public } from 'src/security/public.decorator';
import { RollupBuildService } from 'src/build/rollup-build.service';

@Controller('/api/components')
export class ComponentController {

  private readonly logger = new Logger(ComponentController.name);

  constructor(
    private readonly buildService: RollupBuildService,
    private readonly componentService: ComponentService,
    private readonly sourceService: SourceService,
    private readonly componentMapper: ComponentMapper,
  ) {}


    
  @Public()
  @Get('/preview-page/:id')
  async previewPage(@Param('id') id: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@18",
              "react-dom": "https://esm.sh/react-dom@18",
              "react-dom/client": "https://esm.sh/react-dom@18/client"
            }
          }
          </script>
        </head>
        <body>
          <div id="root"></div>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
          </style>
          <script type="module">
            window.onerror = (...args) => {
              document.body.innerHTML =
                '<pre style="color:red">' + JSON.stringify(args, null, 2) + '</pre>';
            };
            try {
              const React = await import('react');
              window.React = React.default ?? React;
              const { createRoot } = await import('react-dom/client');
              const mod = await import('/api/component/preview/${id}.js');
              document.getElementById('root').innerHTML = 
                '<pre>' + JSON.stringify(Object.keys(mod)) + '</pre>';
              const Component = mod.default 
                ?? Object.values(mod).find(v => typeof v === 'function');
              if (!Component) throw new Error('No component found in module: ' + JSON.stringify(Object.keys(mod)));
              createRoot(document.getElementById('root')).render(
                React.createElement(Component)
              );
            } catch (e) {
              document.body.innerHTML = '<pre style="color:red">' + e.stack + '</pre>';
            }
          </script>
        </body>
      </html>
      `;
  }

  @Public()
  @Get('/preview/:id.js')
  async preview(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const stream =
      await this.componentService.getPreview(id);

    res.set({
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });

    return new StreamableFile(stream);
  }


  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async build(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ComponentCreateDto,
    @Req() req: Request,
  ) {
    this.logger.log(JSON.stringify(req['authPayload']))
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
    const component = await this.componentService.getByUsernameAndName({
      name,
      username,
    });

    return this.componentMapper.toEntityDto(component);
  }

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
  @Get('package/:username/:name')
  async getPackage(
    @Param('username') username: string,
    @Param('name') name: string,
  ) {
    const id = `${username}/${name}`;
    return new StreamableFile(await this.componentService.getPackage(id));
  }

  @Public()
  @Get('/preview/:username/:name')
  async previewMeta(
    @Param('username') username: string,
    @Param('name') name: string,
  ) {
    const component =
      await this.componentService.getByUsernameAndName({
        username,
        name,
      });

    return {
      url: `/api/components/preview/${component.id}`,
    };
  }
}
