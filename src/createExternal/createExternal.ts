import { posix as path } from 'path';
import toPosixPath from '../_internal/toPosixPath';
import isMatchingPath from '../isMatchingPath';
import type { CreateExternalOptions, ExternalFunction } from './types';

/**
 * 内部モジュールとして扱う解決前のパス
 *
 * - `.`: 相対パス
 * - `/`, `\`: 絶対パス
 * - `\0`: プラグインの仮想モジュール
 * - `#`: subpath imports
 * - `C:\`, `C:/`: Windowsの絶対パス
 */
const INTERNAL_SOURCE = /^(?:\.|\/|\\|\0|#|[a-zA-Z]:[\\/])/;

/**
 * rolldownやrollupなどで内部モジュールのimport以外をexternalとして扱うための関数を作る関数
 * @param options
 */
export default function createExternal(
  options: CreateExternalOptions = {},
): ExternalFunction {
  const { srcPath = 'src', isExternal, isInternal } = options;
  const srcPrefix = path.join(toPosixPath(srcPath), '/');
  return (
    source: string,
    importer: string | undefined,
    isResolved: boolean,
  ) => {
    const isMatchingPathOptions = {
      conditionOptions: { source, importer, isResolved },
    };
    if (isMatchingPath(source, isExternal, isMatchingPathOptions)) {
      // 外部モジュール扱い
      return true;
    } else if (isMatchingPath(source, isInternal, isMatchingPathOptions)) {
      // 内部モジュール扱い
      return;
    } else if (!isResolved) {
      // 相対パスや絶対パスなどでもなく、srcディレクトリ配下でもないものは外部モジュール扱い
      return !INTERNAL_SOURCE.test(source) && !source.startsWith(srcPrefix);
    }
    return;
  };
}
