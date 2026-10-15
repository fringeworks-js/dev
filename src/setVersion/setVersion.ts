import fs from 'fs-extra';
import path from 'path';
import { assertDirectory, assertExists } from '../_internal/assertPath';
import type { SetVersionOptions } from './types';

/**
 * ワークスペースのパッケージにバージョンを反映する\
 * ワークスペースのpackage.jsonや`packagesPath`が存在しない場合は例外を投げる
 * @param version バージョン
 * @param options オプション
 */
export default function setVersion(
  version: string,
  options: SetVersionOptions = {},
) {
  const {
    workspacePackageJsonPath = 'package.json',
    packagesPath = 'packages',
  } = options;
  assertExists(workspacePackageJsonPath);
  assertDirectory(packagesPath);

  // ワークスペースのpackage.jsonを更新
  _updatePkgJson(version, workspacePackageJsonPath);
  const pkgs = fs.readdirSync(packagesPath);
  for (const pkg of pkgs) {
    const packagePath = path.join(packagesPath, pkg);
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      // 各パッケージのpackage.jsonを更新
      _updatePkgJson(version, packageJsonPath);
    }
  }
}

function _updatePkgJson(version: string, packageJsonPath: string) {
  const packageJson = fs.readJsonSync(packageJsonPath, { encoding: 'utf8' });
  packageJson.version = version;
  fs.writeJsonSync(packageJsonPath, packageJson, {
    encoding: 'utf8',
    spaces: 2,
  });
}
