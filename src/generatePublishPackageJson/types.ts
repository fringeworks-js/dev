import type { JsonOutputOptions, JsonReadOptions } from 'fs-extra';
import type { PackageJson } from 'type-fest';

export type GeneratePublishPackageJsonOptions = {
  /**
   * package.jsonのパス
   * @default './package.json'
   */
  packageJsonPath?: string;

  /**
   * 出力先package.jsonファイルのパス
   * @default './dist/package.json'
   */
  outputPackageJsonPath?: string;

  /**
   * exportsに設定する値\
   * 既定値は`.`,`./*`の2つで、それぞれ下記の形式\
   * 定数は各ディレクトリのindexファイルからexportする前提のため、`./constants`などは含めない
   * @default
   * {
   *   '.': {
   *     import: { types: './index.d.mts', default: './index.mjs' },
   *     require: { types: './index.d.cts', default: './index.cjs' },
   *   },
   *   ...
   * }
   */
  exports?: PackageJson['exports'];

  /**
   * 任意の編集を行う関数
   * @param packageJson 既定の変換を行った後のpackage.jsonの内容
   * @returns 任意の編集を行った後のpackage.jsonの内容
   */
  transform?(packageJson: PackageJson): PackageJson;

  /**
   * package.json読み込み時のオプション
   */
  jsonReadOptions?: JsonReadOptions;

  /**
   * package.json書き込み時のオプション
   * @default { spaces: 2 }
   */
  jsonWriteOptions?: JsonOutputOptions;
};
