import { posix as path } from 'path';
import { isFunction, isString } from 'remeda';
import getEntryType from '../_internal/getEntryType';
import toPosixPath from '../_internal/toPosixPath';
import type {
  ConditionFnOptions,
  ConditionValues,
  IsMatchingPathCondition,
  IsMatchingPathOptions,
} from './types';

/**
 * 判定中に共有する値
 */
type MatchingContext<O extends ConditionFnOptions> = {
  values: ConditionValues;
  options: IsMatchingPathOptions<O>;
  /**
   * パスの種別（初めて必要になった時点で一度だけ確認する）
   */
  getEntryType: () => 'file' | 'dir' | undefined;
};

/**
 * 処理対象のパスか判定する
 * @param targetPath 検査対象のパス
 * @param conditions 一致条件
 * @param options オプション
 * @returns 一致するか
 */
export default function isMatchingPath<
  O extends ConditionFnOptions = ConditionFnOptions,
>(
  targetPath: string,
  conditions:
    | IsMatchingPathCondition<O>
    | IsMatchingPathCondition<O>[]
    | null
    | undefined,
  options: IsMatchingPathOptions<O> = {},
) {
  if (!conditions) {
    return false;
  }
  const conditionList = Array.isArray(conditions) ? conditions : [conditions];
  // パスは'/'区切り
  const posixPath = toPosixPath(targetPath);
  const parsedPath = path.parse(posixPath);
  const parsedDir = path.parse(parsedPath.dir);
  const values: ConditionValues = {
    path: posixPath,
    ...parsedPath,
    dirpath: parsedPath.dir,
    dirbase: parsedDir.base,
    dirname: parsedDir.name,
    dirext: parsedDir.ext,
  };
  let entryType: 'file' | 'dir' | undefined | null = null;
  const context: MatchingContext<O> = {
    values,
    options,
    getEntryType: () => {
      if (entryType === null) {
        entryType = getEntryType(posixPath);
      }
      return entryType;
    },
  };

  // conditionの内の何れかがtrueならば一致
  return conditionList.some((condition) =>
    _isMatching(values.path, condition, context),
  );
}

function _isMatching<O extends ConditionFnOptions>(
  value: string,
  condition: IsMatchingPathCondition<O>,
  context: MatchingContext<O>,
): boolean {
  if (isString(condition)) {
    // 条件が文字列
    return value.includes(condition);
  } else if (condition instanceof RegExp) {
    // 条件が正規表現
    return condition.test(value);
  } else if (isFunction(condition)) {
    // 条件が関数
    return condition(
      context.values,
      (context.options.conditionOptions ?? {}) as O,
    );
  }
  // 条件が設定
  const { valueType = 'path', entryType = 'both', conditions } = condition;
  if (entryType !== 'both' && context.getEntryType() !== entryType) {
    // 種別が異なる、または存在しない
    return false;
  }
  const conditionList = Array.isArray(conditions) ? conditions : [conditions];
  // 設定配下のconditionsはand条件
  return conditionList.every((cond) =>
    _isMatching(context.values[valueType], cond, context),
  );
}
