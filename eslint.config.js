// 自身の設定には、公開前のソースの createESLintConfig を使う
import createESLintConfig from './src/createESLintConfig/createESLintConfig.ts';

export default createESLintConfig(import.meta.dirname);
