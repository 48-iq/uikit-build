import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { Public } from 'src/security/public.decorator';
import type { Response } from 'express';
import { PreviewService } from './preview.service';
import { ComponentService } from 'src/components/component.service';

@Controller('/api/components/previews')
export class PreviewController {

  constructor(
    private readonly previewService: PreviewService,
    private readonly componentService: ComponentService
  ) {
  }

  // @Public()
  // @Get('/:username/:name')
  // async previewMeta(
  //   @Param('username') username: string,
  //   @Param('name') name: string,
  // ) {
  //   const component = await this.componentService.getByUsernameAndName({
  //     username,
  //     name,
  //   });

  //   return {
  //     url: `/api/components/previews/${component.id}`,
  //   };
  // }

  @Public()
  @Get('/:id.js')
  async preview(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const stream = await this.previewService.getPreview(id);

    res.set({
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });

    return new StreamableFile(stream);
  }

  @Public()
  @Get('/:id/page')
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
              "react-dom/client": "https://esm.sh/react-dom@18/client",
              "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime"
            }
          }
          </script>
          <script>
            window.process = { env: { NODE_ENV: 'production' } };
            window.global = window;
          </script>
        </head>
        <body>
          <div id="root"></div>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              justify-content: center;
              padding: 20px;
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
              const mod = await import('/api/components/previews/${id}.js');
              document.getElementById('root').innerHTML = 
                '<pre>' + JSON.stringify(Object.keys(mod)) + '</pre>';
              const Component = mod.default 
                ?? Object.values(mod).find(v => typeof v === 'function');
              if (!Component) throw new Error('No component found in module: ' + JSON.stringify(Object.keys(mod)));
              createRoot(document.getElementById('root')).render(
                React.createElement(Component)
              );
              const reportHeight = () => {
                const height = document.getElementById('root').getBoundingClientRect().height;
                window.parent.postMessage({ type: 'resize', height }, '*');
              };
                requestAnimationFrame(() => {
                reportHeight();
                setTimeout(reportHeight, 100);
              });
              
              new ResizeObserver(reportHeight).observe(document.getElementById('root'));
            } catch (e) {
              document.body.innerHTML = '<pre style="color:red">' + e.stack + '</pre>';
            }
          </script>
        </body>
      </html>
    `;
  }
}
