import distPackage from '@fringeworks/rollup-plugin-dist-package';
import fs from 'fs';
import type { UserConfig } from 'tsdown';
import createExports from '../createExports';
import createExternal from '../createExternal';
import createFixCssRequirePlugin from './_createFixCssRequirePlugin';
import type { CreateTsdownConfigOptions } from './types';

/**
 * ビルドの対象の既定値
 */
const DEFAULT_ENTRY = [
  'src/**/*.{ts,tsx}',
  '!src/**/*.test.{ts,tsx}',
  '!src/**/*.test-d.{ts,tsx}',
  '!src/**/*.spec.{ts,tsx}',
  '!src/**/*.d.{ts,tsx}',
];

/**
 * 出力先にコピーするファイル（存在するものだけをコピーする）
 */
const COPY_FILES = ['LICENSE', 'README.md', 'README.ja.md'];

/**
 * `@fringeworks` のパッケージで共通に使う tsdown の設定を作る
 * `dist` 配下に、公開用の `package.json` を含めて出力する
 * @param options
 */
export default function createTsdownConfig(
  options: CreateTsdownConfigOptions = {},
): UserConfig {
  const {
    css = false,
    exports = {},
    entry = DEFAULT_ENTRY,
    copyFiles = [],
  } = options;

  return {
    entry,
    format: ['esm', 'cjs'],
    dts: true,
    unbundle: true,
    sourcemap: false,
    clean: true,
    outDir: 'dist',
    minify: false,
    ...(css && { css: { inject: true } }),
    copy: [...COPY_FILES.filter((file) => fs.existsSync(file)), ...copyFiles],
    inputOptions: {
      external: createExternal(),
    },
    outputOptions: {
      preserveModules: true,
      preserveModulesRoot: 'src',
      // default exportとnamed exportを併用するため、CJSでも名前付きで出力する
      exports: 'named',
    },
    plugins: [
      distPackage({
        content: {
          main: './index.cjs',
          module: './index.mjs',
          types: './index.d.cts',
          sideEffects: css ? ['**/*.css'] : false,
          exports: createExports({
            ...exports,
            target: 'dist',
            extraExports: {
              './package.json': './package.json',
              ...exports.extraExports,
            },
          }),
        },
        resolveWorkspaceDeps: true,
        range: '^',
      }),
      ...(css ? [createFixCssRequirePlugin()] : []),
    ],
  };
}
