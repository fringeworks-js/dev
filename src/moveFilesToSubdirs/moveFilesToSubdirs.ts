import fs from 'fs-extra';
import path from 'path';
import { assertDirectory } from '../_internal/assertPath';
import { EXPORT_FORMS, isIdentifierName } from '../_internal/exportForms';
import isIncludedPath from '../isIncludedPath';
import type { MoveFilesToSubdirsOptions } from './types';

/**
 * 対象のディレクトリ直下のファイルを、拡張子を除いた同名のサブディレクトリ直下に移動する\
 * `dirPath`がディレクトリでない場合や、`index`を指定してファイル名がexport名に使えない場合は例外を投げる
 * @param dirPath 対象のディレクトリのパス
 * @param options オプション
 */
export default function moveFilesToSubdirs(
  dirPath: string,
  options: MoveFilesToSubdirsOptions = {},
) {
  const { afterMove, index, ...rest } = options;
  assertDirectory(dirPath);
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    if (isIncludedPath(itemPath, rest)) {
      const { name, ext } = path.parse(item);
      if (index && !isIdentifierName(name)) {
        throw new Error(
          `"${itemPath}" cannot be exported as "${name}" because it is not a valid identifier.`,
        );
      }
      // 移動先のディレクトリパスを生成
      const subdirPath = path.join(dirPath, name);
      // 移動先のディレクトリが存在しなければ作成
      fs.ensureDirSync(subdirPath);
      // 移動
      fs.moveSync(itemPath, path.join(subdirPath, item));
      if (index) {
        // generateIndexFilesのexportDefaultAndNamedと同じ形式で出力
        fs.writeFileSync(
          path.join(subdirPath, `index${ext}`),
          EXPORT_FORMS.exportDefaultAndNamed.generate(name) + '\n',
          {
            encoding: 'utf8',
          },
        );
      }
      if (afterMove) {
        afterMove(subdirPath, item);
      }
    }
  }
}
