import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';
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
import { BuildOptions, FileExtensionType } from './types';
import { MINIO_COMPONENTS_BUCKET, MINIO_PREVIEW_BUCKET } from 'src/minio/constants';
import { BuildTrackerService } from './build-tracker.service';

@Injectable()
export class RollupBuildService {
  private readonly logger = new Logger(RollupBuildService.name);

  constructor(@InjectMinio() private readonly minio: Client, private buildTracker: BuildTrackerService,) {}

  private async buildAndSavePreview(args: { tmpDir: string; options: BuildOptions }) {
    const { tmpDir, options } = args;

    if (Object.keys(options.dependencies).length > 0) {
      const deps = Object.entries(options.dependencies)
        .map(([name, ver]) => `${name}@${ver}`)
        .join(' ');
      execSync(`npm install ${deps}`, { cwd: path.join(tmpDir, 'lib') });
    }

    const bundle = await rollup({
      input: this.getEntry(tmpDir, options),
      plugins: [
        resolve({
          extensions: this.getExtensions(options),
          browser: true,
          preferBuiltins: false,
        }),
        commonjs(),
        this.getBabelPlugin(options),
        postcss({
          plugins: [classPrefix(`${options.username}__${options.name}__`)],
        }),
      ],
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    });

    await bundle.write({
      file: path.join(tmpDir, 'preview.js'),
      format: 'esm',
      inlineDynamicImports: true,
    });

    await this.minio.putObject(
      MINIO_PREVIEW_BUCKET,
      options.id,
      fs.createReadStream(path.join(tmpDir, 'preview.js')),
    );
  }

  async buildAndSave(args: { buffer: Buffer; options: BuildOptions; buildId: string }) {
    const { buffer, options, buildId } = args;

    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleDebug = console.debug;

    try {
      await this.buildTracker.appendLog(buildId, `Starting build: ${options.username}/${options.name}`);

      const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;

      const captureLog = (msg: any, level: 'info' | 'warn' | 'error' | 'debug' = 'info') => {
        try {
          const message = typeof msg === 'string' ? msg : msg?.message || JSON.stringify(msg, null, 2);
          this.buildTracker.appendLog(buildId, message, level).catch((e) => {
            originalConsoleError('Failed to save log:', e);
          });
        } catch (e) {
          originalConsoleError('Log capture error:', e);
        }
      };

      console.log = (...args: any[]) => { originalConsoleLog(...args); captureLog(args.join(' '), 'info'); };
      console.error = (...args: any[]) => { originalConsoleError(...args); captureLog(args.join(' '), 'error'); };
      console.warn = (...args: any[]) => { originalConsoleWarn(...args); captureLog(args.join(' '), 'warn'); };
      console.debug = (...args: any[]) => { originalConsoleDebug(...args); captureLog(args.join(' '), 'debug'); };

      fs.mkdirSync(path.join(tmpDir, 'lib', 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, 'lib', 'src', `component.${options.fileExtension}`),
        buffer,
      );

      this.createIndex(tmpDir, options);
      this.createPackageJson(tmpDir, options);
      this.createTsconfigJson(tmpDir, options);
      await this.buildTracker.appendLog(buildId, 'Project structure created');

      const bundle = await rollup({
        input: this.getEntry(tmpDir, options),
        plugins: this.getPlugins(tmpDir, options),
        external: this.getExternal(options),
        onwarn: (warning, warn) => {
          const message = warning.message || JSON.stringify(warning, null, 2);
          console.warn(`[Rollup WARN] ${message}`);
          this.buildTracker.appendLog(buildId, message, 'warn');
          warn(warning);
        },
      });
      await this.buildTracker.appendLog(buildId, 'Rollup bundle created');

      await bundle.write({
        dir: path.join(tmpDir, '/dist'),
        format: 'esm',
        preserveModules: true,
      });
      await this.buildTracker.appendLog(buildId, 'Bundle written to dist');

      fs.copyFileSync(
        path.join(tmpDir, '/lib/package.json'),
        path.join(tmpDir, '/dist/package.json'),
      );

      await this.createDts({ tmpDir, entry: this.getEntry(tmpDir, options), options });
      await this.buildTracker.appendLog(buildId, 'Type declarations generated');

      await this.buildAndSavePreview({ tmpDir, options });
      await this.buildTracker.appendLog(buildId, 'Preview built and saved');

      await create(
        {
          gzip: true,
          file: path.join(tmpDir, '/tar.tgz'),
          portable: true,
          strict: true,
          cwd: path.join(tmpDir, '/dist'),
        },
        ['.'],
      );
      await this.buildTracker.appendLog(buildId, 'Tarball created');

      const tarStream = fs.createReadStream(path.join(tmpDir, '/tar.tgz'));
      await this.minio.putObject(MINIO_COMPONENTS_BUCKET, options.id, tarStream);
      await this.buildTracker.appendLog(buildId, `Uploaded to MinIO: ${options.id}`);

      fs.rmSync(tmpDir, { recursive: true, force: true });
      await bundle.close();

      await this.buildTracker.appendLog(buildId, 'Build completed successfully!', 'info');
    } catch (error: any) {
      const errorMessage = error.message || error.toString();
      await this.buildTracker.appendLog(buildId, `Build failed: ${errorMessage}`, 'error');
      this.logger.error(`Build ${options.username}/${options.name} failed`, error);
      throw error;
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.debug = originalConsoleDebug;
    }
  }

