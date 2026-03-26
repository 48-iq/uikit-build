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

@Injectable()
export class BuildService {
  constructor(@InjectMinio() private readonly minio: Client) {}

  async build(buffer: Buffer, componentName) {
    const tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    }).name;

    const stream = Readable.from(buffer);

    await stream.pipe(unzipper.Extract({ path: tmpDir })).promise();

    const entry = path.join(tmpDir, '/react-lib/src/main.ts');

    const bundle = await rollup({
      input: entry,
      plugins: [
        resolve({
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        }),
        commonjs(),
        typescript({
          tsconfig: path.join(tmpDir, '/react-lib/tsconfig.json'),
        }),
        babel({
          babelHelpers: 'bundled',
          extensions: ['.js', '.ts', '.tsx'],
          presets: ['@babel/preset-typescript', '@babel/preset-react'],
        }),
      ],

      external: ['react', 'react-dom'],
    });

    await bundle.write({
      dir: path.join(tmpDir, '/dist'),
      format: 'esm',
      preserveModules: true,
    });

    const dtsBundle = await rollup({
      input: entry,
      plugins: [
        dts({
          tsconfig: path.join(tmpDir, '/react-lib/tsconfig.json'),
        }),
      ],
      external: ['react', 'react-dom'],
    });

    fs.copyFileSync(
      path.join(tmpDir, '/react-lib/package.json'),
      path.join(tmpDir, '/dist/package.json'),
    );

    await dtsBundle.write({
      dir: path.join(tmpDir, '/dist'),
      format: 'esm',
      preserveModules: true,
    });

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

    const objectName = `${componentName}-${Date.now()}.tgz`;

    const tarStream = fs.createReadStream(path.join(tmpDir, '/tar.tgz'));

    await this.minio.putObject(MINIO_COMPONENTS_BUCKET, objectName, tarStream);

    fs.rmSync(tmpDir, { recursive: true, force: true });

    return { objectName };
  }

  async get(objectName: string) {
    return await this.minio.getObject(MINIO_COMPONENTS_BUCKET, objectName);
  }
}
