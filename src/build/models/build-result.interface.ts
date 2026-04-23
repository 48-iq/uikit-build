import { CssType, FileExtensionType, FrameworkType } from "./types";

export interface BuildResult {
  id: string;
  version: string;
  framework: FrameworkType;
  fileExtension: FileExtensionType;
  name: string;
  username: string;
  css: CssType[];
  dependencies: Record<string, string>; // "axios": "^1.13.6" ...
}


