import fs from 'fs-extra';
import { pick } from 'remeda';
import type { PackageJson } from 'type-fest';
import { assertExists } from '../_internal/assertPath';
import createExportEntry from '../_internal/createExportEntry';
import type { GeneratePublishPackageJsonOptions } from './types';

/**
 * package.jsonから引き継ぐ項目
 * `@fringeworks/rollup-plugin-dist-package`の既定値に合わせる
 */
const INHERIT_PROPS = [
  'name',
  'version',
  'description',
  'keywords',
  'repository',
  'bugs',
  'homepage',
  'author',
  'contributors',
  'license',
  'type',
  'engines',
  'sideEffects',
] as const;

/**
 * exportsの後に引き継ぐ依存関係の項目
 */
const DEPENDENCIES_PROPS = [
  'dependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'optionalDependencies',
] as const;

/**
 * 公開用のpackage.jsonを生成する\
 * `packageJsonPath`が存在しない場合は例外を投げる
 * @param options オプション
 */
function generatePublishPackageJson(
  options: GeneratePublishPackageJsonOptions = {},
) {
  const {
    packageJsonPath = './package.json',
    outputPackageJsonPath = './dist/package.json',
    exports = {
      '.': createExportEntry('./index'),
      './*': createExportEntry('./*/index'),
    },
    transform = (pkgJson) => pkgJson,
    jsonReadOptions,
    jsonWriteOptions,
  } = options;
  assertExists(packageJsonPath);
  const packageJson = fs.readJSONSync(packageJsonPath, jsonReadOptions);
  const distPackageJson: PackageJson = {
    ...pick(packageJson, INHERIT_PROPS),
    exports,
    ...pick(packageJson, DEPENDENCIES_PROPS),
  };
  fs.outputJSONSync(
    outputPackageJsonPath,
    transform(distPackageJson),
    jsonWriteOptions ?? { spaces: 2 },
  );
}

export default generatePublishPackageJson;
