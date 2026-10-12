import fs, { Stats } from 'fs-extra';
import type { ConditionFnOptions } from '../isMatchingPath';
import isMatchingPath from '../isMatchingPath';
import type { IsIncludedPathOptions } from './types';

const IS_TARGET_TYPE = {
  file: (stat: Stats) => stat.isFile(),
  dir: (stat: Stats) => stat.isDirectory(),
  both: (stat: Stats) => stat.isFile() || stat.isDirectory(),
} as const;

export default function isIncludedPath<
  O extends ConditionFnOptions = ConditionFnOptions,
>(itemPath: string, options: IsIncludedPathOptions<O> = {}) {
  const {
    itemType = 'file',
    defaultInclude,
    defaultExclude,
    include = defaultInclude,
    exclude = defaultExclude,
    ...rest
  } = options;
  const stat = fs.statSync(itemPath);

  return (
    IS_TARGET_TYPE[itemType](stat) &&
    (!include || isMatchingPath(itemPath, include, rest)) &&
    (!exclude || !isMatchingPath(itemPath, exclude, rest))
  );
}
