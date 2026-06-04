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
import { dts } from 'rollup-plugin-dts';
import { create } from 'tar';
import * as fs from 'node:fs';
import { InjectMinio } from 'src/minio/minio.decorator';
import { MINIO_COMPONENTS_BUCKET } from 'src/minio/constants';
import { BuildLogService } from './build-log.service';
import { Component, Framework } from 'src/postgres/entities/component.entity';
import { Build } from 'src/postgres/entities/build.entity';

@Injectable()
export class RollupBuildService {
  private readonly logger = new Logger(RollupBuildService.name);

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
    const framework = component.framework;

    type Level = 'info' | 'warn' | 'error' | 'debug';
    const log = (msg: string, level: Level) =>
      this.buildLog.append(buildId, msg, level);

    const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;
    const src = path.join(tmpDir, 'lib', 'src');
    const dist = path.join(tmpDir, 'dist');

    try {
      await log(
        `Starting build: ${component.username}/${component.name}`,
        'info',
      );

      fs.mkdirSync(src, { recursive: true });
      fs.writeFileSync(path.join(src, `component.${ext}`), file.buffer);
      fs.writeFileSync(
        path.join(src, 'index.ts'),
        `export * from './component.${ext}';\nexport { default } from './component.${ext}';`,
      );
      fs.writeFileSync(
        path.join(tmpDir, 'lib', 'package.json'),
        this.packageJson(component, dependencies),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'lib', 'tsconfig.json'),
        this.tsconfigJson(framework),
      );
      await log('Project structure created', 'info');

      const external = this.external(framework, dependencies);
      const extensions = this.extensions(framework);
      const tsconfig = path.join(tmpDir, 'lib', 'tsconfig.json');

      const bundle = await rollup({
        input: path.join(src, 'index.ts'),
        external,
        plugins: [
          resolve({ extensions, browser: true }),
          typescript({ tsconfig }),
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
      await log('Rollup bundle created', 'info');

      await bundle.write({ dir: dist, format: 'esm', preserveModules: true });
      fs.copyFileSync(
        path.join(tmpDir, 'lib', 'package.json'),
        path.join(dist, 'package.json'),
      );
      await log('Bundle written to dist', 'info');

      const dtsBundle = await rollup({
        input: path.join(src, 'index.ts'),
        plugins: [dts({ tsconfig })],
        external,
      });
      await dtsBundle.write({
        dir: dist,
        format: 'esm',
        preserveModules: true,
      });
      await dtsBundle.close();
      await log('Type declarations generated', 'info');

      await create(
        {
          gzip: true,
          file: path.join(tmpDir, 'tar.tgz'),
          portable: true,
          strict: true,
          cwd: dist,
        },
        ['.'],
      );
      await log('Tarball created', 'info');

      const packageFilename = build.id;
      await this.minio.putObject(
        MINIO_COMPONENTS_BUCKET,
        packageFilename,
        fs.createReadStream(path.join(tmpDir, 'tar.tgz')),
      );
      await log(`Uploaded to MinIO: ${packageFilename}`, 'info');

      await bundle.close();
      await log('Build completed successfully!', 'info');
      return packageFilename;
    } catch (error: any) {
      this.logger.error(
        `Build ${component.username}/${component.name} failed`,
        error,
      );
      await log(`Build failed: ${error.message || error}`, 'error');
      return undefined;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  private external(
    framework: Framework,
    dependencies: Record<string, string>,
  ): string[] {
    const base =
      framework === 'react'
        ? ['react', 'react-dom']
        : framework === 'vue'
          ? ['vue']
          : [];
    return [...base, ...Object.keys(dependencies)];
  }

  private extensions(framework: Framework): string[] {
    const base = ['.js', '.jsx', '.ts', '.tsx'];
    return framework === 'vue' ? [...base, '.vue'] : base;
  }

  private packageJson(
    component: Component,
    dependencies: Record<string, string>,
  ): string {
    const framework = component.framework;
    return JSON.stringify({
      name: component.name,
      private: true,
      type: 'module',
      dependencies,
      peerDependencies:
        framework === 'react'
          ? { react: '^18 || ^19', 'react-dom': '^18 || ^19' }
          : framework === 'vue'
            ? { vue: '^3' }
            : {},
    });
  }

  private tsconfigJson(framework: Framework): string {
    return JSON.stringify({
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
    });
  }
}
