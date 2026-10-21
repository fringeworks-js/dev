import type { Config } from 'prettier';
import organizeImports from 'prettier-plugin-organize-imports';
import packageJson from 'prettier-plugin-packagejson';
import type { CreatePrettierConfigOptions } from './types';

/**
 * `@fringeworks` のパッケージで共通に使う Prettier の設定を作る
 * @param options
 */
export default function createPrettierConfig(
  options: CreatePrettierConfigOptions = {},
): Config {
  const { removeUnusedImports = false } = options;

  return {
    arrowParens: 'always',
    semi: true,
    useTabs: false,
    tabWidth: 2,
    bracketSpacing: true,
    singleQuote: true,
    printWidth: 80,
    trailingComma: 'all',
    endOfLine: 'auto',
    organizeImportsSkipDestructiveCodeActions: !removeUnusedImports,
    // 文字列で指定すると使う側のパッケージから解決されるため、読み込んだプラグインを渡す
    plugins: [organizeImports, packageJson],
  };
}
