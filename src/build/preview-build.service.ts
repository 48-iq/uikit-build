import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'minio';
import { rollup } from 'rollup';
import postcss from 'rollup-plugin-postcss';
import * as path from 'path';
import * as tmp from 'tmp';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import classPrefix from 'postcss-class-prefix';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import * as fs from 'node:fs';
import { execSync } from 'child_process';
import { InjectMinio } from 'src/minio/minio.decorator';
import { FrameworkType } from './types';
import { MINIO_PREVIEW_BUCKET } from 'src/minio/constants';
import { BuildLogService } from './build-log.service';
import { Component } from 'src/postgres/entities/component.entity';
import { Build } from 'src/postgres/entities/build.entity';

@Injectable()
export class PreviewBuildService {
  private readonly logger = new Logger(PreviewBuildService.name);

  constructor(
    @InjectMinio() private readonly minio: Client,
    private readonly buildLog: BuildLogService,
  ) {}

  async buildAndSave(args: {
    build: Build;
    component: Component;
    file: Express.Multer.File;
    dependencies: Record<string, string>;
  }): Promise<string | undefined> {
    const { build, component, file, dependencies } = args;
    const buildId = build.id;
    const ext = file.originalname.split('.').pop()!;
    const framework = component.framework as FrameworkType;

    type Level = 'info' | 'warn' | 'error' | 'debug';
    const log = (msg: string, level: Level) =>
      this.buildLog.append(buildId, msg, level);

    const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;
    const src = path.join(tmpDir, 'lib', 'src');

    try {
      await log(
        `Starting preview build: ${component.username}/${component.name}`,
        'info',
      );

      fs.mkdirSync(src, { recursive: true });
      fs.writeFileSync(path.join(src, `component.${ext}`), file.buffer);
      fs.writeFileSync(
        path.join(src, 'index.ts'),
        `export * from './component.${ext}';\nexport { default } from './component.${ext}';`,
      );
      fs.writeFileSync(
        path.join(tmpDir, 'lib', 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2023',
            module: 'ESNext',
            strict: true,
            moduleResolution: 'Node',
            esModuleInterop: true,
            skipLibCheck: true,
            jsx: framework === 'vue' ? 'preserve' : 'react-jsx',
          },
          include: ['src'],
        }),
      );
      await log('Project structure created', 'info');

      if (Object.keys(dependencies).length > 0) {
        const deps = Object.entries(dependencies)
          .map(([n, v]) => `${n}@${v}`)
          .join(' ');
        execSync(`npm install ${deps}`, { cwd: path.join(tmpDir, 'lib') });
        await log('Dependencies installed', 'info');
      }

      const extensions = [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        ...(framework === 'vue' ? ['.vue'] : []),
      ];
      const external =
        framework === 'react'
          ? ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client']
          : framework === 'vue'
            ? ['vue']
            : [];

      const bundle = await rollup({
        input: path.join(src, 'index.ts'),
        external,
        plugins: [
          resolve({ extensions, browser: true, preferBuiltins: false }),
          typescript({ tsconfig: path.join(tmpDir, 'lib', 'tsconfig.json') }),
          commonjs(),
          babel({
            babelHelpers: 'bundled',
            extensions,
            presets: [
              '@babel/preset-typescript',
              framework === 'react'
                ? ['@babel/preset-react', { runtime: 'automatic' }]
                : 'babel-preset-vue',
            ],
          }),
          postcss({
            plugins: [
              classPrefix(`${component.username}__${component.name}__`),
            ],
          }),
        ],
        onLog: (level, l) => {
          log(l.message, level);
        },
        onwarn: (w) => {
          log(w.message || w.toString(), 'warn');
        },
      });

      const previewFile = path.join(tmpDir, 'preview.js');
      await bundle.write({
        file: previewFile,
        format: 'esm',
        inlineDynamicImports: true,
      });
      await bundle.close();
      await log('Preview bundle built', 'info');

      const previewFilename = `${component.username}/${component.name}/${build.id}.js`;
      await this.minio.putObject(
        MINIO_PREVIEW_BUCKET,
        previewFilename,
        fs.createReadStream(previewFile),
      );
      await log(`Preview uploaded to MinIO: ${previewFilename}`, 'info');

      return previewFilename;
    } catch (error: any) {
      this.logger.error(
        `Preview build ${component.username}/${component.name} failed`,
        error,
      );
      await log(`Preview build failed: ${error.message || error}`, 'error');
      return undefined;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}
