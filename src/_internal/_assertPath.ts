import fs from 'fs-extra';

/**
 * パスが存在しない場合は例外を投げる
 * @param targetPaths パス
 */
export function assertExists(...targetPaths: string[]) {
  for (const targetPath of targetPaths) {
    if (!fs.existsSync(targetPath)) {
      throw new Error(`"${targetPath}" does not exist.`);
    }
  }
}

/**
 * パスがディレクトリでない場合は例外を投げる
 * @param targetPath パス
 */
export function assertDirectory(targetPath: string) {
  assertExists(targetPath);
  if (!fs.statSync(targetPath).isDirectory()) {
    throw new Error(`"${targetPath}" is not a directory.`);
  }
}
