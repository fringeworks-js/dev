import type { StringComparison } from '@fringeworks/utils/string/createStringMatcher';
import type { ParsedPath } from 'path';

/**
 * 一致条件\
 * 文字列・RegExp・StringComparison は `@fringeworks/utils` の `createStringMatcher` と同じルールでパスと比べる
 *
 * - string: パスと完全に一致する際にtrue
 * - RegExp: 指定された正規表現にパスが一致する際にtrue
 * - StringComparison: パスが部分一致・前方一致・後方一致・正規表現の比べ方（`{ includes }` など）にすべて合う際にtrue
 * - ConditionConfig: 条件設定に従って検査し一致したときにtrue
 * - ConditionFn: 関数がtrueを返したときにtrue
 */
export type IsMatchingPathCondition<
  O extends ConditionFnOptions = ConditionFnOptions,
> = ConditionItem<O> | ConditionConfig<O>;

/**
 * 条件設定の conditions に指定する一致条件の1つ（文字列・RegExp・StringComparison・ConditionFn）
 */
export type ConditionItem<O extends ConditionFnOptions = ConditionFnOptions> =
  string | RegExp | StringComparison | ConditionFn<O>;

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
      | 'path'
      | 'base'
      | 'name'
      | 'ext'
      | 'dirpath'
      | 'dirbase'
      | 'dirname'
      | 'dirext';

    /**
     * 検査対象の種別
     * `dir`・`file`の場合、存在しないパスは一致しない
     *
     * - dir: ディレクトリ
     * - file: ファイル
     * - both: 種別を問わない（存在しないパスも対象）
     *
     * @default 'both'
     */
    entryType?: EntryType;

    /**
     * 一致条件\
     * 配列で指定した場合は、どれかに合えば一致する（or条件）。
     * 複数の比べ方をすべて満たす条件（and条件）は、StringComparison に並べて書く（`{ startsWith: 'src/', endsWith: '.ts' }`）
     *
     * - string: 値と完全に一致
     * - RegExp: 指定された正規表現に一致
     * - StringComparison: 部分一致・前方一致・後方一致・正規表現の比べ方にすべて合う
     * - ConditionFn: 関数がtrueを返す
     */
    conditions: ConditionItem<O> | readonly ConditionItem<O>[];
  };

/**
 * 検査対象の種別
 *
 * - dir: ディレクトリ
 * - file: ファイル
 * - both: ディレクトリ & ファイル
 */
export type EntryType = 'dir' | 'file' | 'both';

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
// interface で定義したオプションも受け付けるよう、unknown ではなく any にする
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
