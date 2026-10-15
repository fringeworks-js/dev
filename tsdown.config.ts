import distPackage from '@fringeworks/rollup-plugin-dist-package';
import copy from 'rollup-plugin-copy';
import { defineConfig } from 'tsdown';
// 自身のビルドには、公開前のソースの createExternal を使う
import createExternal from './src/createExternal';

export default defineConfig({
  entry: ['./src/**/*.ts', '!./src/**/*.test.ts'],
  unbundle: true,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  minify: false,
  inputOptions: {
    external: createExternal(),
  },
  outputOptions: {
    // default exportとnamed exportを併用するため、CJSでも名前付きで出力する
    exports: 'named',
  },
  plugins: [
    distPackage({
      content: {
        exports: {
          '.': {
            import: './index.mjs',
            require: './index.cjs',
          },
          './*': {
            import: './*/index.mjs',
            require: './*/index.cjs',
          },
          // 各パッケージの tsconfig.json から extends する共通の設定
          './tsconfig.base.json': './tsconfig.base.json',
        },
      },
      resolveWorkspaceDeps: true,
      range: '^',
    }),
    copy({
      targets: [
        {
          src: ['LICENSE', 'README.md', 'README.ja.md', 'tsconfig.base.json'],
          dest: 'dist',
        },
      ],
    }),
  ],
});
