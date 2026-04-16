import { Injectable, Param } from '@nestjs/common';
import { Client } from 'minio';
import { InjectMinio } from 'src/minio/minio.decorator';
import { rollup } from 'rollup';
import * as unzipper from 'unzipper';
import * as path from 'path';
import * as tmp from 'tmp';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { Readable } from 'stream';
import { MINIO_COMPONENTS_BUCKET } from 'src/minio/constants';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import { dts } from 'rollup-plugin-dts';
import { create } from 'tar';
import * as fs from 'node:fs';
import { BuildServiceInterface } from './build-service.interface';
import { BuildOptions } from './build-options.interface';
import { BuildResult } from './build-result.interface';

@Injectable()
export class BuildService implements BuildServiceInterface {
  constructor(@InjectMinio() private readonly minio: Client) {}

  async build(args: {
    buffer: Buffer;
    options: BuildOptions;
  }): Promise<BuildResult> {
    const { buffer, options } = args;

    const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;

    fs.writeFileSync(
      path.join(tmpDir, `/lib/src/component.${options.fileExtension}`),
      buffer,
    );

    this.createMain(tmpDir, options);

    this.createPackageJson(tmpDir, options);

    if (options.fileExtension === 'ts' || options.fileExtension === 'tsx') {
      this.createTsconfigJson(tmpDir, options);
    }

    const entry = this.getEntry(tmpDir, options);

    const plugins = this.getPlugins(tmpDir, options);

    const external = this.getExternal(options);

    const bundle = await rollup({
      input: entry,
      plugins,
      external,
    });

    await bundle.write({
      dir: path.join(tmpDir, '/dist'),
      format: 'esm',
      preserveModules: true,
    });

    fs.copyFileSync(
      path.join(tmpDir, '/lib/package.json'),
      path.join(tmpDir, '/dist/package.json'),
    );

    if (options.fileExtension === 'ts' || options.fileExtension === 'tsx') {
      await this.createDts(tmpDir, entry);
    }

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

    const objectName = `${options.name}-${Date.now()}.tgz`;

    const tarStream = fs.createReadStream(path.join(tmpDir, '/tar.tgz'));

    await this.minio.putObject(MINIO_COMPONENTS_BUCKET, objectName, tarStream);

    fs.rmSync(tmpDir, { recursive: true, force: true });

    return {
      framework: options.framework,
      fileExtension: options.fileExtension,
      componentName: options.name,
      css: options.css,
      dependencies: options.dependencies,
    };
  }

  async get(objectName: string) {
    return await this.minio.getObject(MINIO_COMPONENTS_BUCKET, objectName);
  }

  private getBabelPlugin(options: BuildOptions) {
    const babelPresets: string[] = [];
    if (options.framework === 'react') {
      babelPresets.push('@babel/preset-react');
    }
    if (options.fileExtension === 'ts' || options.fileExtension === 'tsx') {
      babelPresets.push('@babel/preset-typescript');
    }
    return babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts', '.tsx', '.jsx'],
      presets: babelPresets,
    });
  }

  private getPackageJson(options: BuildOptions): string {
    let dependencies = {};
    if (options.framework === 'react') {
      ((dependencies['react'] = '^19.2.4'),
        (dependencies['react-dom'] = '^19.2.4'));
    }

    return JSON.stringify({
      name: 'react-lib',
      private: true,
      version: '0.0.0',
      type: 'module',
      dependencies,
    });
  }

  private getTsconfigJson(options: BuildOptions): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2023',
        module: 'ESNext',
        declaration: true,
        outDir: 'dist',
        strict: true,
        moduleResolution: 'Node',
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ['src'],
    });
  }

  private getEntry(tmpDir: string, options: BuildOptions): string {
    return path.join(tmpDir, `/lib/src/main.${options.fileExtension}`);
  }

  private getPlugins(tmpDir: string, options: BuildOptions) {
    const plugins = [
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
      commonjs(),
      this.getBabelPlugin(options),
    ];

    if (options.fileExtension === 'ts' || options.fileExtension === 'tsx') {
      plugins.push(
        typescript({
          tsconfig: path.join(tmpDir, '/lib/tsconfig.json'),
        }),
      );
    }
    return plugins;
  }

  private getExternal(options: BuildOptions) {
    let external: string[] = [];

    if (options.framework === 'react') {
      external = ['react', 'react-dom'];
    }

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

  private createMain(tmpDir: string, options: BuildOptions) {
    const main = `export * as ${options.name} from './component.${options.fileExtension}';`;
  }

  private async createDts(tmpDir: string, entry: string) {
    const dtsBundle = await rollup({
      input: entry,
      plugins: [
        dts({
          tsconfig: path.join(tmpDir, '/lib/tsconfig.json'),
        }),
      ],
      external: ['react', 'react-dom'],
    });

    await dtsBundle.write({
      dir: path.join(tmpDir, '/dist'),
      format: 'esm',
      preserveModules: true,
    });
  }
}
