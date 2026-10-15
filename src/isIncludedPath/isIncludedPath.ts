import getEntryType from '../_internal/getEntryType';
import type { ConditionFnOptions } from '../isMatchingPath';
import isMatchingPath from '../isMatchingPath';
import type { IsIncludedPathOptions } from './types';

/**
 * パスが対象に含まれるか判定する
 * 存在しないパスは含まれない
 * @param itemPath 検査対象のパス
 * @param options オプション
 */
export default function isIncludedPath<
  O extends ConditionFnOptions = ConditionFnOptions,
>(itemPath: string, options: IsIncludedPathOptions<O> = {}) {
  const {
    entryType = 'file',
    defaultInclude,
    defaultExclude,
    include = defaultInclude,
    exclude = defaultExclude,
    ...rest
  } = options;
  const actualEntryType = getEntryType(itemPath);

  return (
    actualEntryType !== undefined &&
    (entryType === 'both' || actualEntryType === entryType) &&
    (!include || isMatchingPath(itemPath, include, rest)) &&
    (!exclude || !isMatchingPath(itemPath, exclude, rest))
  );
}
