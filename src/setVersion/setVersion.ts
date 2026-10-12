import fs from 'fs-extra';
import path from 'path';
import type { SetVersionOptions } from './types';

/**
 * ワークスペースのパッケージにバージョンを反映する
 * @param version バージョン
 * @param options オプション
 */
export default async function setVersion(
  version: string,
  options: SetVersionOptions = {},
) {
  const {
    workspacePackageJsonPath = 'package.json',
    packagesPath = 'packages',
  } = options;

  if (fs.existsSync(workspacePackageJsonPath)) {
    // ワークスペースのpackage.jsonを更新
    _updatePkgJson(version, workspacePackageJsonPath);
  }
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
