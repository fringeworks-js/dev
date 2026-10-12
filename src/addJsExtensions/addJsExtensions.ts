import fg from 'fast-glob';
import fs from 'fs-extra';

const PATTERNS = {
  '.js': /(?:from|import)\s*["'](\.\.?\/[^"']+)["']/g,
  '.cjs': /require\(["'](\.\.?\/[^"']+)["']\)/g,
};

/**
 * ローカルファイルのimportやrequireに拡張子を付与する
 * @param dir
 */
export default async function addJsExtensions(dir: string) {
  const files = await fg(`${dir}/**/*.{js,cjs}`);
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const ext = file.endsWith('.cjs') ? '.cjs' : '.js';
    const fixed = content.replace(PATTERNS[ext], (match, pos1) => {
      if (pos1.endsWith(ext)) {
        // 既に拡張子あり
        return match;
      }
      // 拡張子を付与
      return match.replace(pos1, `${pos1}${ext}`);
    });
    if (content !== fixed) {
      await fs.writeFile(file, fixed);
    }
  }
}
