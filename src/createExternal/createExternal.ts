import isMatchingPath from '../isMatchingPath';
import type { CreateExternalOptions, ExternalFunction } from './types';

/**
 * rolldownやrollupなどで内部モジュールのimport以外をexternalとして扱うための関数を作る関数
 * @param options
 */
export default function createExternal(
  options: CreateExternalOptions = {},
): ExternalFunction {
  const { isExternal, isInternal } = options;
  return (
    source: string,
    _importer: string | undefined,
    isResolved: boolean,
  ) => {
    const isMatchingPathOptions = {
      conditionOptions: {
        source,
        importer: _importer,
        isResolved,
      },
    };
    if (isMatchingPath(source, isExternal, isMatchingPathOptions)) {
      // 外部モジュール扱い
      return true;
    } else if (isMatchingPath(source, isInternal, isMatchingPathOptions)) {
      // 内部モジュール扱い
      return;
    } else if (!isResolved) {
      // 相対パスでもなく、srcディレクトリ配下でもないものは外部モジュール扱い
      return (
        !source.startsWith('.') &&
        !source.startsWith('/') &&
        !source.startsWith('src/')
      );
    }
    return;
  };
}
