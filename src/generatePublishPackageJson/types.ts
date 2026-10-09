import type { JsonReadOptions, JsonWriteOptions } from "fs-extra";
import type { PackageJson } from "type-fest";

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
   * 既定値は`.`,`./*`,`./constants`,`./*\/constants`の4つで、それぞれ下記の形式
   * @default
   * {
   *   '.': {
   *     import: { types: './index.d.mts', default: './index.mjs' },
   *     require: { types: './index.d.cts', default: './index.cjs' },
   *   },
   *   ...
   * }
   */
  exports?: PackageJson["exports"];

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
   */
  jsonWriteOptions?: JsonWriteOptions;
};
