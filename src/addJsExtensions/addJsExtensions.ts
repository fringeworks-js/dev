import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import { assertDirectory } from '../_internal/assertPath';
import getEntryType from '../_internal/getEntryType';

/**
 * 相対パスのimport・export・requireの指定子
 *
 * - `from './a'`, `import './a'`: 静的なimport・export
 * - `import('./a')`: 動的なimport
 * - `require('./a')`: CommonJSのrequire
 */
const RELATIVE_SPECIFIER =
  /(\b(?:from|import)\s*\(?\s*|\brequire\s*\(\s*)(["'])(\.\.?(?:\/[^"'\r\n]*)?)\2/g;

/**
 * ローカルファイルのimportやrequireに拡張子を付与する\
 * 指定子が指すファイルが存在する場合はそのまま、`<指定子><拡張子>`が存在する場合は拡張子を、
 * `<指定子>/index<拡張子>`が存在する場合は`/index<拡張子>`を付ける\
 * 拡張子は書き換えるファイルと同じもの（`.js`・`.mjs`・`.cjs`）を使う\
 * どれも存在しない場合は書き換えずに警告を出力する\
 * `dir`がディレクトリでない場合は例外を投げる
 * @param dir 対象のディレクトリのパス
 */
export default function addJsExtensions(dir: string) {
  assertDirectory(dir);
  const files = fg.sync('**/*.{js,mjs,cjs}', { cwd: dir, absolute: true });
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const ext = path.extname(file);
    const fixed = content.replace(
      RELATIVE_SPECIFIER,
      (match, prefix: string, quote: string, specifier: string) => {
        const resolved = _resolveSpecifier(file, specifier, ext);
        if (resolved === undefined) {
          console.warn(`${file}: Cannot resolve "${specifier}".`);
          return match;
        }
        return prefix + quote + resolved + quote;
      },
    );
    if (content !== fixed) {
      fs.writeFileSync(file, fixed);
    }
  }
}

/**
 * 拡張子を付けた指定子を返す
 * @param file 書き換えるファイルのパス
 * @param specifier 指定子
 * @param ext 付ける拡張子
 * @returns 拡張子を付けた指定子。指すファイルが無い場合は`undefined`
 */
function _resolveSpecifier(file: string, specifier: string, ext: string) {
  const basePath = path.resolve(path.dirname(file), specifier);
  if (!specifier.endsWith('/') && getEntryType(basePath) === 'file') {
    // 既にファイルを指している
    return specifier;
  }
  if (!specifier.endsWith('/') && getEntryType(basePath + ext) === 'file') {
    // 拡張子を付与
    return specifier + ext;
  }
  if (getEntryType(path.join(basePath, `index${ext}`)) === 'file') {
    // ディレクトリのindexファイル
    return `${specifier.replace(/\/$/, '')}/index${ext}`;
  }
  return undefined;
}