  private getBabelPlugin(options: BuildOptions) {
    const presets: any[] = [
      '@babel/preset-typescript',
    ];

    if (options.framework === 'react') {
      presets.push([
        '@babel/preset-react',
        {
          runtime: 'automatic',
        },
      ]);
    } else if (options.framework === 'vue') {
      presets.push('babel-preset-vue');
    }

    return babel({
      babelHelpers: 'bundled',
      extensions: this.getExtensions(options),
      presets,
    });
  }

  private getPackageJson(options: BuildOptions): string {
    return JSON.stringify({
      name: options.name,
      private: true,
      version: options.version,
      type: 'module',
      dependencies: options.dependencies,
      peerDependencies:
        options.framework === 'react'
          ? {
              react: '^18 || ^19',
              'react-dom': '^18 || ^19',
            }
          : options.framework === 'vue'
            ? {
                vue: '^3',
              }
            : {},
    });
  }

  private getTsconfigJson(options: BuildOptions): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2023',
        module: 'ESNext',
        strict: true,
        moduleResolution: 'Node',
        esModuleInterop: true,
        skipLibCheck: true,
        jsx: 'react-jsx',
      },
      include: ['src'],
    });
  }

  private getEntry(tmpDir: string, options: BuildOptions): string {
    return path.join(tmpDir, 'lib', 'src', `index.ts`);
  }

  private getExtensions(options: BuildOptions) {
    const extensions: FileExtensionType[] = ['js', 'jsx', 'ts', 'tsx'];

    if (options.framework === 'vue') {
      extensions.push('vue');
    }
    return extensions.map((extension) => `.${extension}`);
  }

  private getPlugins(tmpDir: string, options: BuildOptions) {
    const plugins = [
      resolve({
        extensions: this.getExtensions(options),
        browser: true,
      }),
      typescript({
        tsconfig: path.join(tmpDir, 'lib', 'tsconfig.json'),
      }),
      commonjs(),
      this.getBabelPlugin(options),
      postcss({
        plugins: [classPrefix(`${options.username}__${options.name}__`)],
      }),
    ];
    return plugins;
  }

  private getExternal(options: BuildOptions) {
    let external: string[] = [];

    if (options.framework === 'react') {
      external = ['react', 'react-dom'];
    }

    if (options.framework === 'vue') {
      external = ['vue'];
    }

    //external.push(...Object.keys(options.dependencies));

    return external;
  }

  private createPackageJson(tmpDir: string, options: BuildOptions) {
    fs.writeFileSync(
      path.join(tmpDir, '/lib/package.json'),
      this.getPackageJson(options),
    );
  }

  private createTsconfigJson(tmpDir: string, options: BuildOptions) {
    fs.writeFileSync(
      path.join(tmpDir, '/lib/tsconfig.json'),
      this.getTsconfigJson(options),
    );
  }

  private createIndex(tmpDir: string, options: BuildOptions) {
    const index =
      `export * from './component.${options.fileExtension}';\n` +
      `export { default } from './component.${options.fileExtension}';`;

    fs.writeFileSync(path.join(tmpDir, '/lib/src/index.ts'), index);
  }

  private async createDts(args: {
    tmpDir: string;
    entry: string;
    options: BuildOptions;
  }) {
    const { tmpDir, entry, options } = args;
    const dtsBundle = await rollup({
      input: entry,
      plugins: [
        dts({
          tsconfig: path.join(tmpDir, '/lib/tsconfig.json'),
        }),
      ],
      external: this.getExternal(options),
    });

    await dtsBundle.write({
      dir: path.join(tmpDir, '/dist'),
      format: 'esm',
      preserveModules: true,
    });
  }
}
