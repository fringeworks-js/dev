import fs from 'fs-extra';

/**
 * パスの種別を返す
 * 存在しない場合や、ファイル・ディレクトリ以外の場合は`undefined`を返す
 * @param targetPath パス
 */
export default function getEntryType(
  targetPath: string,
): 'file' | 'dir' | undefined {
  const stat = fs.statSync(targetPath, { throwIfNoEntry: false });
  if (stat?.isFile()) {
    return 'file';
  }
  if (stat?.isDirectory()) {
    return 'dir';
  }
  return undefined;
}
