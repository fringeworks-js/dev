import fs from 'fs-extra';
import os from 'os';
import path from 'path';

/**
 * パスと内容の組み合わせ
 * パスが`/`で終わる場合は空のディレクトリを作る
 */
export type FileTree = Record<string, string>;

/**
 * 一時ディレクトリを作り、ファイルを書き込む
 * @param files 書き込むファイル
 * @returns 一時ディレクトリのパス
 */
export function createTempDir(files: FileTree = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fringeworks-dev-'));
  writeFiles(dir, files);
  return dir;
}

/**
 * ディレクトリ配下にファイルを書き込む
 * @param dir ディレクトリのパス
 * @param files 書き込むファイル
 */
export function writeFiles(dir: string, files: FileTree) {
  for (const [filePath, content] of Object.entries(files)) {
    if (filePath.endsWith('/')) {
      fs.ensureDirSync(path.join(dir, filePath));
    } else {
      fs.outputFileSync(path.join(dir, filePath), content);
    }
  }
}

/**
 * ディレクトリ配下のファイルを読み込む
 * @param dir ディレクトリのパス
 * @param filePath ディレクトリからの相対パス
 */
export function readFile(dir: string, filePath: string) {
  return fs.readFileSync(path.join(dir, filePath), 'utf8');
}

/**
 * ディレクトリ配下のファイルが存在するか
 * @param dir ディレクトリのパス
 * @param filePath ディレクトリからの相対パス
 */
export function exists(dir: string, filePath: string) {
  return fs.existsSync(path.join(dir, filePath));
}

/**
 * 一時ディレクトリを削除する
 * @param dir 一時ディレクトリのパス
 */
export function removeTempDir(dir: string) {
  fs.removeSync(dir);
}
