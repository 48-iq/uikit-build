import { CssType, FileExtensionType, FrameworkType } from "./types";

export interface BuildOptions {
  version: string;
  framework: FrameworkType;
  fileExtension: FileExtensionType;
  name: string;
  username: string;
  css: CssType[]; // TODO: 'scss' | 'less' | 'styledComponents' | 'sass'
  dependencies: Record<string, string>; // "axios": "^1.13.6" ...
}
