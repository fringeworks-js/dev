import type { IsMatchingPathCondition } from '../isMatchingPath';

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
   * indexファイルを作らないディレクトリ
   */
  ignore?: IsMatchingPathCondition[];

  /**
   * indexファイルに入れる対象\
   * 未指定の場合は下記の条件がデフォルトで適用される
   *
   * - ファイル名が`_`で始まらず拡張子が`.ts`,`.tsx`,`.js`,`.jsx`のもの
   * - ディレクトリ名が`_`で始まらないもの
   */
  include?: IsMatchingPathCondition[];

  /**
   * indexファイルに入れる対象から除外するもの
   * includeに一致してもindexファイルに入れたくないものがある場合に指定する
   */
  exclude?: IsMatchingPathCondition[];

  /**
   * 同じindexファイル内にデフォルトエクスポートがある場合でも名前付きエクスポートをする\
   * デフォルトエクスポートしたモジュールをcjsへ変換したものへアクセスする際に、\
   * defaultという名前付きでアクセスしても問題ない場合はtrue
   */
  includeNamedWithDefault?: boolean;

  /**
   * exportの形式を下記にしたいもの
   *
   * ```
   * export * from './abc';
   * ```
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
