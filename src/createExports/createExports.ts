import fs from "fs-extra";
import { posix as path } from "path";
import type { PackageJson } from "type-fest";
import createExportEntry from "../_internal/createExportEntry";
import { DEFAULT_EXCLUDE } from "../constants";
import type { IsMatchingPathCondition } from "../isMatchingPath";
import isMatchingPath from "../isMatchingPath";
import type { CreateExportsOptions } from "./types";

/**
 * indexファイル
 */
const INDEX: IsMatchingPathCondition = {
  valueType: "base",
  entryType: "file",
  conditions: /^index\.(ts|tsx)$/i,
};

/**
 * 対象とするファイルの拡張子（型定義ファイルは除く）
 */
const TARGET_FILE = /^(?!.*\.d\.tsx?$).+\.(ts|tsx)$/i;

/**
 * 対象のディレクトリ配下のモジュールからpackage.jsonのexportsの値を作る
 * @param options
 */
export default function createExports(
  options: CreateExportsOptions = {},
): Record<string, PackageJson.Exports> {
  const {
    srcPath = "src",
    target = "src",
    prefix = target === "src" ? `./${path.normalize(srcPath)}/` : "./",
    include = [],
    exclude = DEFAULT_EXCLUDE,
    extraExports = {},
    ...extensions
  } = options;

  const modules = _collect(
    path.normalize(srcPath),
    [INDEX, ...include],
    exclude,
  );
  modules.sort((a, b) => (a.key > b.key ? 1 : -1));

  const exports: Record<string, PackageJson.Exports> = {};
  for (const { key, file } of modules) {
    if (target === "src") {
      exports[key] = prefix + file;
    } else {
      const { dir, name } = path.parse(file);
      exports[key] = createExportEntry(
        prefix + path.join(dir, name),
        extensions,
      );
    }
  }
  return { ...exports, ...extraExports };
}

/**
 * exportsの対象のモジュールを集める
 * @param dirPath 探索するディレクトリのパス
 * @param include 対象とする条件
 * @param exclude 除外する条件
 * @param current `srcPath`からの相対パス
 */
function _collect(
  dirPath: string,
  include: IsMatchingPathCondition[],
  exclude: IsMatchingPathCondition[],
  current: string = "",
) {
  const items = fs.readdirSync(dirPath);
  items.sort();
  const modules: { key: string; file: string }[] = [];

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    if (isMatchingPath(itemPath, exclude)) {
      continue;
    }
    const file = path.join(current, item);
    if (fs.statSync(itemPath).isDirectory()) {
      modules.push(..._collect(itemPath, include, exclude, file));
    } else if (TARGET_FILE.test(item) && isMatchingPath(itemPath, include)) {
      // indexファイルはディレクトリ名、それ以外はファイル名までをキーにする
      const keyPath = isMatchingPath(itemPath, INDEX)
        ? current
        : path.join(current, path.parse(item).name);
      modules.push({ key: keyPath ? `./${keyPath}` : ".", file });
    }
  }

  return modules;
}
