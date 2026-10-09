import type { PackageJson } from "type-fest";
import type { ExportEntryExtensions } from "../_internal/createExportEntry";
import type { IsMatchingPathCondition } from "../isMatchingPath";

export type CreateExportsOptions = ExportEntryExtensions & {
  /**
   * 探索するディレクトリのパス
   * @default 'src'
   */
  srcPath?: string;

  /**
   * exportsの値が指すファイル
   *
   * - src: `srcPath`配下のTypeScriptのファイル
   * - dist: ビルド後のファイル
   *
   * @default 'src'
   */
  target?: "src" | "dist";

  /**
   * exportsの値に付ける接頭辞
   * `target`が`src`の場合は`./<srcPath>/`、`dist`の場合は`./`がデフォルト
   */
  prefix?: string;

  /**
   * exportsに追加する対象のファイル
   * `index.ts`,`index.tsx`は常に対象となり、ここで指定した条件はそれに追加される
   * 拡張子が`.ts`,`.tsx`以外のファイルは対象外
   */
  include?: IsMatchingPathCondition[];

  /**
   * exportsに追加する対象から除外するファイル・ディレクトリ
   * 除外したディレクトリの配下は探索しない
   * @default DEFAULT_EXCLUDE
   */
  exclude?: IsMatchingPathCondition[];

  /**
   * 生成したものに加えて出力するエントリー
   * 生成したものとキーが重複した場合はこちらが優先される
   */
  extraExports?: Record<string, PackageJson.Exports>;
};
