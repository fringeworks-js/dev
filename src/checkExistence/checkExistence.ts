import fs from 'fs-extra';

/**
 * ディレクトリ、ファイルの存在チェック
 * @param targetPaths
 * @param options
 */
export default function checkExistence(...targetPaths: string[]) {
  return targetPaths.every((targetPath) => {
    if (!fs.existsSync(targetPath)) {
      console.error(`${targetPath}が存在しません。`);
      return false;
    }
    return true;
  });
}
