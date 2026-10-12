import fs from 'fs-extra';
import createExports from '../createExports';
import type { WriteExportsOptions } from './types';

/**
 * 対象のディレクトリ配下のモジュールをpackage.jsonのexportsに設定する
 * 既存のexportsは置き換える
 * @param options
 */
export default function writeExports(options: WriteExportsOptions = {}) {
  const { packageJsonPath = 'package.json', dryRun, ...rest } = options;

  const packageJson = fs.readJsonSync(packageJsonPath, { encoding: 'utf8' });
  packageJson.exports = createExports(rest);
  if (dryRun) {
    console.log(JSON.stringify(packageJson.exports, null, 2));
  } else {
    fs.writeJsonSync(packageJsonPath, packageJson, {
      encoding: 'utf8',
      spaces: 2,
    });
  }
}
