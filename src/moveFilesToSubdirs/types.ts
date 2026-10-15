import type { IsIncludedPathOptions } from '../isIncludedPath';

export type MoveFilesToSubdirsOptions = Omit<
  IsIncludedPathOptions,
  'entryType'
> & {
  /**
   * ファイルを移動した後の処理
   * @param subdirPath サブディレクトリのパス
   * @param fileName ファイル名
   */
  afterMove?: (subdirPath: string, fileName: string) => void;

  /**
   * 移動先にindexファイルを作る
   * 内容は`export { default, default as name } from './name';`
   */
  index?: boolean;
};
