import fs from 'fs-extra';
import path from 'path';
import { isFunction, merge } from 'remeda';
import { assertExists } from '../_internal/assertPath';

/**
 * JSONファイルを更新する\
 * ファイルが存在しない場合は例外を投げる
 * @param jsonFilePath JSONファイルのパス
 * @param editor 関数の場合は戻り値で置き換え、オブジェクトの場合は元の内容に浅くマージする
 */
function editJsonFile(
  jsonFilePath: string,
  editor: ((obj: any) => object) | object,
) {
  const resolvedJsonFilePath = path.resolve(jsonFilePath);
  assertExists(resolvedJsonFilePath);
  const obj = fs.readJSONSync(resolvedJsonFilePath);
  let editedJson;
  if (isFunction(editor)) {
    // 関数で編集する場合
    editedJson = editor(obj);
  } else {
    // 差分を反映する場合
    editedJson = merge(obj, editor);
  }
  fs.writeJSONSync(resolvedJsonFilePath, editedJson, { spaces: 2 });
}

export default editJsonFile;
