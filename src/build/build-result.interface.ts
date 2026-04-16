export interface BuildResult {
  framework: 'react' | 'vanilla';
  fileExtension: 'js' | 'ts' | 'jsx' | 'tsx';
  componentName: string;
  css: 'css'[]; // TODO: 'scss' | 'less' | 'styledComponents' | 'sass'
  dependencies: Record<string, string>; // "axios": "^1.13.6" ...
}
