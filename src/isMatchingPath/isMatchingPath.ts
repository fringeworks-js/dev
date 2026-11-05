import { createStringMatcher } from '@fringeworks/utils/string/createStringMatcher';
import { posix as path } from 'path';
import { isFunction } from 'remeda';
import getEntryType from '../_internal/_getEntryType';
import toPosixPath from '../_internal/_toPosixPath';
import type {
  ConditionConfig,
  ConditionFnOptions,
  ConditionItem,
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
  if (_isConditionConfig(condition)) {
    // 条件が設定
    const { valueType = 'path', entryType = 'both', conditions } = condition;
    if (entryType !== 'both' && context.getEntryType() !== entryType) {
      // 種別が異なる、または存在しない
      return false;
    }
    const conditionList: readonly ConditionItem<O>[] = Array.isArray(conditions)
      ? conditions
      : [conditions as ConditionItem<O>];
    // 設定配下のconditionsもor条件
    return conditionList.some((cond) =>
      _isMatching(context.values[valueType], cond, context),
    );
  }
  if (isFunction(condition)) {
    // 条件が関数
    return condition(
      context.values,
      (context.options.conditionOptions ?? {}) as O,
    );
  }
  // 文字列・正規表現・StringComparison は utils と同じルールで比べる（文字列は完全一致）
  return createStringMatcher(condition)(value);
}

/**
 * 条件設定か（StringComparison とは conditions の有無で見分ける）
 */
function _isConditionConfig<O extends ConditionFnOptions>(
  condition: IsMatchingPathCondition<O>,
): condition is ConditionConfig<O> {
  return (
    typeof condition === 'object' &&
    !(condition instanceof RegExp) &&
    'conditions' in condition
  );
}
