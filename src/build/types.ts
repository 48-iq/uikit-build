export type FrameworkType = 'react' | 'vue' | 'vanilla';

export type FileExtensionType = 'js' | 'ts' | 'jsx' | 'tsx' | 'vue';

export type CssType = 'css' | 'sass' | 'scss' | 'styled-components' | 'tailwind';

export type BuildOptions = {
  version: string;
  framework: FrameworkType;
  fileExtension: FileExtensionType;
  name: string;
  username: string;
  css: CssType[]; // TODO: 'scss' | 'less' | 'styledComponents' | 'sass'
  dependencies: Record<string, string>; // "axios": "^1.13.6" ...
  id: string;
};