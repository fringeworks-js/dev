import type { ParsedPath } from "path";

/**
 * 一致条件
 *
 * - string: 指定された文字列がパスに含まれているものに一致する際にtrue
 * - RegExp: 指定された正規表現にパスが一致する際にtrue
 * - ConditionConfig: 条件設定に従って検査し一致したときにtrue
 */
export type IsMatchingPathCondition<
  O extends ConditionFnOptions = ConditionFnOptions,
> = string | RegExp | ConditionConfig<O> | ConditionFn<O>;

export type IsMatchingPathOptions<
  O extends ConditionFnOptions = ConditionFnOptions,
> = {
  /**
   * ConditionFnに渡すオプション
   */
  conditionOptions?: O;
};

/**
 * 条件設定
 */
export type ConditionConfig<O extends ConditionFnOptions = ConditionFnOptions> =
  {
    /**
     * 検査対象の値
     *
     * - path: '/'で区切られたフルパス
     * - base: 拡張子付きのディレクトリ名 or ファイル名
     * - name: 拡張子を除いたディレクトリ名 or ファイル名
     * - ext: '.'を含む拡張子。拡張子が無い場合は空文字
     * - dirpath: '/'で区切られた親ディレクトリのフルパス
     * - dirbase: 拡張子付きの親ディレクトリ名
     * - dirname: 拡張子を除いた親ディレクトリ名
     * - dirext: '.'を含む親ディレクトリの拡張子。拡張子が無い場合は空文字
     *
     * @default 'path'
     */
    valueType?:
      | "path"
      | "base"
      | "name"
      | "ext"
      | "dirpath"
      | "dirbase"
      | "dirname"
      | "dirext";

    /**
     * 検査対象の種別
     *
     * - dir: ディレクトリ
     * - file: ファイル
     * - both: ディレクトリ & ファイル
     *
     * @default 'both'
     */
    entryType?: "dir" | "file" | "both";

    /**
     * 一致条件
     * 配列で指定した場合はand条件とする
     *
     * - string: 指定された文字列を含むものに部分一致
     * - RegExp: 指定された正規表現に一致
     */
    conditions:
      | string
      | RegExp
      | ConditionFn<O>
      | (string | RegExp | ConditionFn<O>)[];
  };

/**
 * カスタム条件関数
 */
export type ConditionFn<O extends ConditionFnOptions = ConditionFnOptions> = (
  values: ConditionValues,
  options: O,
) => boolean;

/**
 * カスタム条件関数のオプション
 */
export type ConditionFnOptions = Record<string, any>;

/**
 * 検証対象の値
 */
export type ConditionValues = {
  path: string;
  dirpath: string;
  dirbase: string;
  dirname: string;
  dirext: string;
} & ParsedPath;
