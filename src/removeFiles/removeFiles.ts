import fg, { type Pattern } from 'fast-glob';
import fs from 'fs-extra';
import type { RemoveFilesOptions } from './types';

/**
 * globパターンに一致するファイルを削除する
 * @param source fast-globのパターン
 * @param options fast-globのオプション（`cwd`を基準に削除するため、`absolute`は常に`true`）
 */
export default function removeFiles(
  source: Pattern | Pattern[],
  options: RemoveFilesOptions = {},
) {
  const files = fg.sync(source, { ...options, absolute: true });
  for (const file of files) {
    fs.removeSync(file);
  }
}
