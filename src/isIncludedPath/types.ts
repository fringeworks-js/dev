import type {
  ConditionFnOptions,
  IsMatchingPathCondition,
} from "../isMatchingPath";

export type IsIncludedPathOptions<
  O extends ConditionFnOptions = ConditionFnOptions,
> = {
  /**
   * 対象の種別
   * @default 'file'
   */
  itemType?: "file" | "dir" | "both";

  /**
   * 対象とする条件
   * 未指定の場合は`defaultInclude`が適用される
   */
  include?: IsMatchingPathCondition<O>[];

  /**
   * 対象から除外する条件
   * 未指定の場合は`defaultExclude`が適用される
   */
  exclude?: IsMatchingPathCondition<O>[];

  /**
   * 対象とする条件のデフォルト
   * 未指定の場合は条件なし
   */
  defaultInclude?: IsMatchingPathCondition<O>[];

  /**
   * 対象から除外する条件のデフォルト
   * 未指定の場合は除外なし
   */
  defaultExclude?: IsMatchingPathCondition<O>[];
};
