import type { IsMatchingPathCondition } from "../isMatchingPath";

export type GenerateIndexFilesOptions = {
  /**
   * 処理対象のパス\
   * @default `src`
   */
  srcPath?: string;

  /**
   * indexのファイル名\
   * @default `index.ts`
   */
  indexFileName?: string;

  /**
   * indexファイルを作らないディレクトリ\
   * 一致したディレクトリの配下もたどらない
   * @default DEFAULT_IGNORE（名前が`_`で始まるディレクトリ）
   */
  ignore?: IsMatchingPathCondition[];

  /**
   * indexファイルに入れる対象\
   * 未指定の場合は下記の条件がデフォルトで適用される
   *
   * - 拡張子が`.ts`,`.tsx`,`.js`,`.jsx`のファイル
   * - 配下にindexファイルのあるディレクトリ
   */
  include?: IsMatchingPathCondition[];

  /**
   * indexファイルに入れる対象から除外するもの
   * includeに一致してもindexファイルに入れたくないものがある場合に指定する
   * @default DEFAULT_EXCLUDE（`__test__`配下、テストファイル、名前が`_`で始まるもの）
   */
  exclude?: IsMatchingPathCondition[];

  /**
   * 同じindexファイル内にデフォルトエクスポートがある場合でも名前付きエクスポートをする\
   * falseの場合は名前付きエクスポートを除外し、`exportDefaultAndNamed`はデフォルトエクスポートのみにする\
   * CJSへ変換する際に混在の警告が出る場合は、ビルドの出力設定を`exports: 'named'`にする
   * @default true
   */
  includeNamedWithDefault?: boolean;

  /**
   * exportの形式を下記にしたいもの
   *
   * ```
   * export * from './abc';
   * ```
   * @default DEFAULT_EXPORT_ALL（`constants.ts`と、配下にindexファイルのあるディレクトリ）
   */
  exportAll?: IsMatchingPathCondition[];

  /**
   * exportの形式を下記にしたいもの
   *
   * ```
   * export * as abc from './abc';
   * ```
   */
  exportAllAs?: IsMatchingPathCondition[];

  /**
   * exportの形式を下記にしたいもの
   *
   * ```
   * export { default } from './abc';
   * ```
   */
  exportDefault?: IsMatchingPathCondition[];

  /**
   * exportの形式を下記にしたいもの\
   * デフォルトエクスポートに加えて、同じものをファイル名で名前付きエクスポートする
   *
   * ```
   * export { default as abc, default } from './abc';
   * ```
   * @default DEFAULT_EXPORT_DEFAULT_AND_NAMED（親ディレクトリと同じ名前のファイル）
   */
  exportDefaultAndNamed?: IsMatchingPathCondition[];

  /**
   * exportの形式を下記にしたいもの
   *
   * ```
   * export { default as abc } from './abc';
   * ```
   */
  exportDefaultAs?: IsMatchingPathCondition[];

  /**
   * exportの形式を下記にしたいもの
   *
   * ```
   * export type * from './abc';
   * ```
   * @default DEFAULT_EXPORT_TYPE_ALL（`types.ts`）
   */
  exportTypeAll?: IsMatchingPathCondition[];

  /**
   * お試し\
   * ファイルの操作は行わない
   */
  dryRun?: boolean;

  /**
   * 出力前の編集
   */
  transform?: (exports: string[]) => string[];

  /**
   * 出力の改行コード
   *
   * @default os.EOL
   */
  eol?: string;

  /**
   * 出力のエンコード
   *
   * @default `utf8`
   */
  encoding?: BufferEncoding;
};
