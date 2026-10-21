// 自身の設定には、公開前のソースの createPrettierConfig を使う
import createPrettierConfig from './src/createPrettierConfig/createPrettierConfig.ts';

export default createPrettierConfig({ removeUnusedImports: true });
