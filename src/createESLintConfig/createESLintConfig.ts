import js from '@eslint/js';
import type { Linter } from 'eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import type { CreateESLintConfigOptions } from './types';

/**
 * lint の対象外とするディレクトリ（ビルド・テストの出力）
 */
const IGNORES = [
  '**/dist/',
  '**/coverage/',
  '**/storybook-static/',
  '**/test-results/',
];

/**
 * テストと stories のファイル（公開しない開発用のコード）
 */
const DEV_ONLY_FILES = [
  '**/*.test.{ts,tsx}',
  '**/*.test-d.{ts,tsx}',
  'e2e/**',
  'stories/**',
];

/**
 * `@fringeworks` のパッケージで共通に使う ESLint の設定（flat config）を作る
 * @param rootDir パッケージのルートディレクトリ（`import.meta.dirname`）。typescript-eslint の `tsconfigRootDir` に渡す
 * @param options
 */
export default function createESLintConfig(
  rootDir: string,
  options: CreateESLintConfigOptions = {},
): Linter.Config[] {
  const { react = false } = options;

  return defineConfig([
    globalIgnores(IGNORES),
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        react ? [reactHooks.configs.flat.recommended] : [],
      ],
      languageOptions: {
        parserOptions: {
          // 複数のパッケージの設定を同じプロセスで読み込むと推測できないため、明示する
          tsconfigRootDir: rootDir,
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        // `_` で始まる名前と、rest で残りを取り出すために分割代入した名前は、使っていなくても許容する
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
      },
    },
    {
      files: DEV_ONLY_FILES,
      rules: {
        // テストでは不正な値を渡し、stories では DOM などを手軽に操作するために any を使う
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ]);
}
