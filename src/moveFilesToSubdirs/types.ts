import type { IsIncludedPathOptions } from "../isIncludedPath";

export type MoveFilesToSubdirsOptions = Omit<
  IsIncludedPathOptions,
  "itemType"
> & {
  /**
   * ファイル毎の後処理
   * @param subdirPath サブディレクトリのパス
   * @param fileName ファイル名
   */
  process?: (subdirPath: string, fileName: string) => void;

  /**
   * indexファイルの作成
   */
  index?: boolean;
};
