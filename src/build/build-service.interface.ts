import { BuildOptions } from './build-options.interface';
import { BuildResult } from './build-result.interface';

export interface BuildServiceInterface {
  buildAndSave(args: {
    componentId: string;
    buffer: Buffer;
    options: BuildOptions;
  }): Promise<BuildResult>;
}
