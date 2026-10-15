import fs from 'fs-extra';
import path from 'path';
import { assertExists } from '../_internal/assertPath';
import type { InstallFromLocalOptions } from './types';

/**
 * パスを指す依存関係の指定（`file:`は除いた後の値）
 * 相対パス・絶対パス・Windowsの絶対パス
 */
const PATH_SPECIFIER = /^(?:\.{1,2}[\\/]|[\\/]|[a-zA-Z]:[\\/])/;

/**
 * ローカルに配置されたパッケージを差し替える\
 * package.jsonの依存関係のうち、`localNodeModulesPath`配下のパスを指すものをコピーする\
 * 依存関係のパスはpackage.jsonのあるディレクトリを基準に解決する\
 * `localNodeModulesPath`やpackage.jsonが存在しない場合は例外を投げる
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
  assertExists(resolvedLocalNodeModulesPath, resolvedPackageJsonPath);

  console.info(`${localNodeModulesPath} -> ${nodeModulesPath}`);

  // package.jsonからローカルのnode_modulesにあるパッケージを取得
  const packageJson = fs.readJSONSync(resolvedPackageJsonPath);
  const packageDir = path.dirname(resolvedPackageJsonPath);
  const dependencies: Record<string, unknown> = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const [packageName, specifier] of Object.entries(dependencies)) {
    if (typeof specifier !== 'string') {
      continue;
    }
    const localPath = specifier.replace(/^file:/, '');
    if (!PATH_SPECIFIER.test(localPath)) {
      continue;
    }
    const localPackagePath = path.resolve(packageDir, localPath);
    const relativePath = path.relative(
      resolvedLocalNodeModulesPath,
      localPackagePath,
    );
    if (
      !relativePath ||
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath)
    ) {
      // ローカルのnode_modules配下ではない
      continue;
    }
    // ローカルパッケージの確認
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
