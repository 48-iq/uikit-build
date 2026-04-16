export interface BuildOptions {
  username: string;
  framework: 'react' | 'vanilla';
  fileExtension: 'js' | 'ts' | 'jsx' | 'tsx';
  name: string;
  css: 'css'[]; // TODO: 'scss' | 'less' | 'styledComponents' | 'sass'
  dependencies: Record<string, string>; // "axios": "^1.13.6" ...
}
