import { defineConfig } from 'tsdown';
// 自身のビルドには、公開前のソースの createTsdownConfig を使う
import createTsdownConfig from './src/createTsdownConfig';

export default defineConfig(
  createTsdownConfig({
    exports: {
      extraExports: {
        // 各パッケージの tsconfig.json から extends する共通の設定
        './tsconfig.base.json': './tsconfig.base.json',
      },
    },
    copyFiles: ['tsconfig.base.json'],
  }),
);
