import fs from 'fs-extra';
import path from 'path';
import { reduce } from 'remeda';
import checkExistence from '../checkExistence';
import type { InstallFromLocalOptions } from './types';

/**
 * ローカルに配置されたパッケージを差し替える
 * @param localNodeModulesPath ローカルのnode_modulesディレクトリのパス
 * @param options オプション
 */
export default function installFromLocal(
  localNodeModulesPath: string,
  options: InstallFromLocalOptions = {},
) {
  const {
    packageJsonPath = './package.json',
    nodeModulesPath = './node_modules',
    dryRun,
  } = options;
  const resolvedLocalNodeModulesPath = path.resolve(localNodeModulesPath);
  const resolvedPackageJsonPath = path.resolve(packageJsonPath);

  if (!checkExistence(resolvedLocalNodeModulesPath, resolvedPackageJsonPath)) {
    return;
  }

  console.info(`${localNodeModulesPath} -> ${nodeModulesPath}`);

  // package.jsonからローカルのnode_modulesにあるパッケージを取得
  const packageJson = fs.readJSONSync(resolvedPackageJsonPath);
  const localPackages = reduce(
    { ...packageJson.dependencies, ...packageJson.devDependencies },
    (result: Record<string, string>, value: string, key) => {
      if (value.startsWith(localNodeModulesPath)) {
        result[key] = value;
      } else if (value.startsWith(`file:${localNodeModulesPath}`)) {
        result[key] = value.substring(5);
      }
      return result;
    },
    {},
  );

  for (const packageName in localPackages) {
    // ローカルパッケージの確認
    const localPackagePath = path.resolve(localPackages[packageName]);
    if (fs.existsSync(localPackagePath)) {
      // ローカルパッケージがある場合のみ処理
      const installedPackagePath = path.resolve(nodeModulesPath, packageName);
      if (!dryRun) {
        // コピーを行う
        if (fs.existsSync(installedPackagePath)) {
          // 古いパッケージは削除
          fs.removeSync(installedPackagePath);
        }
        // パッケージをコピー
        fs.copySync(localPackagePath, installedPackagePath);
      }
      console.info(`${packageName} is being copied...`);
    }
  }
}
