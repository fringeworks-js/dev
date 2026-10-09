import type { CreateExportsOptions } from "../createExports";

export type WriteExportsOptions = CreateExportsOptions & {
  /**
   * 書き込み先のpackage.jsonのパス
   * @default 'package.json'
   */
  packageJsonPath?: string;

  /**
   * お試し
   * ファイルの操作は行わない
   */
  dryRun?: boolean;
};
