import { posix as path } from 'path';

/**
 * パスを`/`区切りにして正規化する
 * Windowsの`\`区切りのパスも`/`区切りにする
 * @param targetPath パス
 */
export default function toPosixPath(targetPath: string) {
  return path.normalize(targetPath.replaceAll('\\', '/'));
}
